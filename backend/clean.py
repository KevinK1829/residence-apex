"""Functions for loading and cleaning Zillow zip-level ZHVI data."""

import pandas as pd

META_COLS = ["RegionID", "RegionName", "State", "City", "Metro", "CountyName"]


def load_zip_data(path: str) -> pd.DataFrame:
    """Load raw Zillow zip-level ZHVI CSV from disk."""
    return pd.read_csv(path, dtype={"RegionName": str})


def filter_top_metros(df: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    """Keep only rows belonging to the top N metros by zip count."""
    top = (
        df[df["Metro"].notna()]["Metro"]
        .value_counts()
        .head(n)
        .index
        .tolist()
    )
    return df[df["Metro"].isin(top)].copy()


def select_date_range(
    df: pd.DataFrame, start_year: int = 2021, end_year: int = 2026
) -> pd.DataFrame:
    """Restrict date columns to those within [start_year, end_year]."""
    date_cols = [
        c for c in df.columns
        if c not in META_COLS and c[:4].isdigit()
        and start_year <= int(c[:4]) <= end_year
    ]
    return df[META_COLS + date_cols].copy()


def drop_sparse_date_cols(df: pd.DataFrame, max_nulls: int = 50) -> pd.DataFrame:
    """Drop date columns whose null count exceeds max_nulls."""
    date_cols = [c for c in df.columns if c not in META_COLS]
    keep = [c for c in date_cols if df[c].isnull().sum() <= max_nulls]
    return df[META_COLS + keep].copy()


def drop_null_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows with any null in the date columns."""
    date_cols = [c for c in df.columns if c not in META_COLS]
    return df.dropna(subset=date_cols).copy()


def clean(
    path: str,
    n_metros: int = 10,
    start_year: int = 2021,
    end_year: int = 2026,
    max_nulls: int = 50,
) -> pd.DataFrame:
    """Full cleaning pipeline: load → top metros → date range → drop sparse cols → drop null rows."""
    df = load_zip_data(path)
    df = filter_top_metros(df, n=n_metros)
    df = select_date_range(df, start_year=start_year, end_year=end_year)
    df = drop_sparse_date_cols(df, max_nulls=max_nulls)
    df = drop_null_rows(df)
    return df
