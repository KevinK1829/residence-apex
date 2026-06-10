from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import pandas as pd
import sys, os

sys.path.append(os.path.dirname(__file__))
from clean import clean
from ranking import rank_zips, get_zip_tier

ranked_df = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ranked_df
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "Processed", "metro_clean.csv")
    ranked_df = rank_zips(clean(data_path))
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/ranking/{zip_code}")
def get_ranking(zip_code: str):
    try:
        return get_zip_tier(zip_code, ranked_df)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Zip code {zip_code} not found")

@app.get("/health")
def health():
    return {"status": "ok"}