from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.append(os.path.dirname(__file__))
from clean import clean
from ranking import rank_zips, get_zip_tier, compute_value_tier

ranked_df = None

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "Processed", "metro_clean.csv")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ranked_df
    ranked_df = rank_zips(clean(DATA_PATH))
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ranking/{zip_code}")
def get_ranking(zip_code: str):
    try:
        return get_zip_tier(zip_code, ranked_df)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zip code {zip_code} not found")

@app.get("/value/{zip_code}")
async def get_value(
    zip_code: str,
    salary: float,
    w_afford: float = 0.40,
    w_desire: float = 0.30,
    w_local: float = 0.30,
):
    median_income = None
    if CENSUS_KEY:
        url = "https://api.census.gov/data/2023/acs/acs5"
        params = {
            "get": "B19013_001E",
            "for": f"zip code tabulation area:{zip_code}",
            "key": CENSUS_KEY,
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, params=params)
                if res.status_code == 200 and len(res.json()) > 1:
                    val = int(res.json()[1][0])
                    median_income = val if val >= 0 else None
        except Exception:
            median_income = None

    try:
        return compute_value_tier(
            zip_code, salary, ranked_df, median_income,
            w_afford=w_afford, w_desire=w_desire, w_local=w_local,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zip code {zip_code} not found")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/history/{zip_code}")
def get_history(zip_code: str):
    row = ranked_df[ranked_df["RegionName"] == str(zip_code)]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Zip code {zip_code} not found")
    row = row.iloc[0]
    meta_cols = ["RegionID", "RegionName", "State", "City", "Metro", 
                 "CountyName", "avg_value", "percentile_rank", "tier"]
    date_data = {
        col: round(row[col], 2) 
        for col in ranked_df.columns 
        if col not in meta_cols and not row[col] != row[col]
    }
    return {"zip": zip_code, "history": date_data}

import os
import httpx

CENSUS_KEY = os.getenv("CENSUS_API_KEY", "")

@app.get("/population/{zip_code}")
async def get_population(zip_code: str):
    if not CENSUS_KEY:
        raise HTTPException(status_code=500, detail="Census API key not configured")
    
    url = "https://api.census.gov/data/2023/acs/acs5"
    params = {
        "get": "B01003_001E,NAME",
        "for": f"zip code tabulation area:{zip_code}",
        "key": CENSUS_KEY
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url, params=params)
        if res.status_code != 200:
            raise HTTPException(status_code=404, detail="Population data not found")
        data = res.json()
        if len(data) < 2:
            raise HTTPException(status_code=404, detail="No data for this zip")
        
        pop_2023 = int(data[1][0])
        return {"zip": zip_code, "population_2023": pop_2023}

@app.get("/demographics/{zip_code}")
async def get_demographics(zip_code: str):
    if not CENSUS_KEY:
        raise HTTPException(status_code=500, detail="Census API key not configured")

    url = "https://api.census.gov/data/2023/acs/acs5"
    params = {
        "get": "B19013_001E,B25077_001E,B25064_001E,NAME",
        "for": f"zip code tabulation area:{zip_code}",
        "key": CENSUS_KEY,
    }

    async with httpx.AsyncClient() as client:
        res = await client.get(url, params=params)
        if res.status_code != 200:
            raise HTTPException(status_code=404, detail="Demographic data not found")
        data = res.json()
        if len(data) < 2:
            raise HTTPException(status_code=404, detail="No data for this zip")

        row = data[1]

        def safe_int(v):
            try:
                val = int(v)
                return val if val >= 0 else None  # Census uses negatives as null flags
            except (ValueError, TypeError):
                return None

        return {
            "zip": zip_code,
            "median_income": safe_int(row[0]),
            "median_home_value_census": safe_int(row[1]),
            "median_rent": safe_int(row[2]),
        }

@app.get("/stats/{zip_code}")
async def get_stats(zip_code: str):
    if not CENSUS_KEY:
        raise HTTPException(status_code=503, detail="Census API key not configured")

    variables = [
        "B01002_001E",                                  # median age
        "B25003_001E", "B25003_002E", "B25003_003E",    # tenure: total, owner, renter
        "B17001_001E", "B17001_002E",                   # poverty: total, below poverty
        "B08013_001E", "B08303_001E",                   # commute: aggregate minutes, workers
        "B15003_001E", "B15003_022E", "B15003_023E",    # education: total 25+, bachelor's, master's
        "B15003_024E", "B15003_025E",                   #   professional, doctorate
    ]
    url = "https://api.census.gov/data/2023/acs/acs5"
    params = {
        "get": ",".join(variables),
        "for": f"zip code tabulation area:{zip_code}",
        "key": CENSUS_KEY,
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params)
        payload = res.json()
        if res.status_code != 200 or len(payload) < 2:
            raise HTTPException(status_code=404, detail=f"No census data for {zip_code}")
        data = dict(zip(payload[0], payload[1]))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Census request failed")

    def num(key):
        try:
            v = float(data.get(key))
            return v if v >= 0 else None
        except (TypeError, ValueError):
            return None

    def pct(part, whole):
        return round(100 * part / whole, 1) if part is not None and whole else None

    median_age = num("B01002_001E")

    tenure_total = num("B25003_001E")
    owner_pct  = pct(num("B25003_002E"), tenure_total)
    renter_pct = pct(num("B25003_003E"), tenure_total)

    poverty_pct = pct(num("B17001_002E"), num("B17001_001E"))

    agg_minutes, workers = num("B08013_001E"), num("B08303_001E")
    mean_commute = round(agg_minutes / workers, 1) if agg_minutes is not None and workers else None

    edu_total = num("B15003_001E")
    bachelors_plus = sum(
        v for v in [num("B15003_022E"), num("B15003_023E"),
                    num("B15003_024E"), num("B15003_025E")] if v is not None
    )
    edu_pct = pct(bachelors_plus, edu_total)

    return {
        "zip": zip_code,
        "median_age": median_age,
        "owner_pct": owner_pct,
        "renter_pct": renter_pct,
        "poverty_pct": poverty_pct,
        "mean_commute": mean_commute,
        "bachelors_plus_pct": edu_pct,
    }