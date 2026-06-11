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
def compute_value_tier(
    zip_code: str,
    salary: float,
    ranked_df: pd.DataFrame,
    median_income: float = None,
    w_afford: float = 0.40,
    w_desire: float = 0.30,
    w_local: float = 0.30,
) -> dict:
    """
    Personalized value tier with user-adjustable weights.

    w_afford / w_desire / w_local are the relative weights for the three
    components. They are normalized internally so they always sum to 1,
    which means the caller can pass raw slider values (e.g. 70/20/50)
    without having to pre-normalize them.
    """
    import math

    row = ranked_df[ranked_df["RegionName"] == str(zip_code)]
    if row.empty:
        raise KeyError(f"Zip code {zip_code!r} not found in dataset")
    row = row.iloc[0]

    metro = row["Metro"]
    metro_df = ranked_df[ranked_df["Metro"] == metro].copy()

    # User affordability (absolute, logistic around 3.5x income).
    metro_df["price_to_income"] = metro_df["avg_value"] / salary

    def _afford_curve(multiple):
        return 1 / (1 + math.exp(1.4 * (multiple - 3.5)))

    metro_df["afford_score"] = metro_df["price_to_income"].apply(_afford_curve)

    # Desirability.
    metro_df["desire_score"] = metro_df["percentile_rank"]

    this_zip = metro_df[metro_df["RegionName"] == str(zip_code)].iloc[0]

    # Normalize weights so they sum to 1, guarding against all-zero input.
    total_w = w_afford + w_desire + w_local
    if total_w <= 0:
        w_afford, w_desire, w_local, total_w = 0.4, 0.3, 0.3, 1.0
    wa, wd, wl = w_afford / total_w, w_desire / total_w, w_local / total_w

    afford = this_zip["afford_score"]
    desire = this_zip["desire_score"]

    if median_income and median_income > 0:
        local_ratio = row["avg_value"] / median_income
        local = _afford_curve(local_ratio)
        value_score = wa * afford + wd * desire + wl * local
        local_ratio_out = round(local_ratio, 2)
    else:
        # Redistribute the local weight across the other two when income is missing.
        denom = wa + wd
        if denom <= 0:
            wa, wd = 0.5, 0.5
            denom = 1.0
        value_score = (wa / denom) * afford + (wd / denom) * desire
        local_ratio_out = None

    tier = _assign_tier(value_score)

    return {
        "zip": str(zip_code),
        "metro": metro,
        "salary": round(salary, 2),
        "avg_value": round(row["avg_value"], 2),
        "price_to_income": round(this_zip["price_to_income"], 2),
        "local_price_to_income": local_ratio_out,
        "value_score": round(value_score, 4),
        "value_tier": tier,
    }