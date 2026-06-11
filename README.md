# Residence Apex

A full-stack housing value ranking system that assigns **bronze, silver, gold, 
or platinum** tiers to zip codes across 10 major US metros based on historical 
Zillow home value data.

**Live demo:** https://residence-apex.vercel.app

## Features
- Within-metro percentile ranking across 3,495 zip codes
- Salary affordability analysis
- Census Bureau population data
- 5-year home value history chart (2021–2026)

## Tech stack
- **Backend:** Python, FastAPI, Pandas — deployed on Render
- **Frontend:** React, Recharts — deployed on Vercel
- **Data:** Zillow ZHVI, US Census ACS5 API

## Methodology
Tiers are assigned by percentile rank within each metro area so a zip in 
Chicago is ranked against other Chicago zips, not against Manhattan. 
Thresholds: platinum (top 10%), gold (70–90th), silver (40–70th), bronze (bottom 40%).

## Local setup
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
```
