import { CORS_PROXY, YAHOO_FINANCE } from "../config";

export async function getStockQuote(ticker) {
  try {
    const url = `${YAHOO_FINANCE}/${ticker}?interval=1d&range=1y`;
    const resp = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const closes = result.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
    return {
      current: result.meta?.regularMarketPrice,
      high52: Math.max(...closes),
      low52: Math.min(...closes),
      sharesOut: result.meta?.sharesOutstanding,
    };
  } catch {
    return null;
  }
}
