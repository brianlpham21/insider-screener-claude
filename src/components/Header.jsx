import { FILTERS } from "../config";

export function Header({ lookback, setLookback }) {
  return (
    <div
      style={{
        borderBottom: "1px solid #1a1a3a",
        padding: "24px 32px",
        background: "linear-gradient(180deg, #0a0a1e 0%, #06060f 100%)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#333", letterSpacing: 4, marginBottom: 4 }}>
              SEC EDGAR · FORM 4 · REAL-TIME
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 42, color: "#fff", letterSpacing: 3, lineHeight: 1,
              }}
            >
              INSIDER SIGNAL
            </div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
              4-step filter · EDGAR live data · cluster detection
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#333", marginBottom: 8, letterSpacing: 2 }}>
              LOOKBACK WINDOW
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {FILTERS.LOOKBACK_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setLookback(d)}
                  style={{
                    padding: "6px 14px", borderRadius: 4, border: "1px solid",
                    borderColor: lookback === d ? "#4a9eff" : "#1e1e3a",
                    background: lookback === d ? "#4a9eff22" : "transparent",
                    color: lookback === d ? "#4a9eff" : "#444",
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
