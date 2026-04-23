const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  market: {
    snapshot:  ()               => get('/api/market/snapshot'),
    watchlist: (tickers?: string) => get(`/api/market/watchlist${tickers ? `?tickers=${tickers}` : ''}`),
    prices:    (ticker: string, period = '1y') => get(`/api/market/prices/${ticker}?period=${period}`),
  },
  portfolio: {
    analytics: (params: {
      tickers: string; shares: string; buyPrices: string;
      period?: string; benchmark?: string; riskFree?: number
    }) => get(
      `/api/portfolio/analytics?tickers=${params.tickers}&shares=${params.shares}&buy_prices=${params.buyPrices}` +
      `&period=${params.period||'1y'}&benchmark=${params.benchmark||'SPY'}&risk_free=${params.riskFree||0.02}`
    ),
  },
  technicals: (ticker: string, period = '1y') => get(`/api/technicals/${ticker}?period=${period}`),
  options: {
    price: (S: number, K: number, T: number, r: number, sigma: number, type: string) =>
      get(`/api/options/price?S=${S}&K=${K}&T=${T}&r=${r}&sigma=${sigma}&option_type=${type}`),
    iv: (marketPrice: number, S: number, K: number, T: number, r: number, type: string) =>
      get(`/api/options/iv?market_price=${marketPrice}&S=${S}&K=${K}&T=${T}&r=${r}&option_type=${type}`),
  },
  screener: (tickers?: string, period = '3mo') =>
    get(`/api/screener?tickers=${tickers || 'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,JPM,V,JNJ'}&period=${period}`),
}