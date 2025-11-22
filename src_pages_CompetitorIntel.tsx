import React, { useState } from "react";
import { analyzeCompetitor } from "../services/geminiService";
import ScoreCircle from "../components/ScoreCircle";

const CompetitorIntel: React.FC = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeCompetitor(url);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>War Room — Competitor Intelligence</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>Paste a store URL to generate a tactical intelligence brief.</p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example-store.com"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <button onClick={runAnalysis} style={{ padding: "10px 14px", borderRadius: 8, background: "#111827", color: "#fff", border: "none" }}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {error && <div style={{ color: "#ef4444" }}>{error}</div>}
        {result && (
          <section style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0 }}>{result.title || "Competitor Brief"}</h2>
                <div style={{ color: "#6b7280" }}>{result.url}</div>
              </div>
              <ScoreCircle score={result.riskScore || 62} />
            </div>

            <hr style={{ margin: "12px 0" }} />

            <div>
              <h3 style={{ margin: "6px 0" }}>Top Insights</h3>
              <ul>
                {(result.insights || []).map((i: string, idx: number) => <li key={idx}>{i}</li>)}
              </ul>

              <h3 style={{ margin: "6px 0" }}>Tactical Plan</h3>
              <ol>
                {(result.plan || []).map((s: string, idx: number) => <li key={idx}>{s}</li>)}
              </ol>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CompetitorIntel;