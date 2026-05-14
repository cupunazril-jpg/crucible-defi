'use client';

import Link from 'next/link';
import {
  BookOpen,
  Code2,
  ExternalLink,
  GraduationCap,
  ScrollText,
  ShieldCheck,
  Sigma,
} from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui';

const FORMULAS: { title: string; body: string }[] = [
  {
    title: 'Health Factor',
    body: `HF = Σ(collateral_i × LT_i) / Σ(debt_j)`,
  },
  {
    title: 'Loan-to-Value',
    body: `LTV = Σ(debt_j) / Σ(collateral_i × price_i)`,
  },
  {
    title: 'Liquidation buffer',
    body: `buffer = 1 - debt / (collateral × dominantLT)`,
  },
  {
    title: 'GBM price path',
    body: `S_{t+dt} = S_t × exp((μ - σ²/2)·dt + σ·√dt·Z), Z ~ N(0,1)`,
  },
  {
    title: 'Liquidation probability',
    body: `P_liq = |{ paths : min_{1≤t≤T} HF(t) < 1 }| / N_paths`,
  },
  {
    title: 'VaR / CVaR (95%)',
    body: `VaR = 1 - quantile_{0.05}(P_T / P_0),   CVaR = mean of paths below VaR threshold`,
  },
  {
    title: 'Spread (oracle)',
    body: `spread_bps = (max(quotes) - min(quotes)) / median(quotes) × 10000`,
  },
];

const REFERENCES = [
  {
    title: 'Aave V3 Risk Parameters',
    href: 'https://docs.aave.com/risk/',
  },
  {
    title: 'Compound V3 Audit & Docs',
    href: 'https://docs.compound.finance/',
  },
  {
    title: 'Morpho Blue documentation',
    href: 'https://docs.morpho.org/',
  },
  {
    title: 'Spark Protocol docs',
    href: 'https://docs.spark.fi/',
  },
  {
    title: 'MakerDAO whitepaper',
    href: 'https://makerdao.com/en/whitepaper',
  },
  {
    title: 'Geometric Brownian Motion — Wikipedia',
    href: 'https://en.wikipedia.org/wiki/Geometric_Brownian_motion',
  },
  {
    title: 'Chainlink price feeds',
    href: 'https://data.chain.link/',
  },
  {
    title: 'DefiLlama TVL data',
    href: 'https://defillama.com/docs/api',
  },
];

const STACK = [
  ['Next.js 16', 'App Router, route handlers, server components'],
  ['TypeScript 5', 'strict mode, generic risk models'],
  ['Tailwind CSS v4', 'CSS variables, dark theme'],
  ['Recharts', 'all charts (radar, area, bar, line)'],
  ['Lucide icons', 'consistent iconography'],
];

export function AboutPage() {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
              Methodology · v1.0
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              How Crucible computes risk.
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] max-w-3xl mt-2 leading-relaxed">
              Crucible is a deterministic, client-side analytics engine for DeFi lending
              positions. It mirrors the credit math used by Aave V3, Compound V3, Morpho Blue,
              Spark and MakerDAO, then layers Monte Carlo simulation, historical scenarios and
              rule-based recommendations on top. Every number you see was derived from the
              formulas below — there are no hidden API calls or model outputs. You can re-derive
              every result by feeding the same inputs into the open-source code.
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Link href="/positions" className="btn btn-primary">
                Browse positions
              </Link>
              <Link href="/simulator" className="btn">
                Open simulator
              </Link>
              <a
                href="https://github.com/cupunazril-jpg/crucible"
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                <Code2 className="h-4 w-4" /> source code
              </a>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-2 w-72">
            <div className="panel p-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Lines of code
              </div>
              <div className="text-[20px] font-semibold mono">~7,500</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                TypeScript + TSX, no Solidity
              </div>
            </div>
            <div className="panel p-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Modules
              </div>
              <div className="mono text-[12px] space-y-0.5">
                <div>health-factor</div>
                <div>monte-carlo</div>
                <div>stress-test</div>
                <div>recommendation</div>
                <div>explanation</div>
                <div>protocol-params</div>
                <div>data-pipeline · oracle</div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Core formulas"
          subtitle="Open the source files for the full implementations with edge cases handled."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FORMULAS.map((f) => (
            <div key={f.title} className="panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sigma className="h-3.5 w-3.5 text-[var(--accent)]" />
                <div className="text-[13px] font-semibold">{f.title}</div>
              </div>
              <code className="mono text-[12px] block bg-[var(--bg-card)] p-3 rounded-md leading-relaxed text-[var(--text-secondary)]">
                {f.body}
              </code>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Architecture" subtitle="Module-by-module overview." />
        <div className="space-y-3 text-[12px] text-[var(--text-secondary)] leading-relaxed">
          <div>
            <div className="text-[13px] text-[var(--text-primary)] font-semibold mb-1">
              health-factor
            </div>
            Implements the core credit math. <code className="mono">assessHealth(position)</code>{' '}
            returns a HealthSnapshot with HF, LTV, liquidation buffer, dominant-asset liquidation
            price and tier. Helper{' '}
            <code className="mono">buildHealthCurve(position, range, steps)</code> sweeps the
            dominant collateral price between -range% and +range% to produce the curve shown on
            position detail pages.
          </div>
          <div>
            <div className="text-[13px] text-[var(--text-primary)] font-semibold mb-1">
              monte-carlo
            </div>
            Runs Geometric Brownian Motion paths for the dominant collateral asset using a
            seedable PRNG (mulberry32 + Box–Muller). For each path it walks the price day-by-day
            and recomputes the Health Factor. Outputs include liquidation probability, VaR/CVaR,
            p5/median/p95 cones, a 50-bin terminal-price histogram and a days-to-liquidation
            distribution.
          </div>
          <div>
            <div className="text-[13px] text-[var(--text-primary)] font-semibold mb-1">
              stress-test
            </div>
            Applies named scenarios — Covid 2020, Luna collapse, FTX, USDC depeg, LST depeg,
            oracle glitch and others — by multiplying the dominant collateral price by a fixed
            multiplier. Reports HF before/after, collateral loss and whether liquidation would
            have triggered.
          </div>
          <div>
            <div className="text-[13px] text-[var(--text-primary)] font-semibold mb-1">
              recommendation
            </div>
            Rule engine that converts a HealthSnapshot into ranked, actionable suggestions:
            repay, add-collateral, migrate, reduce-leverage, hedge. Sorted by priority and
            expected HF improvement.
          </div>
          <div>
            <div className="text-[13px] text-[var(--text-primary)] font-semibold mb-1">
              explanation
            </div>
            Deterministic natural-language layer over the snapshots: produces a short headline
            and a bulleted breakdown for any HealthSnapshot or MonteCarloResult.
          </div>
          <div>
            <div className="text-[13px] text-[var(--text-primary)] font-semibold mb-1">
              data-pipeline + oracle
            </div>
            Public free APIs (CoinGecko, DefiLlama) for prices and TVL, with safe local
            fallbacks. The oracle module generates a synthetic 4-source divergence model
            (Chainlink, Pyth, Uniswap V3 TWAP, CoinGecko) calibrated on real-world spreads.
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Stack" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STACK.map(([name, note]) => (
            <div key={name} className="panel p-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                <div className="text-[13px] font-semibold">{name}</div>
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">{note}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Known limitations"
          subtitle="Honesty about what this app does and does not do."
        />
        <ul className="space-y-2 text-[12px] text-[var(--text-secondary)] leading-relaxed list-disc pl-5">
          <li>
            Sample positions are static. We do not fetch on-chain account state — you can plug
            real positions in by editing{' '}
            <code className="mono">src/modules/data-pipeline/positions.ts</code>.
          </li>
          <li>
            GBM is a simplification. Real markets exhibit jumps, vol clustering and feedback
            loops that the model ignores. Use scenarios for tail risk.
          </li>
          <li>
            Liquidation events on the feed page are synthetic but plausible. We deliberately
            avoid calling paid liquidation APIs to keep the demo keyless.
          </li>
          <li>
            Oracle divergences are synthetic. The thresholds are calibrated to historical
            mis-pricings but the live values are not real-time feed reads.
          </li>
          <li>
            Recommendation amounts are advisory. Always validate against the live position state
            before executing on-chain.
          </li>
        </ul>
      </Panel>

      <Panel>
        <PanelHeader title="References" />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
          {REFERENCES.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="panel p-3 flex items-center justify-between hover:border-[var(--accent)]/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span>{r.title}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
              </a>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-[var(--green)] mt-0.5" />
          <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Privacy:</strong> Crucible runs
            entirely in your browser. The only network calls are to CoinGecko (prices) and
            DefiLlama (TVL) via your own client; nothing is sent to a Crucible server. No
            cookies, no analytics, no wallet connection.
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Acknowledgements" />
        <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed space-y-2">
          <div>
            <GraduationCap className="h-3.5 w-3.5 inline-block mr-2 text-[var(--accent)]" />
            Risk-parameter values cross-referenced against the Aave V3, Compound V3, Morpho
            Blue, Spark and MakerDAO documentation snapshots as of build time.
          </div>
          <div>
            <ScrollText className="h-3.5 w-3.5 inline-block mr-2 text-[var(--accent)]" />
            Liquidator economics modelled after Gauntlet & Risk DAO whitepapers; thresholds in
            line with their reported safety margins.
          </div>
        </div>
      </Panel>
    </div>
  );
}
