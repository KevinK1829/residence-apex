# Residence Apex

A housing tier ranking tool that assigns **bronze / silver / gold / platinum** ratings to zip codes based on average home values relative to other zips in the same metro area.

## How it works

Home values come from Zillow's ZHVI dataset (zip-level, 2021–2026). Each zip is ranked within its metro using a percentile-based system:

| Tier | Percentile within metro |
|------|------------------------|
| Platinum | Top 10% (≥ 90th) |
| Gold | Top 10–30% (70th–90th) |
| Silver | Top 30–60% (40th–70th) |
| Bronze | Bottom 60% (< 40th) |

Coverage is scoped to the top 10 US metros by zip count.

## Stack

- **Backend:** Python, FastAPI, Pandas
- **Frontend:** React
- **Data:** Zillow ZHVI (zip-level SFR/condo, middle tier)
- **Deploy:** Render (backend), Vercel (frontend)

## Project structure

```
backend/
  clean.py      # data loading and cleaning pipeline
  ranking.py    # percentile-based tier assignment logic
  main.py       # FastAPI app with /ranking/{zip} endpoint
frontend/
  src/App.js    # zip search UI with tier result card
data/
  Processed/metro_clean.csv   # cleaned zip-level ZHVI (gitignored)
notebooks/
  ZipDataCleaning.ipynb       # EDA and data exploration
```

## API

```
GET /ranking/{zip_code}
```

Returns tier metadata for a zip code:

```json
{
  "zip": "60614",
  "metro": "Chicago-Naperville-Elgin, IL-IN-WI",
  "avg_value": 572835.65,
  "percentile_rank": 0.9474,
  "tier": "platinum"
}
```

## Running locally

**Backend**
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8000`.
