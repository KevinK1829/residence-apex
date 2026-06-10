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
