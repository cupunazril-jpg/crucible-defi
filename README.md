# Crucible

> A deterministic, client-side risk & liquidation intelligence platform for DeFi
> lending positions. Crucible mirrors the credit math of Aave V3, Compound V3,
> Morpho Blue, Spark and MakerDAO, then layers Monte Carlo simulation, historical
> stress scenarios, oracle divergence analysis, and rule-based recommendations
> on top.

![status](https://img.shields.io/badge/status-prototype-blue) ![license](https://img.shields.io/badge/license-MIT-green) ![next](https://img.shields.io/badge/next-16-black) ![react](https://img.shields.io/badge/react-19-blue)

## Why

Most DeFi dashboards show you balances. Crucible answers the real questions:

- **Am I about to get liquidated?** — Live Health Factor, liquidation price,
  buffer, and risk tier.
- **What does an X% drawdown do?** — Continuous what-if sliders + 9 named
  stress scenarios (Covid 2020, Luna, FTX, USDC depeg, oracle glitch…).
- **How fragile is this in stochastic terms?** — Up to 20k Monte Carlo
  paths under Geometric Brownian Motion with configurable drift and volatility.
- **What can I do about it?** — Ranked, actionable recommendations to lift
  the HF back into a safe band.
- **Where is the oracle stack vulnerable?** — Live spread between Chainlink,
  Pyth, Uniswap TWAP and CoinGecko, classified by tier.
- **Should I migrate?** — Cross-protocol radar comparing LTV, LT, bonus,
  conservatism and maturity.

## Feature surface

| Page | Highlights |
|---|---|
| `/` Overview | KPI strip, live liquidation feed, oracle spread, weakest position |
| `/positions` | Sortable / filterable list of all demo positions |
| `/positions/[id]` | Health Factor gauge, what-if sliders, Monte Carlo cone, stress table, recs |
| `/portfolio` | Cross-position aggregation, concentration risk, scenario sweep |
| `/simulator` | Dedicated Monte Carlo workspace with paths, horizon, drift, vol controls |
| `/stress` | Apply any of 9 named scenarios to a single position |
| `/compare` | Protocol radar + per-asset matrix across 5+ lending markets |
| `/oracle` | Synthetic 4-source divergence monitor with tier thresholds |
| `/strategy` | Ranked, prioritised list of actions to lift HF |
| `/liquidations` | Liquidation event feed with timeline, top protocols, top assets |
| `/watchlist` | Local-storage pinned positions |
| `/about` | Methodology, formulas, limitations, references |

## Architecture

All computations run in the browser — there are no Crucible servers.
The only network calls are to free public APIs (CoinGecko, DefiLlama) via
your own client; no cookies, no analytics, no wallet connection.

```
src/
  modules/
    health-factor/      # core HF, LTV, buffer, liquidation-price math
    monte-carlo/        # GBM paths with seedable RNG
    stress-test/        # 9 named scenarios incl. Covid, Luna, FTX
    recommendation/     # repay / add-collateral / migrate / hedge / reduce-leverage
    explanation/        # deterministic natural-language layer
    protocol-params/    # 30+ asset rows across Aave, Compound, Morpho, Spark, Maker
    data-pipeline/      # CoinGecko + DefiLlama wrappers; sample positions
    oracle/             # 4-source synthetic divergence model
  app/
    api/                # route handlers (prices, positions, simulate, stress, oracle, liquidations, protocols)
    <pages>/            # one folder per feature surface
  components/
    charts/             # PriceCone, Histogram, HFGauge, HealthCurve, ProtocolRadar, StressBars, OracleSpread, LiquidationsOverTime
    layout/             # AppShell, Sidebar, Header
    pages/              # one .tsx per page (heavy components)
    ui/                 # Panel, StatCard, RiskChip, Table, Tabs, ExplanationBlock
```

## Core formulas

```
HF             = Σ(collateral_i × LT_i) / Σ(debt_j)
LTV            = Σ(debt_j) / Σ(collateral_i × price_i)
buffer         = 1 - debt / (collateral × dominantLT)
GBM step       = S_{t+dt} = S_t × exp((μ - σ²/2)·dt + σ·√dt·Z), Z ~ N(0,1)
P_liq          = |{ paths : min_{t≤T} HF(t) < 1 }| / N_paths
VaR (95%)      = 1 - quantile_{0.05}(P_T / P_0)
CVaR (95%)     = mean of paths below VaR
spread_bps     = (max(quotes) - min(quotes)) / median(quotes) × 10000
```

## Stack

- **Next.js 16** — App Router, route handlers, server components
- **React 19** — strict purity rules, suspense
- **TypeScript 5** — strict mode end-to-end
- **Tailwind CSS v4** — CSS variables, dark theme
- **Recharts** — all charts (area, bar, radar, pie, line)
- **Lucide** — icon library

## Quickstart

```bash
npm install
npm run dev          # localhost:3000
npm run build        # production build
npm run lint         # eslint with react 19 rules
```

## Known limitations

- Sample positions are static. The on-chain layer is not wired — plug your own
  positions in by editing `src/modules/data-pipeline/positions.ts`.
- GBM is a simplification. Real markets exhibit jumps, vol clustering, and
  reflexive liquidation cascades that the model ignores. Use the scenarios for
  tail risk.
- Liquidation events on the feed page are synthetic but plausibly distributed.
  We deliberately do not call paid liquidation APIs to keep the demo keyless.
- Oracle divergences are synthetic — values calibrated against historical
  mispricings, not real-time feed reads.

## License

MIT — see `LICENSE`.
