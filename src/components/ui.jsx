// ── ScoreBar ──────────────────────────────────────────────────────────────────
export function ScoreBar({ score, max = 80 }) {
  const pct = (score / max) * 100;
  const color = score >= 55 ? "#00ff87" : score >= 35 ? "#ffd700" : "#ff6b6b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`, height: "100%", background: color,
            borderRadius: 3, transition: "width 1s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 32, fontFamily: "monospace" }}>
        {score}
      </span>
    </div>
  );
}

// ── ScorePill ─────────────────────────────────────────────────────────────────
export function ScorePill({ label, val, max }) {
  const pct = (val / max) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: "#aaa" }}>{val}/{max}</span>
      </div>
      <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#4a9eff", borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ color, border, text }) {
  return (
    <span
      style={{
        background: color, border: `1px solid ${border}`, color: border,
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

// ── TradeField ────────────────────────────────────────────────────────────────
export function TradeField({ label, val, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#556", marginBottom: 3, letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "monospace" }}>{val}</div>
    </div>
  );
}
