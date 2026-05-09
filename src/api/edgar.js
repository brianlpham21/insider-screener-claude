// import { EDGAR_BASE, EDGAR_BROWSE, EDGAR_SEARCH, USER_AGENT, CORS_PROXY } from "../config";

// export async function fetchSubmissions(cik) {
//   const paddedCik = String(cik).padStart(10, "0");
//   const resp = await fetch(`${EDGAR_BASE}/submissions/CIK${paddedCik}.json`, {
//     headers: { "User-Agent": USER_AGENT },
//   });
//   if (!resp.ok) return null;
//   return resp.json();
// }

// export async function fetchCompanyFacts(cik) {
//   const paddedCik = String(cik).padStart(10, "0");
//   const resp = await fetch(`${EDGAR_BASE}/api/xbrl/companyfacts/CIK${paddedCik}.json`, {
//     headers: { "User-Agent": USER_AGENT },
//   });
//   if (!resp.ok) return null;
//   return resp.json();
// }

// export async function fetchRecentForm4CIKs(startDate) {
//   const url = `${EDGAR_BROWSE}?action=getcurrent&type=4&dateb=&owner=include&count=100&search_text=`;
//   const resp = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
//     headers: { "User-Agent": USER_AGENT },
//   });
//   if (!resp.ok) throw new Error(`EDGAR browse failed: ${resp.status}`);
//   const html = await resp.text();
//   const matches = [...html.matchAll(/\/cgi-bin\/browse-edgar\?action=getcompany&CIK=(\d+)/g)];
//   return [...new Set(matches.map((m) => m[1]))].slice(0, 40);
// }

// export async function fetchEdgarSearchCount(startDate) {
//   const url = `${EDGAR_SEARCH}?forms=4&dateRange=custom&startdt=${startDate}&hits.hits.total.value=true`;
//   const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
//   if (!resp.ok) throw new Error(`EDGAR search failed: ${resp.status}`);
//   return resp.json();
// }

// export function parseForm4XML(xmlText) {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(xmlText, "text/xml");
//   const transactions = [];

//   doc.querySelectorAll("nonDerivativeTransaction").forEach((t) => {
//     const code = t.querySelector("transactionCode")?.textContent?.trim();
//     if (code !== "P") return;
//     const shares = parseFloat(t.querySelector("transactionShares value")?.textContent || "0");
//     const price = parseFloat(t.querySelector("transactionPricePerShare value")?.textContent || "0");
//     const date = t.querySelector("transactionDate value")?.textContent?.trim();
//     const sharesOwned = parseFloat(
//       t.querySelector("sharesOwnedFollowingTransaction value")?.textContent || "0"
//     );
//     if (shares > 0 && price > 0) {
//       transactions.push({ code, shares, price, date, sharesOwned, value: shares * price });
//     }
//   });

//   return {
//     issuer: doc.querySelector("issuerName")?.textContent?.trim() || "",
//     ticker: doc.querySelector("issuerTradingSymbol")?.textContent?.trim() || "",
//     insiderName: doc.querySelector("rptOwnerName")?.textContent?.trim() || "",
//     insiderTitle: doc.querySelector("officerTitle")?.textContent?.trim() || "",
//     isOfficer: doc.querySelector("isOfficer")?.textContent?.trim() === "1",
//     isDirector: doc.querySelector("isDirector")?.textContent?.trim() === "1",
//     transactions,
//   };
// }

import { EDGAR_BASE, EDGAR_SEARCH, USER_AGENT, CORS_PROXY } from "../config";

// ── Low-level fetch helpers ───────────────────────────────────────────────────

function edgarHeaders() {
  return { "User-Agent": USER_AGENT };
}

async function edgarGet(url) {
  const resp = await fetch(url, { headers: edgarHeaders() });
  if (!resp.ok) throw new Error(`EDGAR ${resp.status}: ${url}`);
  return resp.json();
}

async function proxyGet(url) {
  const resp = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
  if (!resp.ok) throw new Error(`Proxy ${resp.status}`);
  return resp.text();
}

// ── EDGAR submissions & facts ─────────────────────────────────────────────────

export async function fetchSubmissions(cik) {
  try {
    const paddedCik = String(cik).padStart(10, "0");
    return await edgarGet(`${EDGAR_BASE}/submissions/CIK${paddedCik}.json`);
  } catch {
    return null;
  }
}

export async function fetchCompanyFacts(cik) {
  try {
    const paddedCik = String(cik).padStart(10, "0");
    return await edgarGet(
      `${EDGAR_BASE}/api/xbrl/companyfacts/CIK${paddedCik}.json`,
    );
  } catch {
    return null;
  }
}

// ── Extract Form 4 filings from submissions data ──────────────────────────────

export function extractForm4Filings(subData, cutoffDate) {
  const filings = subData?.filings?.recent;
  if (!filings) return [];

  const results = [];
  const forms = filings.form || [];
  for (let i = 0; i < forms.length; i++) {
    if (forms[i] !== "4") continue;
    const fileDate = filings.filingDate?.[i];
    if (!fileDate || new Date(fileDate) < cutoffDate) continue;
    const accNum = filings.accessionNumber?.[i];
    if (!accNum) continue;
    results.push({ accessionNumber: accNum, filingDate: fileDate });
  }
  return results;
}

// ── Parse Form 4 XML text → structured purchase data ─────────────────────────
// Returns null if no Code P (open-market purchase) transactions found

export function parseForm4XML(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");

    const purchases = [];
    doc.querySelectorAll("nonDerivativeTransaction").forEach((t) => {
      const code = t.querySelector("transactionCode")?.textContent?.trim();
      if (code !== "P") return;

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

    if (purchases.length === 0) return null;

    const getText = (sel) => doc.querySelector(sel)?.textContent?.trim() || "";

    return {
      issuer: getText("issuerName"),
      ticker: getText("issuerTradingSymbol"),
      cik: getText("issuerCik"),
      insiderName: getText("rptOwnerName"),
      insiderTitle: getText("officerTitle"),
      isOfficer: getText("isOfficer") === "1",
      isDirector: getText("isDirector") === "1",
      purchases,
      totalValue: purchases.reduce((s, p) => s + p.value, 0),
      totalShares: purchases.reduce((s, p) => s + p.shares, 0),
    };
  } catch {
    return null;
  }
}

// ── Try multiple URL patterns to fetch and parse one Form 4 ──────────────────

async function fetchAndParseFormByIndex(cik, accNoHyphens, accWithHyphens) {
  const baseUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoHyphens}`;

  // Pattern 1: direct named XML
  try {
    const text = await proxyGet(`${baseUrl}/${accWithHyphens}.xml`);
    if (text && text.includes("<ownershipDocument>"))
      return parseForm4XML(text);
  } catch {
    /* try next */
  }

  // Pattern 2: scan the index page for an XML file
  try {
    const indexHtml = await proxyGet(`${baseUrl}/`);
    const match = indexHtml.match(/href="([^"]*\.xml)"/i);
    if (match) {
      const xmlFile = match[1].split("/").pop();
      const text = await proxyGet(`${baseUrl}/${xmlFile}`);
      if (text && text.includes("<ownershipDocument>"))
        return parseForm4XML(text);
    }
  } catch {
    /* try next */
  }

  // Pattern 3: .txt primary document
  try {
    const text = await proxyGet(`${baseUrl}/${accWithHyphens}.txt`);
    if (text && text.includes("transactionCode")) return parseForm4XML(text);
  } catch {
    /* give up */
  }

  return null;
}

// ── Main scanner: returns purchasesByTicker map ───────────────────────────────
// { ticker → { name, cik, filings: [parsedForm4] } }

export async function scanCodePPurchases({
  startDate,
  maxCiks = 100,
  onProgress,
  onLog,
}) {
  onLog("📡 Fetching recent Form 4 filer list from EDGAR...");

  // Get CIK list from EDGAR browse page (most reliable source)
  let ciks = [];
  try {
    const rssUrl =
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&count=100&search_text=";
    const html = await proxyGet(rssUrl);
    const matches = [...html.matchAll(/CIK=(\d+)/g)];
    ciks = [...new Set(matches.map((m) => m[1]))].slice(0, maxCiks);
    onLog(`📋 ${ciks.length} CIKs from EDGAR browse`);
  } catch (e) {
    onLog(`⚠️  Browse blocked (${e.message}), falling back to EFTS...`);
    try {
      const url = `${EDGAR_SEARCH}?forms=4&dateRange=custom&startdt=${startDate}`;
      const data = await edgarGet(url);
      const hits = data?.hits?.hits || [];
      // Extract CIKs from entity_id field
      ciks = [
        ...new Set(
          hits.flatMap((h) => {
            const id = h._source?.entity_id;
            return id ? [String(id)] : [];
          }),
        ),
      ].slice(0, maxCiks);
      onLog(`📋 ${ciks.length} CIKs from EFTS fallback`);
    } catch {
      throw new Error(
        "Could not retrieve CIKs from EDGAR — check your network connection",
      );
    }
  }

  const cutoffDate = new Date(startDate);
  const purchasesByTicker = {};

  for (let i = 0; i < ciks.length; i++) {
    onProgress(Math.round((i / ciks.length) * 65));
    const cik = ciks[i];

    try {
      const subData = await fetchSubmissions(cik);
      if (!subData) continue;

      const ticker = subData.tickers?.[0];
      if (!ticker) continue;

      const recentForm4s = extractForm4Filings(subData, cutoffDate);
      if (recentForm4s.length === 0) continue;

      for (const filing of recentForm4s.slice(0, 4)) {
        const accRaw = filing.accessionNumber.replace(/-/g, "");
        const accFmt = filing.accessionNumber.includes("-")
          ? filing.accessionNumber
          : `${accRaw.slice(0, 10)}-${accRaw.slice(10, 12)}-${accRaw.slice(12)}`;

        const parsed = await fetchAndParseFormByIndex(cik, accRaw, accFmt);
        if (!parsed) continue;

        if (!purchasesByTicker[ticker]) {
          purchasesByTicker[ticker] = {
            ticker,
            name: subData.name,
            cik,
            filings: [],
          };
        }
        purchasesByTicker[ticker].filings.push({
          ...parsed,
          filingDate: filing.filingDate,
        });
      }
    } catch {
      // Skip silently — individual CIK failures are expected
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  return purchasesByTicker;
}
