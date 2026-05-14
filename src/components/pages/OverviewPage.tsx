'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Beaker,
  ChevronRight,
  Flame,
  GitCompareArrows,
  Layers,
  Radar,
} from 'lucide-react';
import { Panel, PanelHeader, RiskChip, StatCard } from '@/components/ui';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { WalletRiskSnapshot } from '@/components/wallet/WalletRiskSnapshot';
import { RiskScoreBar } from '@/components/risk/RiskScoreBadge';
import { LiquidationsOverTime } from '@/components/charts/LiquidationsOverTime';
import { OracleSpread } from '@/components/charts/OracleSpread';
import { assessHealth } from '@/modules/health-factor';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { syntheticDivergence } from '@/modules/oracle';
import { generateLiquidations } from '@/modules/data-pipeline/liquidations';
import { computeRiskScore } from '@/lib/risk/risk-score';
import { formatPercent, formatUsd } from '@/utils';
import type { LiquidationEvent, OracleDivergence } from '@/types';

const FEATURE_CARDS = [
  {
    href: '/simulator',
    label: 'Monte Carlo Simulator',
    desc: 'Run 2,000+ GBM price paths against any position to surface liquidation probability and tail-risk metrics.',
    Icon: Activity,
  },
  {
    href: '/stress',
    label: 'Stress Lab',
    desc: 'Apply historical (Covid 2020, FTX, Luna) and hypothetical scenarios to your collateral mix.',
    Icon: Flame,
  },
  {
    href: '/compare',
    label: 'Protocol Compare',
    desc: 'Side-by-side LTV, liquidation threshold, bonus and conservatism across Aave V3, Compound, Morpho, Spark, Maker.',
    Icon: GitCompareArrows,
  },
  {
    href: '/oracle',
    label: 'Oracle Divergence',
    desc: 'Multi-feed spread monitor across Chainlink, Pyth, Uniswap TWAP, CoinGecko.',
    Icon: Radar,
  },
];

export function OverviewPage() {
  const positions = SAMPLE_POSITIONS;
  const snapshots = useMemo(() => positions.map((p) => ({ p, s: assessHealth(p) })), [positions]);

  const totals = useMemo(() => {
    let collateral = 0;
    let debt = 0;
    let weakest = snapshots[0];
    for (const row of snapshots) {
      collateral += row.s.collateralUsd;
      debt += row.s.debtUsd;
      if (row.s.healthFactor < weakest.s.healthFactor) weakest = row;
    }
    return {
      collateral,
      debt,
      blendedLtv: collateral > 0 ? debt / collateral : 0,
      weakest,
      atRiskCount: snapshots.filter((r) => r.s.healthFactor < 1.35).length,
    };
  }, [snapshots]);

  const [liquidations, setLiquidations] = useState<LiquidationEvent[]>([]);
  const [divergences, setDivergences] = useState<OracleDivergence[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [liqRes, oracleRes] = await Promise.all([
          fetch('/api/liquidations?count=80'),
          fetch('/api/oracle?assets=WETH,WBTC,wstETH,cbETH,ARB'),
        ]);
        if (cancelled) return;
        if (liqRes.ok) setLiquidations((await liqRes.json()).events);
        else setLiquidations(generateLiquidations(80));
        if (oracleRes.ok) setDivergences((await oracleRes.json()).divergences);
        else setDivergences(['WETH', 'WBTC', 'wstETH', 'cbETH', 'ARB'].map((a, i) => syntheticDivergence(a, i + 1)));
      } catch {
        if (!cancelled) {
          setLiquidations(generateLiquidations(80));
          setDivergences(['WETH', 'WBTC', 'wstETH', 'cbETH', 'ARB'].map((a, i) => syntheticDivergence(a, i + 1)));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const liqWeekVolume = useMemo(() => {
    const cutoff = now - 7 * 86_400_000;
    return liquidations.filter((e) => e.timestamp >= cutoff).reduce((s, e) => s + e.debtRepaidUsd, 0);
  }, [liquidations, now]);

  // Compute overall risk score
  const riskResult = useMemo(() => {
    return computeRiskScore({
      snapshot: totals.weakest?.s,
      divergences,
    });
  }, [totals.weakest, divergences]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Panel className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-violet-500/5 to-pink-500/10 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1">
              DeFi Lending Risk · Liquidation Intelligence
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight max-w-2xl">
              Stress-test every lending position with the same{' '}
              <span className="gradient-text">Monte Carlo math</span> liquidators use.
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] max-w-2xl mt-2 leading-relaxed">
              Crucible reconstructs the on-chain Health Factor formula for Aave V3, Compound V3,
              Morpho Blue, Spark, Maker and others — then runs Geometric Brownian Motion price
              paths, historical scenario shocks and rule-based recommendations against your
              collateral mix. Everything runs in your browser.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <DataSourceBadge source="DEMO" />
              <DataSourceBadge source="SYNTHETIC" />
              <span className="text-[10px] text-[var(--text-muted)]">Demo positions · Synthetic oracle model</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/positions" className="btn btn-primary">
              Browse positions <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/simulator" className="btn">
              Run simulator
            </Link>
          </div>
        </div>
      </Panel>

      {/* Wallet Risk Snapshot */}
      <WalletRiskSnapshot />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tracked Collateral" value={formatUsd(totals.collateral, { compact: true })} hint={`across ${positions.length} demo positions`} />
        <StatCard label="Outstanding Debt" value={formatUsd(totals.debt, { compact: true })} hint={`blended LTV ${formatPercent(totals.blendedLtv, 1)}`} tone="warning" />
        <StatCard label="At-Risk Positions" value={`${totals.atRiskCount} / ${positions.length}`} hint={`HF < 1.35 threshold`} tone={totals.atRiskCount > 0 ? 'negative' : 'positive'} />
        <StatCard label="7d Liquidations" value={formatUsd(liqWeekVolume, { compact: true })} hint={`${liquidations.length} events catalogued`} tone="accent" />
      </div>

      {/* Risk Score */}
      <Panel>
        <PanelHeader title="Portfolio Risk Overview" subtitle="Aggregated risk assessment across all demo positions." />
        <div className="max-w-md">
          <RiskScoreBar result={riskResult} />
        </div>
      </Panel>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_CARDS.map(({ href, label, desc, Icon }) => (
          <Link href={href} key={href} className="panel hover p-5 group">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold">{label}</div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Positions snapshot */}
      <Panel>
        <PanelHeader
          title="Demo positions"
          subtitle="Pre-loaded positions exercising each engine. Click any row to open the position detail."
          right={<Link href="/positions" className="btn btn-ghost h-8 text-[12px]">All positions <ChevronRight className="h-3.5 w-3.5" /></Link>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {snapshots.map(({ p, s }) => (
            <Link key={p.id} href={`/positions/${p.id}`} className="panel hover p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{p.label}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-0.5">{p.protocol} · {p.chain}</div>
                </div>
                <RiskChip tier={s.tier} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] mt-1">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">HF</div>
                  <div className="mono">{s.healthFactor.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Buffer</div>
                  <div className="mono">{formatPercent(s.liquidationBuffer, 1)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Debt</div>
                  <div className="mono">{formatUsd(s.debtUsd, { compact: true })}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Liquidation volume (14d)" subtitle="Aggregate debt repaid across Aave, Compound, Morpho, Spark, Maker." />
          <LiquidationsOverTime events={liquidations} />
        </Panel>
        <Panel>
          <PanelHeader title="Oracle spread snapshot" subtitle="Maximum spread (bps) between Chainlink, Pyth, Uniswap V3 TWAP and CoinGecko." />
          <OracleSpread divergences={divergences} />
        </Panel>
      </div>

      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="flex items-start gap-3">
          <Beaker className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
          <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Crucible is an analytics-only tool. It does not hold custody, route trades or submit
            transactions. All numbers are derived from public on-chain risk parameters and free
            data sources. See the{' '}
            <Link href="/about" className="text-[var(--accent)] hover:underline">methodology page</Link>{' '}
            for formulas, assumptions, and known limitations.
          </div>
        </div>
      </Panel>
    </div>
  );
}

const _icons = { Layers };
void _icons;
