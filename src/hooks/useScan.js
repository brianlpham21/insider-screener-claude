// import { useState, useCallback } from "react";
// import { fetchRecentForm4CIKs, fetchSubmissions, fetchCompanyFacts } from "../api/edgar";
// import { getStockQuote } from "../api/market";
// import { calcAltmanZ, passesSurvivalCheck } from "../utils/financials";
// import { scoreSignal } from "../utils/scoring";
// import { FILTERS, DEMO_TICKERS, CORS_PROXY } from "../config";

// function useScan() {
//   const [phase, setPhase] = useState("idle"); // idle | scanning | complete | error
//   const [logs, setLogs] = useState([]);
//   const [progress, setProgress] = useState(0);
//   const [results, setResults] = useState([]);

//   const log = useCallback((msg) => setLogs((prev) => [...prev, msg]), []);

//   const reset = useCallback(() => {
//     setLogs([]);
//     setResults([]);
//     setProgress(0);
//     setPhase("idle");
//   }, []);

//   // ── Demo fallback using real Yahoo Finance quotes ─────────────────────────
//   const runDemo = useCallback(async () => {
//     log("🔄 Running with real market data (EDGAR fallback mode)...");
//     const output = [];

//     for (let i = 0; i < DEMO_TICKERS.length; i++) {
//       const ticker = DEMO_TICKERS[i];
//       setProgress(10 + i * 9);
//       log(`Checking ${ticker}...`);

//       try {
//         const quote = await getStockQuote(ticker);
//         if (!quote?.current) continue;

//         const marketCap = (quote.current || 0) * (quote.sharesOut || 1e7);
//         const clusterSize = Math.floor(Math.random() * 4) + 2;
//         const compPct = Math.random() * 25 + 3;
//         const daysToEarnings = Math.floor(Math.random() * 140) + 15;
//         const isRoutine = Math.random() > 0.75;
//         const firstTimeBuyer = Math.random() > 0.5;
//         const within7Days = Math.random() > 0.4;
//         const zScore = parseFloat((Math.random() * 3 + 0.5).toFixed(2));
//         const currentRatio = parseFloat((Math.random() * 2 + 0.8).toFixed(2));

//         if (zScore < FILTERS.MIN_ALTMAN_Z || currentRatio < FILTERS.MIN_CURRENT_RATIO) {
//           log(`❌ ${ticker} — Failed survival check (Z: ${zScore}, CR: ${currentRatio})`);
//           continue;
//         }
//         if (clusterSize < FILTERS.MIN_CLUSTER_SIZE) {
//           log(`❌ ${ticker} — Insufficient cluster (${clusterSize} insider)`);
//           continue;
//         }

//         log(`✅ ${ticker} — $${(marketCap / 1e6).toFixed(0)}M cap, ${clusterSize} insiders buying`);

//         const { score, breakdown } = scoreSignal({
//           ticker, clusterSize, compPct, within7Days,
//           priceData: quote, daysToEarnings,
//           insiderTitle: Math.random() > 0.5 ? "Chief Executive Officer" : "Chief Financial Officer",
//           firstTimeBuyer, isRoutine,
//         });

//         output.push({
//           ticker,
//           name: `${ticker} Corporation`,
//           marketCap,
//           clusterSize,
//           zScore,
//           currentRatio,
//           quote,
//           score,
//           breakdown,
//           swingLow: quote.low52 * (1 + Math.random() * 0.08),
//           totalPurchaseValue: Math.floor(Math.random() * 900000 + 50000),
//           daysToEarnings,
//           compPct,
//           within7Days,
//           firstTimeBuyer,
//           isRoutine,
//         });

//         await new Promise((r) => setTimeout(r, 300));
//       } catch {
//         continue;
//       }
//     }

//     output.sort((a, b) => b.score - a.score);
//     setProgress(100);
//     setPhase("complete");
//     log(`\n🎯 ${output.length} candidates passed all filters.`);
//     setResults(output);
//   }, [log]);

//   // ── Primary EDGAR scan ────────────────────────────────────────────────────
//   const runScan = useCallback(async (lookback) => {
//     setLogs([]);
//     setResults([]);
//     setProgress(0);
//     setPhase("scanning");

//     try {
//       log("🔍 Connecting to SEC EDGAR...");
//       const cutoff = new Date();
//       cutoff.setDate(cutoff.getDate() - lookback);
//       const startDate = cutoff.toISOString().split("T")[0];

//       const ciks = await fetchRecentForm4CIKs(startDate);
//       log(`📊 Found ${ciks.length} companies with recent Form 4 activity`);

//       const byTicker = {};
//       let processed = 0;

//       for (const cik of ciks) {
//         setProgress(Math.round((processed / ciks.length) * 40));
//         processed++;

//         try {
//           const subData = await fetchSubmissions(cik);
//           if (!subData?.tickers?.[0]) continue;

//           const ticker = subData.tickers[0];
//           const filings = subData.filings?.recent;
//           if (!filings) continue;

//           const form4Indices = filings.form
//             ?.map((f, i) => (f === "4" ? i : -1))
//             .filter((i) => i >= 0)
//             .slice(0, 5);

//           if (!form4Indices?.length) continue;

//           for (const idx of form4Indices) {
//             const fileDate = filings.filingDate?.[idx];
//             if (!fileDate || new Date(fileDate) < cutoff) continue;
//             const accNum = filings.accessionNumber?.[idx];
//             if (!accNum) continue;

//             if (!byTicker[ticker]) {
//               byTicker[ticker] = { ticker, name: subData.name, cik, insiders: [] };
//             }
//             byTicker[ticker].insiders.push({ fileDate, accNum });
//           }
//         } catch {
//           // skip individual failures
//         }
//         await new Promise((r) => setTimeout(r, 150));
//       }

//       log(`📝 Processing ${Object.keys(byTicker).length} tickers with Form 4 activity...`);
//       const candidates = [];
//       const tickers = Object.keys(byTicker).slice(0, 20);
//       let tickerIdx = 0;

//       for (const ticker of tickers) {
//         setProgress(40 + Math.round((tickerIdx / tickers.length) * 30));
//         tickerIdx++;

//         const entry = byTicker[ticker];
//         if (entry.insiders.length < FILTERS.MIN_CLUSTER_SIZE) continue;

//         const quote = await getStockQuote(ticker);
//         if (!quote?.current) continue;

//         const marketCap = (quote.current || 0) * (quote.sharesOut || 0);
//         if (marketCap > FILTERS.MAX_MARKET_CAP || marketCap < FILTERS.MIN_MARKET_CAP) continue;

//         log(`✅ ${ticker} — Market cap $${(marketCap / 1e6).toFixed(1)}M`);

//         const facts = await fetchCompanyFacts(entry.cik);
//         const zData = facts ? calcAltmanZ(facts) : null;

//         if (!passesSurvivalCheck(zData)) {
//           log(`❌ ${ticker} — Failed survival check (Z: ${zData?.z}, CR: ${zData?.currentRatio})`);
//           continue;
//         }

//         const dates = entry.insiders.map((i) => new Date(i.fileDate)).sort((a, b) => a - b);
//         const daySpan =
//           dates.length > 1 ? (dates[dates.length - 1] - dates[0]) / 86400000 : 0;
//         const compPct = Math.random() * 20 + 3; // placeholder — needs DEF 14A

//         const { score, breakdown } = scoreSignal({
//           ticker,
//           clusterSize: entry.insiders.length,
//           compPct,
//           within7Days: daySpan <= 7,
//           priceData: quote,
//           daysToEarnings: Math.floor(Math.random() * 150) + 10,
//           insiderTitle: "Chief Executive Officer",
//           firstTimeBuyer: Math.random() > 0.5,
//           isRoutine: false,
//         });

//         candidates.push({
//           ticker,
//           name: entry.name,
//           marketCap,
//           clusterSize: entry.insiders.length,
//           zScore: zData?.z,
//           currentRatio: zData?.currentRatio,
//           quote,
//           score,
//           breakdown,
//           swingLow: quote.low52,
//           insiders: entry.insiders,
//         });

//         await new Promise((r) => setTimeout(r, 200));
//       }

//       candidates.sort((a, b) => b.score - a.score);
//       setProgress(100);
//       setPhase("complete");
//       log(`\n🎯 Scan complete. ${candidates.length} candidates passed all filters.`);
//       setResults(candidates);
//     } catch (err) {
//       log(`❌ Error: ${err.message}`);
//       log("⚠️  Falling back to demo mode with live market data...");
//       await runDemo();
//     }
//   }, [log, runDemo]);

//   return { phase, logs, progress, results, runScan, reset };
// }

// export default useScan;

import { useState, useCallback } from "react";
import { scanCodePPurchases, fetchCompanyFacts } from "../api/edgar";
import { getStockQuote } from "../api/market";
import { calcAltmanZ, passesSurvivalCheck } from "../utils/financials";
import { scoreSignal } from "../utils/scoring";
import { FILTERS } from "../config";

function useScan() {
  const [phase, setPhase] = useState("idle"); // idle | scanning | complete | error
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const log = useCallback((msg) => setLogs((prev) => [...prev, msg]), []);

  const reset = useCallback(() => {
    setLogs([]);
    setResults([]);
    setProgress(0);
    setPhase("idle");
  }, []);

  const runScan = useCallback(
    async (lookback) => {
      setLogs([]);
      setResults([]);
      setProgress(0);
      setPhase("scanning");

      try {
        log("🔍 Starting SEC EDGAR scan...");

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - lookback);
        const startDate = cutoff.toISOString().split("T")[0];

        // ── Step 1: Pull all Code P purchases from EDGAR ──────────────────────
        const purchasesByTicker = await scanCodePPurchases({
          startDate,
          maxCiks: 100,
          onProgress: (p) => setProgress(p),
          onLog: log,
        });

        const tickers = Object.keys(purchasesByTicker);
        log(
          `\n📊 Found Code P purchases in ${tickers.length} tickers — applying filters...`,
        );

        if (tickers.length === 0) {
          log(
            "⚠️  No Code P purchases found. EDGAR XML parsing may be blocked by the proxy.",
          );
          log("💡 Try running again — proxy rate limits are intermittent.");
          setProgress(100);
          setPhase("complete");
          setResults([]);
          return;
        }

        const candidates = [];
        let tickerIdx = 0;

        for (const ticker of tickers) {
          tickerIdx++;
          setProgress(65 + Math.round((tickerIdx / tickers.length) * 30));

          const entry = purchasesByTicker[ticker];

          // ── Cluster check: need 2+ unique insiders buying ─────────────────
          // Count unique insiders by name across all filings
          const uniqueInsiders = [
            ...new Set(entry.filings.map((f) => f.insiderName).filter(Boolean)),
          ];
          if (uniqueInsiders.length < FILTERS.MIN_CLUSTER_SIZE) {
            log(
              `⏭  ${ticker} — only ${uniqueInsiders.length} unique insider(s), skipping`,
            );
            continue;
          }

          // ── Market cap filter ─────────────────────────────────────────────
          const quote = await getStockQuote(ticker);
          if (!quote?.current) {
            log(`⏭  ${ticker} — no price data`);
            continue;
          }

          // sharesOut is often null for small caps on Yahoo — fall back to
          // a rough estimate from the purchase data to avoid false rejects
          let marketCap = (quote.current || 0) * (quote.sharesOut || 0);
          if (marketCap === 0) {
            // Estimate: total purchase value / purchase price * 10 (rough float estimate)
            // We can't know for sure, so we let it through and note it
            log(
              `⚠️  ${ticker} — shares outstanding unavailable, estimating market cap`,
            );
            marketCap = null; // null = unknown, don't filter out
          }

          if (marketCap !== null && marketCap > FILTERS.MAX_MARKET_CAP) {
            log(
              `⏭  ${ticker} — market cap $${(marketCap / 1e6).toFixed(0)}M exceeds $500M cap`,
            );
            continue;
          }
          if (marketCap !== null && marketCap < FILTERS.MIN_MARKET_CAP) {
            log(
              `⏭  ${ticker} — market cap too small (< $1M), likely delisted`,
            );
            continue;
          }

          log(
            `✅ ${ticker} — ${uniqueInsiders.length} insiders · ${
              marketCap !== null
                ? `$${(marketCap / 1e6).toFixed(1)}M cap`
                : "cap unknown"
            }`,
          );

          // ── Step 2: Survival check ────────────────────────────────────────
          const facts = await fetchCompanyFacts(entry.cik);
          const zData = facts ? calcAltmanZ(facts) : null;

          if (!passesSurvivalCheck(zData)) {
            log(
              `❌ ${ticker} — failed survival check (Z: ${zData?.z ?? "n/a"}, CR: ${
                zData?.currentRatio ?? "n/a"
              })`,
            );
            continue;
          }

          // ── Step 3: Score the signal ──────────────────────────────────────
          // Cluster timing — how spread are the purchases?
          const allDates = entry.filings
            .flatMap((f) =>
              f.purchases.map((p) => new Date(p.date || f.filingDate)),
            )
            .filter(Boolean)
            .sort((a, b) => a - b);
          const daySpan =
            allDates.length > 1
              ? (allDates[allDates.length - 1] - allDates[0]) / 86400000
              : 0;

          // Purchase total and comp% — use actual purchase values from XML
          const totalPurchaseValue = entry.filings.reduce(
            (s, f) => s + f.totalValue,
            0,
          );
          // compPct placeholder until DEF 14A parsing is added
          const compPct = null;

          // Use the title of the most senior insider in the cluster
          const titles = entry.filings
            .map((f) => f.insiderTitle)
            .filter(Boolean);
          const topTitle =
            titles.find((t) =>
              /chief executive|ceo|chief financial|cfo/i.test(t),
            ) ||
            titles[0] ||
            "";

          const { score, breakdown } = scoreSignal({
            ticker,
            clusterSize: uniqueInsiders.length,
            compPct,
            within7Days: daySpan <= 7,
            priceData: quote,
            daysToEarnings: null, // placeholder — add earnings calendar API to enrich
            insiderTitle: topTitle,
            firstTimeBuyer: false, // placeholder — add Form 4 history lookup to enrich
            isRoutine: false,
          });

          candidates.push({
            ticker,
            name: entry.name,
            marketCap,
            clusterSize: uniqueInsiders.length,
            uniqueInsiders,
            insiderTitles: titles,
            zScore: zData?.z ?? null,
            currentRatio: zData?.currentRatio ?? null,
            quote,
            score,
            breakdown,
            swingLow: quote.low52,
            totalPurchaseValue,
            daySpan: Math.round(daySpan),
            within7Days: daySpan <= 7,
            topTitle,
            filings: entry.filings,
          });

          await new Promise((r) => setTimeout(r, 150));
        }

        candidates.sort((a, b) => b.score - a.score);
        setProgress(100);
        setPhase("complete");
        log(
          `\n🎯 Scan complete — ${candidates.length} candidate${
            candidates.length !== 1 ? "s" : ""
          } passed all filters`,
        );
        setResults(candidates);
      } catch (err) {
        log(`❌ Fatal error: ${err.message}`);
        setPhase("error");
      }
    },
    [log],
  );

  return { phase, logs, progress, results, runScan, reset };
}

export default useScan;
