import { EDGAR_BASE, EDGAR_SEARCH, USER_AGENT } from "../config";

// ─────────────────────────────────────────────────────────────────────────────
// Architecture notes:
//
// 1. data.sec.gov  — sends CORS headers → fetch directly, no proxy needed
// 2. efts.sec.gov  — sends CORS headers → fetch directly, no proxy needed
// 3. www.sec.gov/Archives (XML filings) — needs proxy
//
// CIK seeding strategy (most → least reliable):
//   A. EDGAR daily index files (form.idx) — definitive list of every Form 4
//      filed each day, with CIK + accession number. No guessing.
//   B. EFTS full-text search fallback — if index fetch fails
// ─────────────────────────────────────────────────────────────────────────────

const PROXY_PRIMARY = "https://corsproxy.io/?";
const PROXY_FALLBACK = "https://api.allorigins.win/raw?url=";

async function proxyFetch(url) {
  try {
    const r = await fetch(`${PROXY_PRIMARY}${encodeURIComponent(url)}`);
    if (r.ok) return r.text();
  } catch {
    /* fall through */
  }
  try {
    const r = await fetch(`${PROXY_FALLBACK}${encodeURIComponent(url)}`);
    if (r.ok) return r.text();
  } catch {
    /* fall through */
  }
  throw new Error(`Proxy failed: ${url}`);
}

async function edgarJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!r.ok) throw new Error(`EDGAR ${r.status}: ${url}`);
  return r.json();
}

// ── EDGAR daily index ─────────────────────────────────────────────────────────
// Returns array of { cik, company, accessionNumber, filingDate }
// for every Form 4 filed within the lookback window.
// Uses the quarterly form.idx files which are the authoritative record.

function getQuarterDates(date) {
  const m = date.getMonth(); // 0-indexed
  const q = Math.floor(m / 3) + 1;
  return { year: date.getFullYear(), quarter: q };
}

async function fetchDailyIndexForDate(dateStr) {
  // dateStr: "YYYY-MM-DD"
  // EDGAR daily index: /Archives/edgar/daily-index/YYYY/QTRN/form-YYYYMMDD.idx
  const [y, mo, d] = dateStr.split("-");
  const q = Math.ceil(parseInt(mo) / 3);
  const url = `https://www.sec.gov/Archives/edgar/daily-index/${y}/QTR${q}/form${y}${mo}${d}.idx`;

  try {
    const text = await proxyFetch(url);
    if (!text || text.startsWith("<!DOCTYPE")) return [];
    return parseDailyIdx(text, dateStr);
  } catch {
    return [];
  }
}

function parseDailyIdx(text, fileDate) {
  // idx format (fixed-width after a header):
  // Form Type  |Company Name            |CIK       |Date Filed|Filename
  const lines = text.split("\n");
  const results = [];

  // Skip header lines (first ~10 lines)
  let dataStarted = false;
  for (const line of lines) {
    if (line.startsWith("---")) {
      dataStarted = true;
      continue;
    }
    if (!dataStarted) continue;
    if (!line.trim()) continue;

    // Form type is in first column (fixed width ~12 chars)
    const formType = line.substring(0, 12).trim();
    if (formType !== "4") continue;

    // CIK is ~10 chars starting at position ~62
    // But widths vary — split on multiple spaces
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length < 4) continue;

    const form = parts[0];
    if (form !== "4") continue;

    const company = parts[1];
    const cik = parts[2];
    const date = parts[3];
    const filename = parts[4] || "";

    // Extract accession number from filename like edgar/data/12345/0001234567-24-000001.txt
    const accMatch = filename.match(/(\d{10}-\d{2}-\d{6})/);
    if (!accMatch) continue;

    results.push({
      cik,
      company,
      filingDate: date || fileDate,
      accessionNumber: accMatch[1],
    });
  }
  return results;
}

// ── Quarterly index fallback ──────────────────────────────────────────────────
// If daily index isn't available (weekend, holiday), use the quarterly form.idx

async function fetchQuarterlyIndex(year, quarter, cutoffDate) {
  const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/QTR${quarter}/form.idx`;
  try {
    const text = await proxyFetch(url);
    if (!text || text.startsWith("<!DOCTYPE")) return [];
    const all = parseDailyIdx(text, "");
    return all.filter(
      (r) => !cutoffDate || new Date(r.filingDate) >= cutoffDate,
    );
  } catch {
    return [];
  }
}

// ── EFTS fallback — get CIKs from search index ───────────────────────────────

async function getCIKsFromEFTS(startDate) {
  // Correct EFTS params: q is required, use empty string workaround
  const params = new URLSearchParams({
    q: '""',
    forms: "4",
    dateRange: "custom",
    startdt: startDate,
    hits_hits_total_value: "true",
  });

  // The actual working URL format (confirmed from tldrfiling.com guide)
  const url = `${EDGAR_SEARCH}?q=%22%22&forms=4&dateRange=custom&startdt=${startDate}`;

  try {
    const data = await edgarJson(url);
    const hits = data?.hits?.hits || [];
    return hits
      .map((h) => ({
        cik: String(h._source?.entity_id || "").replace(/^0+/, "") || null,
        company: h._source?.entity_name || "",
        filingDate: h._source?.file_date || startDate,
        accessionNumber: h._id || "",
      }))
      .filter((r) => r.cik);
  } catch {
    return [];
  }
}

// ── Main CIK + accession seeder ───────────────────────────────────────────────
// Tries daily index files for each day in the lookback window, then quarterly
// index, then EFTS as a last resort.

export async function getRecentForm4Filings(startDate, onLog) {
  const cutoff = new Date(startDate);
  const today = new Date();
  const filings = [];

  // Walk back day by day, fetch each day's index
  onLog("📅 Loading EDGAR daily index files...");
  const dayMs = 86400000;
  let failures = 0;

  for (let d = new Date(today); d >= cutoff; d = new Date(d - dayMs)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dayFilings = await fetchDailyIndexForDate(dateStr);
    filings.push(...dayFilings);

    if (dayFilings.length === 0) failures++;
    await new Promise((r) => setTimeout(r, 80));
  }

  if (filings.length > 0) {
    onLog(`📋 Daily index: ${filings.length} Form 4 filings found`);
    return filings;
  }

  // Fallback: quarterly index
  onLog("⚠️  Daily index unavailable — trying quarterly index...");
  const { year, quarter } = getQuarterDates(today);
  const quarterly = await fetchQuarterlyIndex(year, quarter, cutoff);
  if (quarterly.length > 0) {
    onLog(`📋 Quarterly index: ${quarterly.length} Form 4 filings found`);
    return quarterly;
  }

  // Last resort: EFTS search
  onLog("⚠️  Quarterly index failed — trying EFTS search API...");
  const eftsResults = await getCIKsFromEFTS(startDate);
  if (eftsResults.length > 0) {
    onLog(`📋 EFTS: ${eftsResults.length} results found`);
    return eftsResults;
  }

  throw new Error(
    "All EDGAR data sources failed. This is likely a CORS proxy issue — " +
      "try opening the browser console (F12 → Network) to see which requests are blocked.",
  );
}

// ── Submissions & facts (direct fetch — data.sec.gov supports CORS) ───────────

export async function fetchSubmissions(cik) {
  try {
    const padded = String(cik).padStart(10, "0");
    return await edgarJson(`${EDGAR_BASE}/submissions/CIK${padded}.json`);
  } catch {
    return null;
  }
}

export async function fetchCompanyFacts(cik) {
  try {
    const padded = String(cik).padStart(10, "0");
    return await edgarJson(
      `${EDGAR_BASE}/api/xbrl/companyfacts/CIK${padded}.json`,
    );
  } catch {
    return null;
  }
}

// ── Form 4 XML parsing ────────────────────────────────────────────────────────

export function parseForm4XML(xmlText) {
  try {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const purchases = [];

    doc.querySelectorAll("nonDerivativeTransaction").forEach((t) => {
      if (t.querySelector("transactionCode")?.textContent?.trim() !== "P")
        return;
      const shares = parseFloat(
        t.querySelector("transactionShares value")?.textContent || "0",
      );
      const price = parseFloat(
        t.querySelector("transactionPricePerShare value")?.textContent || "0",
      );
      const date = t
        .querySelector("transactionDate value")
        ?.textContent?.trim();
      const sharesOwned = parseFloat(
        t.querySelector("sharesOwnedFollowingTransaction value")?.textContent ||
          "0",
      );
      if (shares > 0 && price > 0) {
        purchases.push({
          shares,
          price,
          date,
          sharesOwned,
          value: shares * price,
        });
      }
    });

    if (!purchases.length) return null;

    const g = (sel) => doc.querySelector(sel)?.textContent?.trim() || "";
    return {
      issuer: g("issuerName"),
      ticker: g("issuerTradingSymbol").toUpperCase(),
      cik: g("issuerCik"),
      insiderName: g("rptOwnerName"),
      insiderTitle: g("officerTitle"),
      isOfficer: g("isOfficer") === "1",
      isDirector: g("isDirector") === "1",
      purchases,
      totalValue: purchases.reduce((s, p) => s + p.value, 0),
      totalShares: purchases.reduce((s, p) => s + p.shares, 0),
    };
  } catch {
    return null;
  }
}

async function fetchForm4XML(cik, accNoHyphens, accWithHyphens) {
  const base = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoHyphens}`;

  try {
    const text = await proxyFetch(`${base}/${accWithHyphens}.xml`);
    if (text?.includes("<ownershipDocument>")) return parseForm4XML(text);
  } catch {
    /* try next */
  }

  try {
    const index = await proxyFetch(`${base}/`);
    const match = index?.match(/href="([^"]+\.xml)"/i);
    if (match) {
      const file = match[1].split("/").pop();
      const text = await proxyFetch(`${base}/${file}`);
      if (text?.includes("<ownershipDocument>")) return parseForm4XML(text);
    }
  } catch {
    /* try next */
  }

  try {
    const text = await proxyFetch(`${base}/${accWithHyphens}.txt`);
    if (text?.includes("transactionCode")) return parseForm4XML(text);
  } catch {
    /* give up */
  }

  return null;
}

// ── Main scanner ──────────────────────────────────────────────────────────────

export async function scanCodePPurchases({
  startDate,
  maxCiks = 200,
  onProgress,
  onLog,
}) {
  // Step 1: Get all Form 4 filings from index files
  const allFilings = await getRecentForm4Filings(startDate, onLog);

  // Deduplicate by CIK — group accession numbers per CIK
  const byCik = {};
  for (const f of allFilings) {
    if (!f.cik) continue;
    if (!byCik[f.cik])
      byCik[f.cik] = { cik: f.cik, company: f.company, filings: [] };
    byCik[f.cik].filings.push({
      accessionNumber: f.accessionNumber,
      filingDate: f.filingDate,
    });
  }

  const ciks = Object.keys(byCik).slice(0, maxCiks);
  onLog(
    `🔍 Parsing Form 4 XML for ${ciks.length} filers (looking for Code P)...`,
  );

  const byTicker = {};
  let parsed = 0;
  let codePFound = 0;

  for (let i = 0; i < ciks.length; i++) {
    onProgress(Math.round((i / ciks.length) * 60) + 10);
    const cik = ciks[i];
    const entry = byCik[cik];

    for (const filing of entry.filings.slice(0, 2)) {
      const accRaw = filing.accessionNumber.replace(/-/g, "");
      const accFmt = filing.accessionNumber.includes("-")
        ? filing.accessionNumber
        : `${accRaw.slice(0, 10)}-${accRaw.slice(10, 12)}-${accRaw.slice(12)}`;

      try {
        const form4 = await fetchForm4XML(cik, accRaw, accFmt);
        parsed++;
        if (!form4) continue;

        codePFound++;
        const ticker = form4.ticker || entry.company;
        if (!ticker) continue;

        if (!byTicker[ticker]) {
          byTicker[ticker] = {
            ticker,
            name: form4.issuer || entry.company,
            cik,
            filings: [],
          };
        }
        byTicker[ticker].filings.push({
          ...form4,
          filingDate: filing.filingDate,
        });
      } catch {
        /* skip */
      }

      await new Promise((r) => setTimeout(r, 80));
    }
  }

  onLog(
    `📊 Parsed ${parsed} filings — ${codePFound} had Code P purchases across ${Object.keys(byTicker).length} tickers`,
  );
  return byTicker;
}
