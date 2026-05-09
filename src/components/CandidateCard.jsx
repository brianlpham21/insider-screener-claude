// import { useState } from "react";
// import { ScoreBar, ScorePill, Tag, TradeField } from "./ui";

// export function CandidateCard({ c, rank }) {
//   const [expanded, setExpanded] = useState(false);
//   const { current, high52, low52 } = c.quote || {};
//   const range = high52 - low52;
//   const pctFromLow = range ? ((current - low52) / range) * 100 : 50;
//   const riskPct =
//     current && c.swingLow ? (((current - c.swingLow) / current) * 100).toFixed(1) : "N/A";
//   const scoreColor = c.score >= 55 ? "#00ff87" : c.score >= 35 ? "#ffd700" : "#ff6b6b";

//   return (
//     <div
//       onClick={() => setExpanded(!expanded)}
//       style={{
//         background: "linear-gradient(135deg, #0d0d1a 0%, #111128 100%)",
//         border: `1px solid ${expanded ? scoreColor : "#1e1e3a"}`,
//         borderRadius: 12,
//         padding: "20px 24px",
//         cursor: "pointer",
//         transition: "all 0.2s",
//         marginBottom: 12,
//       }}
//     >
//       {/* Header */}
//       <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: expanded ? 20 : 0 }}>
//         <div
//           style={{
//             width: 36, height: 36, borderRadius: "50%",
//             background: scoreColor + "22", border: `2px solid ${scoreColor}`,
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: 13, fontWeight: 900, color: scoreColor,
//             fontFamily: "monospace", flexShrink: 0,
//           }}
//         >
//           #{rank}
//         </div>

//         <div style={{ flex: 1 }}>
//           <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
//             <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
//               {c.ticker}
//             </span>
//             <span
//               style={{
//                 fontSize: 12, color: "#555", maxWidth: 200,
//                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
//               }}
//             >
//               {c.name}
//             </span>
//           </div>
//           <ScoreBar score={c.score} />
//         </div>

//         <div style={{ textAlign: "right" }}>
//           <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
//             ${current?.toFixed(2) || "—"}
//           </div>
//           <div style={{ fontSize: 11, color: "#444" }}>
//             ${(c.marketCap / 1e6).toFixed(0)}M cap
//           </div>
//         </div>
//       </div>

//       {/* Expanded detail */}
//       {expanded && (
//         <div>
//           {/* Tags */}
//           <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
//             <Tag color="#00ff8722" border="#00ff87" text={`${c.clusterSize} insiders`} />
//             {c.zScore != null && (
//               <Tag color="#ffd70022" border="#ffd700" text={`Z-score ${c.zScore}`} />
//             )}
//             {c.currentRatio != null && (
//               <Tag color="#4ecdc422" border="#4ecdc4" text={`CR ${c.currentRatio}`} />
//             )}
//             {c.within7Days && (
//               <Tag color="#a855f722" border="#a855f7" text="≤7 day cluster" />
//             )}
//             {c.firstTimeBuyer && (
//               <Tag color="#06b6d422" border="#06b6d4" text="First-time buyer" />
//             )}
//             {c.daysToEarnings != null && c.daysToEarnings <= 60 && (
//               <Tag color="#f9731622" border="#f97316" text={`Earnings in ${c.daysToEarnings}d`} />
//             )}
//           </div>

//           {/* Score breakdown */}
//           <div style={{ background: "#080814", borderRadius: 8, padding: 16, marginBottom: 16 }}>
//             <div style={{ fontSize: 11, color: "#555", marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>
//               Signal Breakdown
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
//               <ScorePill label="C1 Purchase Quality" val={c.breakdown.c1} max={30} />
//               <ScorePill label="C2 Cluster Strength" val={c.breakdown.c2} max={20} />
//               <ScorePill label="C3 Price Context"    val={c.breakdown.c3} max={15} />
//               <ScorePill label="C4 Earnings Prox."   val={c.breakdown.c4} max={15} />
//             </div>
//           </div>

//           {/* 52-week range */}
//           <div style={{ background: "#080814", borderRadius: 8, padding: 16, marginBottom: 16 }}>
//             <div style={{ fontSize: 11, color: "#555", marginBottom: 10, letterSpacing: 2, textTransform: "uppercase" }}>
//               52-Week Range
//             </div>
//             <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 6 }}>
//               <span>${low52?.toFixed(2)}</span>
//               <span style={{ color: "#888" }}>Current: ${current?.toFixed(2)}</span>
//               <span>${high52?.toFixed(2)}</span>
//             </div>
//             <div style={{ height: 8, background: "#1a1a2e", borderRadius: 4, position: "relative" }}>
//               <div
//                 style={{
//                   position: "absolute", left: `${pctFromLow}%`, top: -3,
//                   width: 14, height: 14, borderRadius: "50%",
//                   background: scoreColor, border: "2px solid #000",
//                   transform: "translateX(-50%)", boxShadow: `0 0 8px ${scoreColor}`,
//                 }}
//               />
//             </div>
//           </div>

//           {/* Trade setup */}
//           <div
//             style={{
//               background: "#0a1a0f", border: "1px solid #00ff8744",
//               borderRadius: 8, padding: 16,
//             }}
//           >
//             <div style={{ fontSize: 11, color: "#00ff87", marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>
//               Suggested Trade Setup
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
//               <TradeField label="Entry"     val={`~$${current?.toFixed(2)}`} color="#fff" />
//               <TradeField label="Stop Loss" val={`$${c.swingLow?.toFixed(2)}`} color="#ff6b6b" />
//               <TradeField label="Risk"      val={`${riskPct}%`} color="#ffd700" />
//             </div>
//             <div style={{ fontSize: 11, color: "#447755", marginTop: 12 }}>
//               ⚡ Target: 30-day high exit window · Buy common stock only
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";
import { ScoreBar, ScorePill, Tag, TradeField } from "./ui";

function fmt$(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function CandidateCard({ c, rank }) {
  const [expanded, setExpanded] = useState(false);

  const { current, high52, low52 } = c.quote || {};
  const range = (high52 ?? 0) - (low52 ?? 0);
  const pctFromLow = range > 0 ? ((current - low52) / range) * 100 : 50;
  const riskPct =
    current && c.swingLow
      ? (((current - c.swingLow) / current) * 100).toFixed(1)
      : "N/A";

  const scoreColor =
    c.score >= 55 ? "#00ff87" : c.score >= 35 ? "#ffd700" : "#ff6b6b";

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "linear-gradient(135deg, #0d0d1a 0%, #111128 100%)",
        border: `1px solid ${expanded ? scoreColor : "#1e1e3a"}`,
        borderRadius: 12,
        padding: "20px 24px",
        cursor: "pointer",
        transition: "border-color 0.2s",
        marginBottom: 12,
      }}
    >
      {/* ── Header row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: expanded ? 20 : 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: scoreColor + "22",
            border: `2px solid ${scoreColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 900,
            color: scoreColor,
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          #{rank}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              {c.ticker}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#555",
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.name}
            </span>
          </div>
          <ScoreBar score={c.score} />
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "monospace",
            }}
          >
            ${current?.toFixed(2) ?? "—"}
          </div>
          <div style={{ fontSize: 11, color: "#444" }}>
            {c.marketCap != null
              ? `$${(c.marketCap / 1e6).toFixed(0)}M cap`
              : "cap unknown"}
          </div>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()}>
          {/* Tags */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <Tag
              color="#00ff8722"
              border="#00ff87"
              text={`${c.clusterSize} insider${c.clusterSize !== 1 ? "s" : ""}`}
            />
            {c.zScore != null && (
              <Tag
                color="#ffd70022"
                border="#ffd700"
                text={`Z-score ${c.zScore}`}
              />
            )}
            {c.currentRatio != null && (
              <Tag
                color="#4ecdc422"
                border="#4ecdc4"
                text={`CR ${c.currentRatio}`}
              />
            )}
            {c.within7Days && (
              <Tag color="#a855f722" border="#a855f7" text="≤7 day cluster" />
            )}
            {c.totalPurchaseValue > 0 && (
              <Tag
                color="#06b6d422"
                border="#06b6d4"
                text={`${fmt$(c.totalPurchaseValue)} bought`}
              />
            )}
            {c.daySpan != null && (
              <Tag
                color="#55555522"
                border="#666"
                text={`${c.daySpan}d window`}
              />
            )}
          </div>

          {/* Insider list */}
          {c.uniqueInsiders?.length > 0 && (
            <div
              style={{
                background: "#080814",
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  marginBottom: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Buying Insiders
              </div>
              {c.filings?.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom:
                      i < c.filings.length - 1 ? "1px solid #111128" : "none",
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: "#ccc" }}>
                      {f.insiderName || "Unknown"}
                    </span>
                    {f.insiderTitle && (
                      <span style={{ color: "#444", marginLeft: 8 }}>
                        {f.insiderTitle}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#00ff87", fontFamily: "monospace" }}>
                    {fmt$(f.totalValue)}
                    <span style={{ color: "#333", marginLeft: 6 }}>
                      @ ${f.purchases?.[0]?.price?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score breakdown */}
          <div
            style={{
              background: "#080814",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#555",
                marginBottom: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Signal Breakdown
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <ScorePill
                label="C1 Purchase Quality"
                val={c.breakdown.c1}
                max={30}
              />
              <ScorePill
                label="C2 Cluster Strength"
                val={c.breakdown.c2}
                max={20}
              />
              <ScorePill
                label="C3 Price Context"
                val={c.breakdown.c3}
                max={15}
              />
              <ScorePill
                label="C4 Earnings Prox."
                val={c.breakdown.c4}
                max={15}
              />
            </div>
          </div>

          {/* 52-week price range */}
          <div
            style={{
              background: "#080814",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#555",
                marginBottom: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              52-Week Range
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#666",
                marginBottom: 6,
              }}
            >
              <span>${low52?.toFixed(2) ?? "—"}</span>
              <span style={{ color: "#888" }}>
                Current: ${current?.toFixed(2) ?? "—"}
              </span>
              <span>${high52?.toFixed(2) ?? "—"}</span>
            </div>
            <div
              style={{
                height: 8,
                background: "#1a1a2e",
                borderRadius: 4,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${Math.min(Math.max(pctFromLow, 2), 98)}%`,
                  top: -3,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: scoreColor,
                  border: "2px solid #000",
                  transform: "translateX(-50%)",
                  boxShadow: `0 0 8px ${scoreColor}`,
                }}
              />
            </div>
          </div>

          {/* Trade setup */}
          <div
            style={{
              background: "#0a1a0f",
              border: "1px solid #00ff8744",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#00ff87",
                marginBottom: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Suggested Trade Setup
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <TradeField
                label="Entry"
                val={`~$${current?.toFixed(2) ?? "—"}`}
                color="#fff"
              />
              <TradeField
                label="Stop Loss"
                val={`$${c.swingLow?.toFixed(2) ?? "—"}`}
                color="#ff6b6b"
              />
              <TradeField label="Risk" val={`${riskPct}%`} color="#ffd700" />
            </div>
            <div style={{ fontSize: 11, color: "#447755", marginTop: 12 }}>
              ⚡ Target: 30-day high exit window · Buy common stock only
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
