// Yahoo Finance doesn't support CORS from browsers.
// We use the Claude API to fetch quotes server-side — no proxy needed.

async function claudeFetch(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:
        "You are a financial data assistant. Return ONLY valid JSON, no explanation, no markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Claude API ${response.status}`);
  const data = await response.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "";
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

export async function getStockQuote(ticker) {
  try {
    const prompt = `Fetch this Yahoo Finance URL and return stock price data as JSON:
https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y

Return ONLY this JSON structure:
{
  "current": <current price as number>,
  "high52": <52-week high as number>,
  "low52": <52-week low as number>,
  "sharesOut": <shares outstanding as number or null>
}

If the ticker doesn't exist or data is unavailable, return: { "current": null }`;

    const raw = await claudeFetch(prompt);
    const data = JSON.parse(raw);
    if (!data.current) return null;
    return data;
  } catch {
    return null;
  }
}
