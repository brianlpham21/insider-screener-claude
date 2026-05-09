export const EDGAR_BASE = "https://data.sec.gov";
export const EDGAR_SEARCH = "https://efts.sec.gov/LATEST/search-index";
export const YAHOO_FINANCE =
  "https://query1.finance.yahoo.com/v8/finance/chart";

export const USER_AGENT = "InsiderScreener research@example.com";

export const FILTERS = {
  MAX_MARKET_CAP: 500_000_000,
  MIN_MARKET_CAP: 1_000_000,
  MIN_ALTMAN_Z: 1.81,
  MIN_CURRENT_RATIO: 1.0,
  MIN_CLUSTER_SIZE: 2,
  COMP_PCT_THRESHOLD: 5,
  LOOKBACK_OPTIONS: [7, 14, 30],
};

export const SCORING = {
  C1_MAX: 30,
  C2_MAX: 20,
  C3_MAX: 15,
  C4_MAX: 15,
  TOTAL_MAX: 80,
};
