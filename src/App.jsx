import { useState, useCallback } from "react";
import { Header }       from "./components/Header";
import { IdleView }     from "./components/IdleView";
import { ScanningView } from "./components/ScanningView";
import { ResultsView }  from "./components/ResultsView";
import useScan          from "./hooks/useScan";

export default function App() {
  const [lookback, setLookback] = useState(14);
  const { phase, logs, progress, results, runScan, reset } = useScan();

  const handleScan = useCallback(() => runScan(lookback), [runScan, lookback]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06060f",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: "#ccc",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a18; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }
        @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <Header lookback={lookback} setLookback={setLookback} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px" }}>
        {phase === "idle" && (
          <IdleView lookback={lookback} onScan={handleScan} />
        )}
        {(phase === "scanning" || phase === "error") && (
          <ScanningView logs={logs} progress={progress} />
        )}
        {phase === "complete" && (
          <ResultsView results={results} logs={logs} onReset={reset} />
        )}
      </div>
    </div>
  );
}
