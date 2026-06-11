from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    ranked_df = rank_zips(clean("../data/Processed/metro_clean.csv"))
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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