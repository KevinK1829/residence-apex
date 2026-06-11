# Residence Apex

## What it is
Full-stack housing value ranking system. Assigns bronze/silver/gold/platinum 
tiers to zip codes based on within-metro percentile ranking of Zillow ZHVI 
home values (2021-2026). Includes salary affordability bar, Census population 
data, and price history chart.

## Live URLs
- Frontend: https://residence-apex.vercel.app
- Backend: https://residence-apex.onrender.com

## Stack
- Python 3.9, Pandas, FastAPI, httpx, python-dotenv
- React, Recharts
- Data: Zillow ZHVI zip-level, Census ACS5 API
- Deploy: Render (backend), Vercel (frontend)

## Project structure
- backend/clean.py — data pipeline (load, filter, clean)
- backend/ranking.py — tier logic, percentile ranking
- backend/main.py — FastAPI app with /ranking, /history, /population endpoints
- frontend/src/App.js — React UI
- data/Processed/metro_clean.csv — cleaned working dataset
- notebooks/ — EDA work

## Conventions
- Ranking is within-metro (not national) so tiers reflect local market standing
- Tier thresholds: platinum ≥90th, gold 70-90th, silver 40-70th, bronze <40th
- Date range: 2021-02-28 to 2026-04-30 (63 months of clean data)
- Top 10 metros: NY, Chicago, LA, Philadelphia, DC, Pittsburgh, Boston, Dallas, Minneapolis, St. Louis

## Environment variables needed
- CENSUS_API_KEY (in backend/.env locally, set in Render dashboard for prod)