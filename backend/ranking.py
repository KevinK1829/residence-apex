"""Core ranking logic: assign bronze/silver/gold/platinum tiers to zip codes."""

import pandas as pd

META_COLS = ["RegionID", "RegionName", "State", "City", "Metro", "CountyName"]

# Percentile thresholds (within-metro, based on avg home value)
# platinum: top 10%  (>= 90th)
# gold:     10–30%   (70th–90th)
# silver:   30–60%   (40th–70th)
# bronze:   bottom 60% (< 40th)
_THRESHOLDS = [
    (0.90, "platinum"),
    (0.70, "gold"),
    (0.40, "silver"),
    (0.00, "bronze"),
]


def _assign_tier(pct_rank: float) -> str:
    """Map a within-metro percentile rank [0, 1] to a tier label."""
    for cutoff, label in _THRESHOLDS:
        if pct_rank >= cutoff:
            return label
    return "bronze"


def compute_avg_value(df: pd.DataFrame) -> pd.Series:
    """Return mean ZHVI across all date columns for each row."""
    date_cols = [c for c in df.columns if c not in META_COLS]
    return df[date_cols].mean(axis=1)


def rank_zips(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add avg_value, percentile_rank, and tier columns to df.

    Percentile rank is computed within each metro so that tiers reflect
    relative standing among peers, not national standing.
    """
    result = df.copy()
    result["avg_value"] = compute_avg_value(result)
    result["percentile_rank"] = result.groupby("Metro")["avg_value"].rank(pct=True)
    result["tier"] = result["percentile_rank"].apply(_assign_tier)
    return result


def get_zip_tier(zip_code: str, ranked_df: pd.DataFrame) -> dict:
    """
    Look up a zip code and return its tier metadata.

    ranked_df must already have been processed by rank_zips().
    Returns a dict with zip, metro, avg_value, percentile_rank, and tier.
    Raises KeyError if the zip code is not found.
    """
    row = ranked_df[ranked_df["RegionName"] == str(zip_code)]
    if row.empty:
        raise KeyError(f"Zip code {zip_code!r} not found in dataset")
    row = row.iloc[0]
    return {
        "zip": row["RegionName"],
        "metro": row["Metro"],
        "avg_value": round(row["avg_value"], 2),
        "percentile_rank": round(row["percentile_rank"], 4),
        "tier": row["tier"],
    }
def compute_value_tier(zip_code: str, salary: float, ranked_df: pd.DataFrame) -> dict:
    """
    Compute a personalized value tier for a zip given the user's salary.

    Combines two within-metro components, each scaled to [0, 1]:
      - desirability: the zip's home-value percentile (already in ranked_df)
      - affordability: lower home-value-to-salary multiple scores higher

    The two are averaged 50/50 into a value_score, which is then mapped
    to a tier using the same thresholds as the market ranking.
    """
    row = ranked_df[ranked_df["RegionName"] == str(zip_code)]
    if row.empty:
        raise KeyError(f"Zip code {zip_code!r} not found in dataset")
    row = row.iloc[0]

    metro = row["Metro"]
    metro_df = ranked_df[ranked_df["Metro"] == metro].copy()

    # Affordability: absolute, anchored to the ~3x-income lender heuristic.
    # A multiple at or below 2x is excellent (score ~1); around 3x is fair
    # (score ~0.5); 6x and above is very unaffordable (score ~0).
    metro_df["price_to_income"] = metro_df["avg_value"] / salary

    def _afford_curve(multiple: float) -> float:
        # Smoothly decreasing score: 1.0 at multiple<=2, ~0.5 at 3.5, ->0 past 6.
        import math
        return 1 / (1 + math.exp(1.4 * (multiple - 3.5)))

    metro_df["afford_score"] = metro_df["price_to_income"].apply(_afford_curve)

    # Desirability is just the existing within-metro value percentile.
    metro_df["desire_score"] = metro_df["percentile_rank"]

    # Blend 50/50.
    metro_df["value_score"] = 0.5 * metro_df["afford_score"] + 0.5 * metro_df["desire_score"]

    this_zip = metro_df[metro_df["RegionName"] == str(zip_code)].iloc[0]
    value_score = this_zip["value_score"]
    tier = _assign_tier(value_score)

    return {
        "zip": str(zip_code),
        "metro": metro,
        "salary": round(salary, 2),
        "avg_value": round(row["avg_value"], 2),
        "price_to_income": round(this_zip["price_to_income"], 2),
        "value_score": round(value_score, 4),
        "value_tier": tier,
    }