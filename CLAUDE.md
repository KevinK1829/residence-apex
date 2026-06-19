# Residence Apex

## What it is
Full-stack housing value ranking system. Assigns bronze/silver/gold/platinum 
tiers to zip codes based on within-metro percentile ranking of Zillow ZHVI 
home values (2021-2026). Includes salary affordability bar, Census population 
data, price history chart, demographic stats, weather tiles, and a city hero panel.

## Live URLs
- Frontend: https://residence-apex.vercel.app (auto-deploys from main via Vercel)
- Backend: https://residence-apex.onrender.com (deployed on Render)

## Stack
- Python 3.9, Pandas, FastAPI, httpx, python-dotenv
- React, Recharts
- Data: Zillow ZHVI zip-level, Census ACS5 API
- Deploy: Render (backend), Vercel (frontend)

## Project structure
- backend/clean.py — data pipeline (load, filter top 10 metros, clean nulls)
- backend/ranking.py — tier logic, percentile ranking, compute_value_tier (personalized scoring)
- backend/main.py — FastAPI app
- frontend/src/App.js — React UI (single file)
- data/Processed/metro_clean.csv — cleaned working dataset (committed)
- notebooks/ZipDataCleaning.ipynb — original EDA

## Backend endpoints
- GET /ranking/{zip} — market tier (bronze/silver/gold/platinum) + city/state
- GET /value/{zip}?salary=&w_afford=&w_desire=&w_local= — personalized tier with adjustable weights
- GET /history/{zip} — monthly ZHVI time series (2021–2026)
- GET /population/{zip} — Census 2023 population
- GET /demographics/{zip} — median income, home value, rent (Census ACS5)
- GET /stats/{zip} — median age, owner/renter %, poverty %, mean commute, bachelor's+ % (Census ACS5)
- GET /weather/{zip} — avg summer high, avg winter low, sunny days/yr (already deployed)
- GET /health — health check

## Ranking logic
- Tier thresholds (within-metro percentile): platinum ≥90th, gold 70–90th, silver 40–70th, bronze <40th
- Personalized value tier blends three components via adjustable weights:
  - afford_score: home value vs user salary (logistic curve, anchored at 3.5x)
  - desire_score: home-value percentile within metro
  - local_score: home value vs Census median income (same logistic curve)
- Weights normalized internally so caller doesn't need to pre-normalize
- Fallback: if Census median income unavailable, blends just afford + desire

## Frontend (App.js) — key components
- InfoPanel — shown before first search; explains tiers and sliders
- CityHero — state flag background, city facts for 11 curated cities, graceful fallback for all others
- PreferenceControls — 4 presets (Balanced, Best deal, Nicest area, Local value) + 3 sliders; debounced live re-fetch on change
- StatTile — reusable tile for demographics/weather grid
- AffordabilityBar — visual bar showing home value vs salary (≤3x = affordable)
- Dashboard grid: 2×2 at 900px+, single column on mobile

## Top 10 metros covered
NY, Chicago, LA, Philadelphia, DC, Pittsburgh, Boston, Dallas, Minneapolis, St. Louis
(3,445 zip codes, 2021-02-28 to 2026-04-30)

## Environment variables
- CENSUS_API_KEY — in backend/.env locally, set in Render dashboard for prod

## Where things stand (as of last session)
- All backend endpoints deployed on Render including /weather
- Frontend deployed on Vercel, auto-deploys on push to main
- Last commit: weather tiles + city hero redesign + info panel + demographic stats
- ranking.py and main.py fully wired with personalized scoring and weight params
- notebooks/ZipDataCleaning.ipynb has minor unstaged changes (safe to ignore)
- Raw Zillow CSVs are gitignored (data/raw/); only metro_clean.csv is committed
