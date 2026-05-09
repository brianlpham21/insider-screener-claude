import { CandidateCard } from "./CandidateCard";

export function ResultsView({ results, logs, onReset }) {
  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: 2 }}>SCAN COMPLETE</div>
          <div
            style={{
              fontSize: 22, fontFamily: "'Bebas Neue', sans-serif",
              color: "#fff", letterSpacing: 2,
            }}
          >
            {results.length} CANDIDATES RANKED
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            padding: "8px 20px", background: "transparent",
            border: "1px solid #1e1e3a", color: "#555",
            fontSize: 11, fontFamily: "inherit", cursor: "pointer", borderRadius: 4,
          }}
        >
          New Scan
        </button>
      </div>

      {results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#333" }}>
          No candidates passed all filters in this window. Try extending the lookback period.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "#333", marginBottom: 16 }}>
            Click any card to expand trade setup · Sorted by signal score (0–80)
          </div>
          {results.map((c, i) => (
            <CandidateCard key={c.ticker} c={c} rank={i + 1} />
          ))}
        </>
      )}

      {/* Collapsible scan log */}
      <details style={{ marginTop: 32 }}>
        <summary style={{ fontSize: 11, color: "#333", cursor: "pointer", letterSpacing: 2 }}>
          VIEW SCAN LOG
        </summary>
        <div
          style={{
            background: "#080812", borderRadius: 8, padding: 16,
            marginTop: 12, height: 200, overflowY: "auto", fontSize: 11,
          }}
        >
          {logs.map((l, i) => (
            <div key={i} style={{ padding: "2px 0", color: "#444" }}>{l}</div>
          ))}
        </div>
      </details>
    </div>
  );
}
