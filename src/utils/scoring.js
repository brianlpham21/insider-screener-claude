import { SCORING } from "../config";

/**
 * Scores a candidate across the four criteria (C1–C4).
 * Returns { score, breakdown }.
 */
export function scoreSignal({
  ticker,
  clusterSize,
  compPct,
  within7Days,
  priceData,
  daysToEarnings,
  insiderTitle,
  firstTimeBuyer,
  isRoutine,
}) {
  // ── C1: Purchase Quality (0–30) ──────────────────────────────────────────
  let c1 = 0;
  if (compPct >= 25) c1 = 30;
  else if (compPct >= 10) c1 = 20;
  else if (compPct >= 5) c1 = 10;

  // Role multiplier: CEO/CFO get 1.5x, capped at max
  const role = (insiderTitle || "").toLowerCase();
  const isSenior =
    role.includes("ceo") ||
    role.includes("chief executive") ||
    role.includes("cfo") ||
    role.includes("chief financial");
  if (isSenior) c1 = Math.min(SCORING.C1_MAX, Math.round(c1 * 1.5));

  if (firstTimeBuyer) c1 = Math.min(SCORING.C1_MAX, c1 + 5);
  if (isRoutine) c1 = Math.max(0, c1 - 10);

  // ── C2: Cluster Strength (0–20) ──────────────────────────────────────────
  let c2 = 0;
  if (clusterSize >= 4) c2 = 20;
  else if (clusterSize === 3) c2 = 15;
  else if (clusterSize === 2) c2 = 10;
  if (within7Days) c2 = Math.min(25, c2 + 5);

  // ── C3: Price Context (0–15) ─────────────────────────────────────────────
  let c3 = 0;
  const { current, high52, low52 } = priceData || {};
  if (current && high52 && low52) {
    const range = high52 - low52;
    const midpoint = low52 + range / 2;
    const pctFromLow = (current - low52) / range;
    const pctFromHigh = (high52 - current) / high52;
    if (pctFromLow <= 0.15) c3 = 15;
    else if (current < midpoint) c3 = 10;
    else if (pctFromHigh <= 0.1) c3 = 0;
    else c3 = 5;
  }

  // ── C4: Earnings Proximity (0–15) ────────────────────────────────────────
  let c4 = 5;
  if (daysToEarnings != null) {
    if (daysToEarnings <= 60) c4 = 15;
    else if (daysToEarnings <= 120) c4 = 10;
    else c4 = 5;
  }

  return {
    score: c1 + c2 + c3 + c4,
    breakdown: { c1, c2, c3, c4 },
  };
}
