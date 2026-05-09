export function ScanningView({ logs, progress }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: "#444", marginBottom: 8,
          }}
        >
          <span style={{ animation: "pulse 1.5s infinite" }}>● SCANNING EDGAR...</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: 3, background: "#111128", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #4a9eff, #00ff87)",
              width: `${progress}%`,
              transition: "width 0.5s ease",
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Log console */}
      <div
        style={{
          background: "#080812", border: "1px solid #111128",
          borderRadius: 8, padding: 16, height: 300, overflowY: "auto", fontSize: 12,
        }}
      >
        {logs.map((l, i) => (
          <div
            key={i}
            style={{
              padding: "3px 0",
              color:
                l.startsWith("✅") ? "#00ff87" :
                l.startsWith("❌") ? "#ff6b6b" :
                l.startsWith("🎯") ? "#ffd700" :
                l.startsWith("⚠")  ? "#f97316" : "#555",
              animation: i === logs.length - 1 ? "fadeIn 0.2s ease" : "none",
            }}
          >
            {l || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}
