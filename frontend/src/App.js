import { useState } from "react";

const TIER_COLORS = {
  platinum: { bg: "#e8f4fd", border: "#2980b9", text: "#1a5276" },
  gold: { bg: "#fef9e7", border: "#f39c12", text: "#7d6608" },
  silver: { bg: "#f2f3f4", border: "#95a5a6", text: "#2c3e50" },
  bronze: { bg: "#fdf2e9", border: "#ca6f1e", text: "#6e2f1a" },
};

export default function App() {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/ranking/${zip}`);
      if (!res.ok) throw new Error("Zip code not found");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const colors = result ? TIER_COLORS[result.tier] : null;

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Residence Apex</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Enter a zip code to see its housing value tier.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={zip}
          onChange={e => setZip(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="e.g. 60639"
          maxLength={5}
          style={{ flex: 1, padding: "10px 14px", fontSize: 16, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: "10px 20px", fontSize: 16, background: "#2c3e50", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
          Search
        </button>
      </div>

      {loading && <p style={{ color: "#666" }}>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ border: `2px solid ${colors.border}`, background: colors.bg, borderRadius: 12, padding: "24px" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.text, textTransform: "capitalize", marginBottom: 16 }}>
            {result.tier}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Zip Code</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{result.zip}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Metro</div>
              <div style={{ fontSize: 14 }}>{result.metro.split(",")[0]}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Avg Home Value</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>${result.avg_value.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Percentile (within metro)</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{Math.round(result.percentile_rank * 100)}th</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}