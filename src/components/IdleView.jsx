const STEPS = [
  { step: "01", label: "EDGAR Form 4", sub: "Code P filter" },
  { step: "02", label: "Survival Check", sub: "Z-score + liquidity" },
  { step: "03", label: "Signal Score",  sub: "0-80 ranking" },
  { step: "04", label: "Trade Setup",   sub: "Entry + stop loss" },
];

export function IdleView({ lookback, onScan }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeIn 0.5s ease" }}>
      <div style={{ fontSize: 13, color: "#333", marginBottom: 8, letterSpacing: 2 }}>
        READY TO SCAN
      </div>
      <div style={{ fontSize: 11, color: "#2a2a4a", marginBottom: 40 }}>
        Queries SEC EDGAR → filters by market cap, cluster, materiality → survival check → scores candidates
      </div>

      <button
        onClick={onScan}
        style={{
          padding: "16px 48px", background: "transparent",
          border: "2px solid #4a9eff", color: "#4a9eff",
          fontSize: 14, fontFamily: "inherit", letterSpacing: 3,
          cursor: "pointer", borderRadius: 4, textTransform: "uppercase",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = "#4a9eff22"; }}
        onMouseOut={(e)  => { e.currentTarget.style.background = "transparent"; }}
      >
        Run {lookback}-Day Scan
      </button>

      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
        {STEPS.map((s) => (
          <div key={s.step} style={{ padding: 16, border: "1px solid #111128", borderRadius: 8 }}>
            <div style={{ fontSize: 24, color: "#1e1e3a", fontWeight: 900 }}>{s.step}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
