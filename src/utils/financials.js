import { FILTERS } from "../config";

/**
 * Extracts the most recent value for a given XBRL concept from company facts.
 */
function getLatestFact(usGaap, key) {
  const data = usGaap[key]?.units?.USD;
  if (!data) return null;
  const annual = data.filter((d) => d.form === "10-K" && d.val != null);
  if (annual.length) return annual[annual.length - 1].val;
  const quarterly = data.filter((d) => d.form === "10-Q" && d.val != null);
  return quarterly.length ? quarterly[quarterly.length - 1].val : null;
}

/**
 * Calculates Altman Z-score and current ratio from SEC XBRL company facts.
 * Returns null if insufficient data.
 */
export function calcAltmanZ(facts) {
  try {
    const us = facts?.facts?.["us-gaap"];
    if (!us) return null;

    const totalAssets = getLatestFact(us, "Assets");
    if (!totalAssets || totalAssets === 0) return null;

    const currentAssets = getLatestFact(us, "AssetsCurrent");
    const currentLiabilities = getLatestFact(us, "LiabilitiesCurrent");
    const retainedEarnings = getLatestFact(us, "RetainedEarningsAccumulatedDeficit");
    const ebit = getLatestFact(us, "OperatingIncomeLoss");
    const revenue =
      getLatestFact(us, "Revenues") ||
      getLatestFact(us, "RevenueFromContractWithCustomerExcludingAssessedTax");
    const totalLiabilities = getLatestFact(us, "Liabilities");

    const workingCapital = (currentAssets || 0) - (currentLiabilities || 0);
    const bookEquity = totalAssets - (totalLiabilities || 0);

    const X1 = workingCapital / totalAssets;
    const X2 = (retainedEarnings || 0) / totalAssets;
    const X3 = (ebit || 0) / totalAssets;
    const X4 = totalLiabilities ? bookEquity / totalLiabilities : 1;
    const X5 = (revenue || 0) / totalAssets;

    const z = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5;
    const currentRatio = currentLiabilities ? (currentAssets || 0) / currentLiabilities : null;

    return {
      z: parseFloat(z.toFixed(2)),
      currentRatio: currentRatio ? parseFloat(currentRatio.toFixed(2)) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Returns true if the company passes the survival check (Step 2).
 */
export function passesSurvivalCheck(zData) {
  if (!zData) return true; // no data = don't reject on this basis alone
  if (zData.z != null && zData.z < FILTERS.MIN_ALTMAN_Z) return false;
  if (zData.currentRatio != null && zData.currentRatio < FILTERS.MIN_CURRENT_RATIO) return false;
  return true;
}
