# QuantDesk Pro API v2.0 — force redeploy
"""
QuantDesk Pro — FastAPI Backend
Wraps analytics.py, data_loader.py, options_models.py, strategies.py
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import pandas as pd
import numpy as np
import traceback
import asyncio
import httpx
import os
from datetime import datetime, timezone

# ── Import your existing Python files ────────────────────────────────────────
from data_loader import load_close_series, load_price_history
from analytics import (
    annualized_return, annualized_vol, max_drawdown_from_returns,
    sortino_ratio, calmar_ratio, omega_ratio, gain_to_pain,
    return_skew, return_kurtosis,
    historical_var, cvar, parametric_var,
    compute_alpha_beta, tracking_stats,
    covariance_matrix, marginal_vol_contribution,
    sma, ema, rsi, macd, bollinger_bands, rolling_vol,
)
from options_models import bs_price_only, implied_volatility_newton

# ── Config ────────────────────────────────────────────────────────────────────
FRONTEND_URL   = os.getenv("FRONTEND_URL", "https://quantdesk-next.vercel.app")
SUPABASE_URL   = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY   = os.getenv("SUPABASE_SERVICE_KEY", "")  # service role key (not anon)
ALERT_INTERVAL = int(os.getenv("ALERT_INTERVAL_SECONDS", "60"))

app = FastAPI(
    title="QuantDesk Pro API",
    description="Portfolio analytics, market data, options pricing",
    version="1.0.0",
)

# ── CORS — allow Next.js frontend ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://quantdesk-next.vercel.app",
        "https://quantdesk-pro.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def safe(val):
    if val is None: return None
    if isinstance(val, float) and (np.isnan(val) or np.isinf(val)): return None
    return val


def series_to_chart(s: pd.Series) -> list[dict]:
    """Convert a pandas Series to [{date, value}] for recharts."""
    return [
        {"date": str(idx)[:10], "value": round(float(v), 6)}
        for idx, v in s.items()
        if not (isinstance(v, float) and np.isnan(v))
    ]


def get_current_price(ticker: str) -> float | None:
    """Fetch latest close price for a ticker."""
    try:
        s = load_close_series(ticker.upper(), period="5d")
        if s is None or len(s) < 1:
            return None
        return float(s.iloc[-1])
    except Exception:
        return None


# ── ALERT SCHEDULER ───────────────────────────────────────────────────────────
async def check_alerts():
    """
    Runs every ALERT_INTERVAL seconds.
    Fetches all active alerts from Supabase, checks prices,
    and fires the Next.js trigger endpoint for any that trip.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[alerts] Supabase not configured — skipping alert check")
        return

    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Fetch all active alerts
        try:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/alerts?status=eq.active&select=*",
                headers=headers,
            )
            if resp.status_code != 200:
                print(f"[alerts] Failed to fetch alerts: {resp.status_code}")
                return
            alerts = resp.json()
        except Exception as e:
            print(f"[alerts] Error fetching alerts: {e}")
            return

        if not alerts:
            return

        # 2. Group by ticker to minimise API calls
        ticker_map: dict[str, list[dict]] = {}
        for alert in alerts:
            t = alert["ticker"]
            ticker_map.setdefault(t, []).append(alert)

        # 3. Check each ticker
        for ticker, ticker_alerts in ticker_map.items():
            price = get_current_price(ticker)
            if price is None:
                continue

            for alert in ticker_alerts:
                target    = float(alert["target_price"])
                condition = alert["condition"]
                triggered = (
                    (condition == "above" and price >= target) or
                    (condition == "below" and price <= target)
                )

                # Always update current_price
                update_body: dict = {"current_price": round(price, 4)}

                if triggered:
                    update_body["status"]       = "triggered"
                    update_body["triggered_at"] = datetime.now(timezone.utc).isoformat()

                    # Fire trigger to Next.js (sends email + push)
                    try:
                        await client.post(
                            f"{FRONTEND_URL}/api/alerts/trigger",
                            json={
                                "alertId":      alert["id"],
                                "userId":       alert["user_id"],
                                "ticker":       ticker,
                                "condition":    condition,
                                "targetPrice":  target,
                                "currentPrice": round(price, 4),
                                "note":         alert.get("note", ""),
                            },
                            timeout=10,
                        )
                        print(f"[alerts] ✅ Triggered: {ticker} {condition} ${target} (current: ${price:.2f})")
                    except Exception as e:
                        print(f"[alerts] Failed to fire trigger for {ticker}: {e}")

                # Update alert in Supabase
                try:
                    await client.patch(
                        f"{SUPABASE_URL}/rest/v1/alerts?id=eq.{alert['id']}",
                        json=update_body,
                        headers={**headers, "Prefer": "return=minimal"},
                    )
                except Exception as e:
                    print(f"[alerts] Failed to update alert {alert['id']}: {e}")


async def alert_scheduler():
    """Background task — runs check_alerts every ALERT_INTERVAL seconds."""
    print(f"[alerts] Scheduler started — checking every {ALERT_INTERVAL}s")
    while True:
        try:
            await check_alerts()
        except Exception as e:
            print(f"[alerts] Scheduler error: {e}")
        await asyncio.sleep(ALERT_INTERVAL)


@app.on_event("startup")
async def startup_event():
    """Start the alert scheduler as a background task on server start."""
    asyncio.create_task(alert_scheduler())
    print("[startup] QuantDesk Pro API ready")


# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "QuantDesk Pro API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── MARKET DATA ───────────────────────────────────────────────────────────────
@app.get("/api/market/snapshot")
def market_snapshot():
    """Live market data for the dashboard strip."""
    specs = {
        "S&P 500":    "SPY",
        "NASDAQ 100": "QQQ",
        "VIX":        "^VIX",
        "Bitcoin":    "BTC-USD",
        "DXY":        "DX-Y.NYB",
        "10Y Yield":  "^TNX",
        "Gold":       "GC=F",
        "WTI Oil":    "CL=F",
    }
    results = []
    for label, ticker in specs.items():
        try:
            s = load_close_series(ticker, period="5d")
            if s is None or len(s) < 2:
                continue
            last  = float(s.iloc[-1])
            prev  = float(s.iloc[-2])
            chg   = (last / prev - 1) * 100
            hist  = [round(float(v), 4) for v in s.tail(7).values]

            if label == "10Y Yield":
                val = f"{last:.2f}%"
            elif last >= 10_000:
                val = f"{last:,.0f}"
            elif last >= 1_000:
                val = f"{last:,.2f}"
            else:
                val = f"{last:.2f}"

            results.append({
                "label":   label,
                "ticker":  ticker,
                "value":   val,
                "raw":     round(last, 4),
                "change":  round(chg, 3),
                "chgStr":  f"{'+'if chg>=0 else ''}{chg:.2f}%",
                "up":      chg >= 0,
                "history": hist,
            })
        except Exception:
            continue
    return {"data": results}


@app.get("/api/market/watchlist")
def market_watchlist(
    tickers: str = Query("AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,SPY")
):
    """Watchlist prices and changes."""
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    results = []
    for ticker in ticker_list:
        try:
            s = load_close_series(ticker, period="5d")
            if s is None or len(s) < 2:
                continue
            last = float(s.iloc[-1])
            prev = float(s.iloc[-2])
            chg  = (last / prev - 1) * 100
            results.append({
                "ticker": ticker,
                "price":  round(last, 2),
                "change": round(chg, 3),
                "up":     chg >= 0,
                "chgStr": f"{'+'if chg>=0 else ''}{chg:.2f}%",
            })
        except Exception:
            continue
    return {"data": results}


@app.get("/api/market/prices/{ticker}")
def get_prices(ticker: str, period: str = "1y"):
    """OHLCV price history for a ticker."""
    try:
        df = load_price_history(ticker.upper(), period=period)
        if df is None or df.empty:
            raise HTTPException(404, f"No data for {ticker}")

        records = []
        for idx, row in df.iterrows():
            record = {"date": str(idx)[:10]}
            for col in ["Open","High","Low","Close","Volume"]:
                if col in row:
                    v = row[col]
                    record[col.lower()] = round(float(v), 4) if not np.isnan(float(v)) else None
            records.append(record)

        return {"ticker": ticker.upper(), "period": period, "data": records}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ── PORTFOLIO ANALYTICS ───────────────────────────────────────────────────────
@app.get("/api/portfolio/analytics")
def portfolio_analytics(
    tickers:    str   = Query("AAPL,MSFT,NVDA,GOOGL,SPY"),
    shares:     str   = Query("20,15,10,25,50"),
    buy_prices: str   = Query("182,380,650,160,490"),
    period:     str   = Query("1y"),
    benchmark:  str   = Query("SPY"),
    risk_free:  float = Query(0.02),
):
    """Full portfolio analytics — performance, risk, attribution."""
    try:
        tkrs  = [t.strip().upper() for t in tickers.split(",")]
        sh    = np.array([float(x) for x in shares.split(",")])
        bp    = np.array([float(x) for x in buy_prices.split(",")])

        prices = pd.DataFrame()
        for t in tkrs:
            s = load_close_series(t, period=period)
            if s is None or s.empty:
                raise HTTPException(400, f"No data for {t}")
            prices[t] = s
        prices = prices.dropna()

        bench = load_close_series(benchmark, period=period)
        bench = pd.Series(bench).reindex(prices.index).ffill().dropna()

        latest   = prices.iloc[-1].values
        pos_val  = latest * sh
        cost     = bp * sh
        upnl     = pos_val - cost
        total_v  = pos_val.sum()
        total_c  = cost.sum()
        weights  = pos_val / total_v

        ret      = prices.pct_change().dropna()
        port_ret = ret.dot(weights)

        total_r  = float((1 + port_ret).prod() - 1)
        ann_r    = float(annualized_return(port_ret))
        ann_v    = float(annualized_vol(port_ret))
        rf       = risk_free
        sharpe   = safe((ann_r - rf) / ann_v if ann_v else None)
        max_dd, drawdown = max_drawdown_from_returns(port_ret)
        sortino  = safe(sortino_ratio(ann_r, rf, port_ret))
        calmar   = safe(calmar_ratio(ann_r, float(max_dd)))
        omega    = safe(omega_ratio(port_ret))
        gtp      = safe(gain_to_pain(port_ret))
        sk       = safe(return_skew(port_ret))
        kurt     = safe(return_kurtosis(port_ret))

        hist_v   = safe(historical_var(port_ret, 0.95))
        hist_cv  = safe(cvar(port_ret, hist_v or 0))
        param_v  = safe(parametric_var(port_ret, 0.95))

        bench_ret = bench.pct_change().dropna()
        alpha, beta, r2, aligned = compute_alpha_beta(port_ret, bench_ret)
        te, ir = tracking_stats(aligned) if aligned is not None else (None, None)

        asset_ret  = (prices.iloc[-1] / prices.iloc[0]) - 1
        norm_port  = (prices * sh).sum(axis=1)
        norm_port /= norm_port.iloc[0]
        norm_bench = bench / bench.iloc[0]

        return {
            "summary": {
                "totalValue":    round(float(total_v), 2),
                "totalCost":     round(float(total_c), 2),
                "unrealisedPnl": round(float(upnl.sum()), 2),
                "unrealisedPct": round(float(upnl.sum() / total_c), 6),
                "totalReturn":   round(total_r, 6),
                "annReturn":     round(ann_r, 6),
                "annVol":        round(ann_v, 6),
                "sharpe":        round(sharpe, 4) if sharpe else None,
                "sortino":       round(sortino, 4) if sortino else None,
                "calmar":        round(calmar, 4) if calmar else None,
                "maxDrawdown":   round(float(max_dd), 6),
                "omega":         round(omega, 4) if omega else None,
                "gainToPain":    round(gtp, 4) if gtp else None,
                "skewness":      round(sk, 4) if sk else None,
                "kurtosis":      round(kurt, 4) if kurt else None,
                "histVar95":     round(hist_v, 6) if hist_v else None,
                "histCVar95":    round(hist_cv, 6) if hist_cv else None,
                "paramVar95":    round(param_v, 6) if param_v else None,
                "alpha":         round(float(alpha), 6) if alpha else None,
                "beta":          round(float(beta), 4) if beta else None,
                "r2":            round(float(r2), 4) if r2 else None,
                "trackingError": round(float(te), 6) if te else None,
                "infoRatio":     round(float(ir), 4) if ir else None,
                "benchmark":     benchmark,
            },
            "holdings": [
                {
                    "ticker":        tkrs[i],
                    "shares":        float(sh[i]),
                    "buyPrice":      float(bp[i]),
                    "currentPrice":  round(float(latest[i]), 2),
                    "marketValue":   round(float(pos_val[i]), 2),
                    "cost":          round(float(cost[i]), 2),
                    "unrealisedPnl": round(float(upnl[i]), 2),
                    "unrealisedPct": round(float(upnl[i]/cost[i]), 6),
                    "weight":        round(float(weights[i]), 6),
                    "periodReturn":  round(float(asset_ret.iloc[i]), 6),
                }
                for i in range(len(tkrs))
            ],
            "charts": {
                "performance": series_to_chart(norm_port),
                "benchmark":   series_to_chart(norm_bench),
                "drawdown":    series_to_chart(drawdown),
                "returns":     series_to_chart(port_ret),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))


# ── TECHNICALS ────────────────────────────────────────────────────────────────
@app.get("/api/technicals/{ticker}")
def get_technicals(ticker: str, period: str = "1y"):
    try:
        df = load_price_history(ticker.upper(), period=period)
        if df is None or df.empty:
            raise HTTPException(404, f"No data for {ticker}")

        tc = df["Close"]
        sma20  = sma(tc, 20)
        sma50  = sma(tc, 50)
        ema20  = ema(tc, 20)
        rsi14  = rsi(tc, 14)
        macd_l, macd_s, macd_h = macd(tc)
        bb_mid, bb_up, bb_lo   = bollinger_bands(tc)
        rvol   = rolling_vol(tc.pct_change().dropna(), 20) * 100

        return {
            "ticker": ticker.upper(),
            "latest": {
                "close":   round(float(tc.iloc[-1]), 2),
                "rsi14":   round(float(rsi14.iloc[-1]), 2) if not rsi14.empty else None,
                "sma20":   round(float(sma20.iloc[-1]), 2) if not sma20.empty else None,
                "sma50":   round(float(sma50.iloc[-1]), 2) if not sma50.empty else None,
                "bbUpper": round(float(bb_up.iloc[-1]), 2) if not bb_up.empty else None,
                "bbLower": round(float(bb_lo.iloc[-1]), 2) if not bb_lo.empty else None,
                "macd":    round(float(macd_l.iloc[-1]), 4) if not macd_l.empty else None,
                "signal":  round(float(macd_s.iloc[-1]), 4) if not macd_s.empty else None,
                "rvol20":  round(float(rvol.iloc[-1]), 2) if not rvol.empty else None,
            },
            "charts": {
                "close":   series_to_chart(tc),
                "sma20":   series_to_chart(sma20),
                "sma50":   series_to_chart(sma50),
                "bbUpper": series_to_chart(bb_up),
                "bbLower": series_to_chart(bb_lo),
                "rsi":     series_to_chart(rsi14),
                "macd":    series_to_chart(macd_l),
                "signal":  series_to_chart(macd_s),
                "hist":    series_to_chart(macd_h),
                "rvol":    series_to_chart(rvol),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ── OPTIONS PRICING ───────────────────────────────────────────────────────────
@app.get("/api/options/price")
def price_option(
    S:           float = Query(...),
    K:           float = Query(...),
    T:           float = Query(...),
    r:           float = Query(0.05),
    sigma:       float = Query(0.25),
    option_type: str   = Query("call"),
):
    try:
        result = bs_price_only(S, K, T, r, sigma, option_type)
        return {"price": result, "inputs": {"S":S,"K":K,"T":T,"r":r,"sigma":sigma,"type":option_type}}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/options/iv")
def get_iv(
    market_price: float = Query(...),
    S:            float = Query(...),
    K:            float = Query(...),
    T:            float = Query(...),
    r:            float = Query(0.05),
    option_type:  str   = Query("call"),
):
    try:
        iv = implied_volatility_newton(market_price, S, K, T, r, option_type)
        return {"impliedVol": safe(iv)}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── SCREENER ──────────────────────────────────────────────────────────────────
@app.get("/api/screener")
def screener(
    tickers: str = Query("AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,JPM,V,JNJ"),
    period:  str = Query("3mo"),
):
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    results = []
    for ticker in ticker_list:
        try:
            df = load_price_history(ticker, period=period)
            if df is None or df.empty or "Close" not in df.columns:
                continue
            tc    = df["Close"]
            ret   = tc.pct_change().dropna()
            rsi14 = rsi(tc, 14)
            sma20_v = sma(tc, 20)
            sma50_v = sma(tc, 50)

            last_rsi   = float(rsi14.iloc[-1]) if not rsi14.empty else None
            last_close = float(tc.iloc[-1])
            last_sma20 = float(sma20_v.iloc[-1]) if not sma20_v.empty else None
            last_sma50 = float(sma50_v.iloc[-1]) if not sma50_v.empty else None
            period_ret = float((tc.iloc[-1] / tc.iloc[0] - 1))
            ann_v_val  = float(annualized_vol(ret))

            signals = []
            if last_rsi and last_rsi < 30: signals.append("Oversold")
            if last_rsi and last_rsi > 70: signals.append("Overbought")
            if last_close and last_sma20 and last_close > last_sma20: signals.append("Above SMA20")
            if last_close and last_sma50 and last_close > last_sma50: signals.append("Above SMA50")

            results.append({
                "ticker":       ticker,
                "price":        round(last_close, 2),
                "periodReturn": round(period_ret * 100, 2),
                "annVol":       round(ann_v_val * 100, 2),
                "rsi14":        round(last_rsi, 1) if last_rsi else None,
                "sma20":        round(last_sma20, 2) if last_sma20 else None,
                "sma50":        round(last_sma50, 2) if last_sma50 else None,
                "signals":      signals,
            })
        except Exception:
            continue
    return {"data": results, "count": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)