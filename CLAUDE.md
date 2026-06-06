# Residence Apex

## Project Summary
Housing ranking system that assigns bronze/silver/gold/platinum tiers
to units based on historical price-per-sqft data, with floor-level
price normalization for multi-story buildings.

## Stack
- Python 3.11, Pandas, FastAPI
- SQLite (dev)
- React frontend
- Deploy: Render (backend), Vercel (frontend)

## Conventions
- All ranking logic lives in backend/ranking.py
- Keep data cleaning separate from ranking logic
- Write docstrings on all functions
- Data cleaning scripts go in backend/clean.py