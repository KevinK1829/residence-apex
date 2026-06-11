import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TIER_CONFIG = {
  platinum: {
    gradient: "linear-gradient(135deg, #e8f4fd 0%, #d0eaf8 100%)",
    border: "#2980b9",
    text: "#1a5276",
    accent: "#2980b9",
    emoji: "💎",
    label: "Platinum"
  },
  gold: {
    gradient: "linear-gradient(135deg, #fef9e7 0%, #fdeaa0 100%)",
    border: "#f39c12",
    text: "#7d6608",
    accent: "#f39c12",
    emoji: "🥇",
    label: "Gold"
  },
  silver: {
    gradient: "linear-gradient(135deg, #f4f6f7 0%, #e8ecee 100%)",
    border: "#85929e",
    text: "#2c3e50",
    accent: "#85929e",
    emoji: "🥈",
    label: "Silver"
  },
  bronze: {
    gradient: "linear-gradient(135deg, #fdf2e9 0%, #f5cba7 100%)",
    border: "#ca6f1e",
    text: "#6e2f1a",
    accent: "#ca6f1e",
    emoji: "🥉",
    label: "Bronze"
  },
};

const PRESETS = {
  balanced:    { label: "Balanced",    afford: 0.40, desire: 0.30, local: 0.30, icon: "⚖️" },
  best_deal:   { label: "Best deal",   afford: 0.70, desire: 0.10, local: 0.20, icon: "💰" },
  nicest:      { label: "Nicest area", afford: 0.15, desire: 0.70, local: 0.15, icon: "✨" },
  local_value: { label: "Local value", afford: 0.25, desire: 0.20, local: 0.55, icon: "🏘️" },
};

const CITY_FACTS = {
  "New York":      { state: "New York",             stateCode: "ny", founded: "1624", blurb: "The most populous city in the U.S. and a global center of finance, culture, and media across five boroughs.", facts: ["The Statue of Liberty's copper skin is only about as thick as two pennies", "Largest subway system in the U.S. by number of stations", "Originally a Dutch settlement called New Amsterdam"] },
  "Los Angeles":   { state: "California",           stateCode: "ca", founded: "1781", blurb: "The heart of the entertainment industry and the second-largest U.S. city, sprawling from the Pacific coast to the mountains.", facts: ["The Hollywood Sign originally read 'HOLLYWOODLAND' as a real-estate ad", "Home to Griffith Observatory and the Walk of Fame", "Spans a huge range of microclimates and neighborhoods"] },
  "Chicago":       { state: "Illinois",             stateCode: "il", founded: "1837", blurb: "The largest city in the Midwest, built on Lake Michigan as a railroad and trading hub, known for its architecture and resilience.", facts: ["The Chicago River is dyed emerald green every St. Patrick's Day", "Home to the first modern skyscraper (1885)", "The 'L' was the first elevated railway in the U.S. (1892)"] },
  "Philadelphia":  { state: "Pennsylvania",         stateCode: "pa", founded: "1682", blurb: "America's first capital and a cradle of the nation's founding, rich with colonial history.", facts: ["Home to the country's first-ever zoo and hospital", "Site of Independence Hall and the Liberty Bell", "Was the U.S. capital before Washington, D.C."] },
  "Dallas":        { state: "Texas",                stateCode: "tx", founded: "1841", blurb: "A major commercial and cultural hub in North Texas, anchor of one of the fastest-growing metros in the country.", facts: ["The microchip was invented here in 1958 by Jack Kilby at Texas Instruments", "Home to Reunion Tower and the Dallas Arboretum", "Part of the larger Dallas-Fort Worth metroplex"] },
  "Fort Worth":    { state: "Texas",                stateCode: "tx", founded: "1849", blurb: "Once an army outpost, Fort Worth keeps its cowboy heritage alive while anchoring the western half of the DFW metroplex.", facts: ["Features a twice-daily live cattle drive in the Stockyards", "Home to the acclaimed Kimbell Art Museum", "Started as a frontier army post"] },
  "Washington":    { state: "District of Columbia", stateCode: "dc", founded: "1790", blurb: "The capital of the United States, a planned city of monuments, museums, and federal institutions.", facts: ["Building heights are capped so the Capitol and Washington Monument stay dominant", "Home to the Smithsonian museums and the National Mall", "Was purpose-built as the seat of government"] },
  "Boston":        { state: "Massachusetts",        stateCode: "ma", founded: "1630", blurb: "One of the oldest U.S. cities and a hub of education and revolutionary history in New England.", facts: ["Home to the first public park, public school, and subway in the U.S.", "The Freedom Trail links 16 historic sites", "A center of the American Revolution"] },
  "Pittsburgh":    { state: "Pennsylvania",     stateCode: "pa", founded: "1758", blurb: "The 'Steel City,' built where three rivers meet, transformed from an industrial powerhouse into a hub for tech, robotics, and healthcare.", facts: ["Sits at the confluence of the Allegheny, Monongahela, and Ohio rivers", "Dr. Jonas Salk developed the first polio vaccine at the University of Pittsburgh (1954)", "The :-) emoticon was invented at Carnegie Mellon in 1982"] },
  "Minneapolis":   { state: "Minnesota",        stateCode: "mn", founded: "1867", blurb: "The larger of the Twin Cities, built on the only major waterfall on the Mississippi, once the flour-milling capital of the world.", facts: ["Has the world's largest continuous skyway system — 8 miles linking 73 blocks", "The name blends the Dakota word 'minne' (water) with the Greek 'polis' (city)", "Known as 'Mill City' for its flour-milling history"] },
  "St. Louis":     { state: "Missouri",         stateCode: "mo", founded: "1764", blurb: "Founded as a French fur-trading post on the Mississippi, the 'Gateway to the West' and launch point of the Lewis and Clark expedition.", facts: ["Home to the Gateway Arch — at 630 feet, the tallest monument in the U.S.", "Founded by French fur traders Pierre Laclède and Auguste Chouteau", "Starting point of the 1804 Lewis and Clark expedition"] },
};

function PreferenceControls({ weights, setWeights, activePreset, setActivePreset }) {
  function applyPreset(key) {
    setActivePreset(key);
    const p = PRESETS[key];
    setWeights({ afford: p.afford, desire: p.desire, local: p.local });
  }

  function updateWeight(field, value) {
    setActivePreset("custom");
    setWeights(w => ({ ...w, [field]: value }));
  }

  const sliders = [
    { key: "afford", label: "Affordability", hint: "Fits your salary" },
    { key: "desire", label: "Area prestige",  hint: "Higher-value neighborhood" },
    { key: "local",  label: "Local value",    hint: "Reasonable vs local incomes" },
  ];

  return (
    <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 12 }}>
        What matters most to you?
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {Object.entries(PRESETS).map(([key, p]) => {
          const active = activePreset === key;
          return (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
                border: active ? "1.5px solid #1a1a2e" : "1.5px solid #e0e0e0",
                background: active ? "#1a1a2e" : "white",
                color: active ? "white" : "#555",
              }}
            >
              {p.icon} {p.label}
            </button>
          );
        })}
      </div>

      {sliders.map(s => (
        <div key={s.key} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#333", fontWeight: 500 }}>{s.label}</span>
            <span style={{ color: "#888" }}>{Math.round(weights[s.key] * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={weights[s.key]}
            onChange={e => updateWeight(s.key, parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#1a1a2e" }}
          />
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{s.hint}</div>
        </div>
      ))}
    </div>
  );
}

function StatTile({ label, value, suffix }) {
  return (
    <div style={{ background: "#f7f7fa", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>
        {value == null ? "—" : `${value}${suffix || ""}`}
      </div>
    </div>
  );
}

function lookupCity(city) {
  if (!city) return null;
  if (CITY_FACTS[city]) return CITY_FACTS[city];
  const norm = city.replace(/\./g, "").replace(/^Saint /i, "St ").trim();
  const match = Object.keys(CITY_FACTS).find(
    k => k.replace(/\./g, "").replace(/^Saint /i, "St ").toLowerCase() === norm.toLowerCase()
  );
  return match ? CITY_FACTS[match] : null;
}

function CityHero({ city, state, metro }) {
  const facts = lookupCity(city);
  const stateCode = facts?.stateCode;

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "white", borderRadius: 16, padding: 22,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", minHeight: 160,
    }}>
      {stateCode && (
        <img
          src={`https://flagcdn.com/w320/us-${stateCode}.png`}
          alt=""
          style={{
            position: "absolute", top: 0, right: 0,
            width: 180, opacity: 0.10, pointerEvents: "none",
            transform: "translate(20%, -10%)",
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
          {city || "—"}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
          {[facts?.state || state, facts?.founded && `Founded ${facts.founded}`]
            .filter(Boolean).join(" · ")}
        </div>

        {facts ? (
          <>
            <div style={{ fontSize: 13.5, color: "#444", lineHeight: 1.5, marginBottom: 12 }}>
              {facts.blurb}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#666", lineHeight: 1.7 }}>
              {facts.facts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#999", lineHeight: 1.5 }}>
            Part of the {metro} metro area.
          </div>
        )}
      </div>
    </div>
  );
}

function AffordabilityBar({ salary, avgValue }) {
  if (!salary || !avgValue) return null;
  const annual = parseFloat(salary);
  if (!annual || annual <= 0) return null;
  const ratio = avgValue / annual;
  const maxRatio = 10;
  const pct = Math.min((ratio / maxRatio) * 100, 100);
  const affordable = ratio <= 3;
  const stretch = ratio > 3 && ratio <= 5;
  const color = affordable ? "#27ae60" : stretch ? "#f39c12" : "#e74c3c";
  const label = affordable ? "Affordable" : stretch ? "Stretch" : "Expensive";

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "#555" }}>Affordability on ${parseInt(salary).toLocaleString()} salary</span>
        <span style={{ fontWeight: 600, color }}>{label} · {ratio.toFixed(1)}x income</span>
      </div>
      <div style={{ background: "rgba(0,0,0,0.08)", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
      </div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
        Rule of thumb: home value should be ≤3x annual salary
      </div>
    </div>
  );
}

export default function App() {
  const [zip, setZip] = useState("");
  const [salary, setSalary] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [population, setPopulation] = useState(null);
  const [stats, setStats] = useState(null);
  const [weights, setWeights] = useState({ afford: 0.40, desire: 0.30, local: 0.30 });
  const [activePreset, setActivePreset] = useState("balanced");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Only run if we already have a result showing for the current zip.
    if (!result || !result.zip) return;

    // No salary selected → clear any personalized tier, revert to market tier.
    if (!salary) {
      setResult(prev => {
        if (!prev) return prev;
        const { value_tier, value_score, price_to_income, local_price_to_income, ...market } = prev;
        return market;
      });
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://residence-apex.onrender.com/value/${result.zip}?salary=${salary}` +
          `&w_afford=${weights.afford}&w_desire=${weights.desire}&w_local=${weights.local}`
        );
        if (res.ok) {
          const valueData = await res.json();
          setResult(prev => prev ? { ...prev, ...valueData } : prev);
        }
      } catch {
        // Network hiccup — leave the existing card as-is.
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [salary, weights, result?.zip]);

  useEffect(() => {
    if (!result?.zip) { setStats(null); return; }
    fetch(`https://residence-apex.onrender.com/stats/${result.zip}`)
      .then(r => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [result?.zip]);

  async function handleSearch() {
    if (!zip || zip.length < 5) return;
    setError(null);
    setResult(null);
    setHistory(null);
    setPopulation(null);
    setLoading(true);
    try {
      const [rankRes, histRes, popRes] = await Promise.all([
        fetch(`https://residence-apex.onrender.com/ranking/${zip}`),
        fetch(`https://residence-apex.onrender.com/history/${zip}`),
        fetch(`https://residence-apex.onrender.com/population/${zip}`)
      ]);
      if (!rankRes.ok) throw new Error("Zip code not found — try a zip in a major metro (NY, LA, Chicago, Dallas, Boston, DC, Pittsburgh, Philadelphia, Minneapolis, St. Louis)");
      const rankData = await rankRes.json();
      const histData = await histRes.json();
      setResult(rankData);
      if (salary) {
        const valueRes = await fetch(`https://residence-apex.onrender.com/value/${zip}?salary=${salary}`);
        if (valueRes.ok) {
          const valueData = await valueRes.json();
          setResult({ ...rankData, ...valueData });
        }
      }
      const chartData = Object.entries(histData.history).map(([date, value]) => ({
        date: date.slice(0, 7),
        value: Math.round(value)
      }));
      setHistory(chartData);
      if (popRes.ok) {
        const popData = await popRes.json();
        setPopulation(popData.population_2023);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const displayTier = result ? (result.value_tier || result.tier) : null;
  const config = displayTier ? TIER_CONFIG[displayTier] : null;
  const isPersonalized = result && result.value_tier;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 1.5rem 80px" }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 6px", color: "#1a1a2e" }}>
            Residence Apex
          </h1>
          <p style={{ color: "#666", fontSize: 16, margin: 0 }}>
            Find the housing value tier for any zip code across 10 major US metros.
          </p>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              value={zip}
              onChange={e => setZip(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Zip code (e.g. 10001)"
              maxLength={5}
              style={{ flex: 1, padding: "11px 16px", fontSize: 15, border: "1.5px solid #e0e0e0", borderRadius: 10, outline: "none" }}
            />
            <select
              value={salary}
              onChange={e => setSalary(e.target.value)}
              style={{ flex: 1, padding: "11px 16px", fontSize: 15, border: "1.5px solid #e0e0e0", borderRadius: 10, outline: "none", background: "white", color: salary ? "#1a1a2e" : "#999" }}
            >
              <option value="">Annual salary (optional)</option>
              <option value="25000">Under $50k</option>
              <option value="62500">$50k – $75k</option>
              <option value="87500">$75k – $100k</option>
              <option value="112500">$100k – $125k</option>
              <option value="137500">$125k – $150k</option>
              <option value="162500">$150k – $175k</option>
              <option value="187500">$175k – $200k</option>
              <option value="225000">$200k – $250k</option>
              <option value="275000">$250k – $300k</option>
              <option value="325000">$300k – $350k</option>
              <option value="375000">$350k – $400k</option>
              <option value="425000">$400k – $450k</option>
              <option value="475000">$450k – $500k</option>
              <option value="625000">$500k – $750k</option>
              <option value="875000">$750k – $1M</option>
              <option value="1500000">$1M – $2M</option>
              <option value="2500000">$2M – $3M</option>
              <option value="3500000">$3M – $4M</option>
              <option value="4500000">$4M – $5M</option>
              <option value="6000000">$5M+</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ width: "100%", padding: "12px", fontSize: 15, fontWeight: 600, background: "#1a1a2e", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 12, padding: "14px 18px", color: "#c53030", fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {result && (
          <div className="dashboard-grid">
            {/* Top-left: city hero */}
            <CityHero
              city={result.city}
              state={result.state}
              metro={result.metro}
            />

            {/* Top-right: preference controls */}
            <PreferenceControls
              weights={weights}
              setWeights={setWeights}
              activePreset={activePreset}
              setActivePreset={setActivePreset}
            />

            {/* Bottom-left: ranking badge */}
            <div>
              {config && (
                <div style={{ background: config.gradient, border: `2px solid ${config.border}`, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 40 }}>{config.emoji}</span>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: config.text }}>{config.label}</div>
                      <div style={{ fontSize: 13, color: config.text, opacity: 0.7 }}>
                        {isPersonalized
                          ? `Personalized value · ${result.price_to_income}x your income${result.local_price_to_income ? ` · ${result.local_price_to_income}x local income` : ""}`
                          : "Market position within metro · enter salary for value score"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    {[
                      { label: "Zip Code", value: result.zip },
                      { label: "Metro Area", value: result.metro.split(",")[0] },
                      { label: "Avg Home Value", value: `$${result.avg_value.toLocaleString()}` },
                      { label: "Metro Percentile", value: `${Math.round(result.percentile_rank * 100)}th` },
                      { label: "Population (2023)", value: population ? population.toLocaleString() : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, color: config.text, opacity: 0.6, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: config.text }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <AffordabilityBar salary={salary} avgValue={result.avg_value} />

                  {stats && (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                      gap: 10, marginTop: 14,
                    }}>
                      <StatTile label="Median age"    value={stats.median_age} />
                      <StatTile label="Mean commute"  value={stats.mean_commute} suffix=" min" />
                      <StatTile label="Homeowners"    value={stats.owner_pct} suffix="%" />
                      <StatTile label="Renters"       value={stats.renter_pct} suffix="%" />
                      <StatTile label="Below poverty" value={stats.poverty_pct} suffix="%" />
                      <StatTile label="Bachelor's+"   value={stats.bachelors_plus_pct} suffix="%" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom-right: price history chart */}
            <div>
              {history && (
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: "#1a1a2e" }}>
                    Home Value History · {result?.zip}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={11} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                        width={55}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        formatter={v => [`$${v.toLocaleString()}`, "Home Value"]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 13 }}
                      />
                      <Line type="monotone" dataKey="value" stroke={config?.accent || "#2980b9"} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}