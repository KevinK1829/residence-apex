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
        const res = await fetch(`https://residence-apex.onrender.com/value/${result.zip}?salary=${salary}`);
        if (res.ok) {
          const valueData = await res.json();
          setResult(prev => prev ? { ...prev, ...valueData } : prev);
        }
      } catch {
        // Network hiccup — leave the existing card as-is.
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [salary, result?.zip]);

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
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 1.5rem 80px" }}>

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

        {result && config && (
          <div style={{ background: config.gradient, border: `2px solid ${config.border}`, borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
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
          </div>
        )}

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
  );
}