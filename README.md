# Insider Signal Screener

SEC EDGAR Form 4 insider purchase screener — 4-step filter pipeline.

## Folder Structure

```
insider-screener/
├── index.html                  # Vite HTML entry point
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                # ReactDOM root
    ├── App.jsx                 # Root component — phase routing only
    ├── config.js               # All constants (filters, thresholds, URLs)
    │
    ├── api/
    │   ├── edgar.js            # SEC EDGAR API calls (submissions, facts, Form 4 parse)
    │   └── market.js           # Yahoo Finance quote fetcher
    │
    ├── utils/
    │   ├── financials.js       # Altman Z-score, current ratio, survival check
    │   └── scoring.js          # C1–C4 signal scoring engine
    │
    ├── hooks/
    │   └── useScan.js          # Main scan orchestration (Steps 1–4)
    │
    └── components/
        ├── ui.jsx              # Primitive UI: ScoreBar, ScorePill, Tag, TradeField
        ├── Header.jsx          # App header + lookback window selector
        ├── IdleView.jsx        # Landing / ready state
        ├── ScanningView.jsx    # Progress bar + live log console
        ├── ResultsView.jsx     # Ranked candidate list + scan log
        └── CandidateCard.jsx   # Expandable card with scores + trade setup
```

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

- **`config.js`** — single source of truth for all thresholds. Change filter values here.
- **`api/`** — pure async functions, no React. Easy to swap data sources.
- **`utils/`** — pure functions. `financials.js` handles Step 2; `scoring.js` handles Step 3.
- **`hooks/useScan.js`** — wires the pipeline together, owns scan state.
- **`App.jsx`** — renders the correct view based on `phase` (idle → scanning → complete).

## Step Pipeline

| Step | Where | What |
|------|-------|------|
| 1 | `useScan.js` + `edgar.js` | Form 4 Code P filter, market cap, cluster detection |
| 2 | `financials.js` | Altman Z-score, current ratio, survival check |
| 3 | `scoring.js` | C1–C4 signal score (0–80) |
| 4 | `CandidateCard.jsx` | Trade setup: entry, stop loss, risk % |
