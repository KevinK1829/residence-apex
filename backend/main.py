from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.append(os.path.dirname(__file__))
from clean import clean
from ranking import rank_zips, get_zip_tier

ranked_df = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ranked_df
    ranked_df = rank_zips(clean("../data/Processed/metro_clean.csv"))
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