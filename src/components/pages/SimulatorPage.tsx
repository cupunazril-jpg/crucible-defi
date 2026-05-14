'use client';

import { useMemo, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import {
  ExplanationBlock,
  Panel,
  PanelHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { PriceCone } from '@/components/charts/PriceCone';
import { Histogram } from '@/components/charts/Histogram';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { runMonteCarlo } from '@/modules/monte-carlo';
import { assessHealth, dominantCollateral } from '@/modules/health-factor';
import { explainMonteCarlo } from '@/modules/explanation';
import { formatPercent, formatUsd } from '@/utils';
import type { MonteCarloResult } from '@/types';

const PRESET_PRESETS = [
  { label: 'Quick (1k paths · 30d)', paths: 1000, horizonDays: 30 },
  { label: 'Standard (2k paths · 60d)', paths: 2000, horizonDays: 60 },
  { label: 'Deep (4k paths · 90d)', paths: 4000, horizonDays: 90 },
  { label: 'Quarter (5k paths · 180d)', paths: 5000, horizonDays: 180 },
];

export function SimulatorPage() {
  const [positionId, setPositionId] = useState(SAMPLE_POSITIONS[0].id);
  const [paths, setPaths] = useState(2000);
  const [horizonDays, setHorizonDays] = useState(60);
  const [driftOverride, setDriftOverride] = useState<string>('');
  const [volOverride, setVolOverride] = useState<string>('');
  const [running, setRunning] = useState(false);

  const position = useMemo(
    () => SAMPLE_POSITIONS.find((p) => p.id === positionId) ?? SAMPLE_POSITIONS[0],
    [positionId],
  );
  const snap = useMemo(() => assessHealth(position), [position]);
  const dominant = useMemo(() => dominantCollateral(position), [position]);

  const [result, setResult] = useState<MonteCarloResult>(() =>
    runMonteCarlo(
      {
        position,
        paths,
        horizonDays,
      },
      { seed: 42 },
    ),
  );

  const run = async (seedOverride?: number) => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 30));
    const next = runMonteCarlo(
      {
        position,
        paths,
        horizonDays,
        drift: driftOverride ? Number(driftOverride) / 100 : undefined,
        volatility: volOverride ? Number(volOverride) / 100 : undefined,
      },
      { seed: seedOverride ?? (Date.now() & 0xffffff) },
    );
    setResult(next);
    setRunning(false);
  };

  const explanation = explainMonteCarlo(result, horizonDays);
  const daysToLiqMedian =
    result.daysToLiquidation.length > 0
      ? [...result.daysToLiquidation].sort((a, b) => a - b)[
          Math.floor(result.daysToLiquidation.length / 2)
        ]
      : null;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Monte Carlo Liquidation Simulator"
          subtitle="GBM price paths over the dominant collateral asset. HF is recomputed each day; we record the first day each path liquidates (HF<1)."
          right={
            <button
              onClick={() => run()}
              disabled={running}
              className="btn btn-primary h-9 text-[12px]"
            >
              {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {running ? 'simulating…' : 'run simulation'}
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Position picker */}
          <div className="space-y-3">
            <div>
              <label className="section-heading">Position</label>
              <select
                className="input mt-1"
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
              >
                {SAMPLE_POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] mono">
              <div className="panel p-3">
                <div className="section-heading">HF</div>
                <div className="text-[15px]">{snap.healthFactor.toFixed(2)}</div>
              </div>
              <div className="panel p-3">
                <div className="section-heading">Buffer</div>
                <div className="text-[15px]">{formatPercent(snap.liquidationBuffer, 1)}</div>
              </div>
              <div className="panel p-3">
                <div className="section-heading">Collateral</div>
                <div className="text-[15px]">{formatUsd(snap.collateralUsd, { compact: true })}</div>
              </div>
              <div className="panel p-3">
                <div className="section-heading">Debt</div>
                <div className="text-[15px]">{formatUsd(snap.debtUsd, { compact: true })}</div>
              </div>
            </div>
          </div>

          {/* Engine controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-heading">Paths</label>
                <input
                  className="input mt-1"
                  type="number"
                  min={200}
                  max={20000}
                  step={100}
                  value={paths}
                  onChange={(e) => setPaths(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="section-heading">Horizon (days)</label>
                <input
                  className="input mt-1"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="section-heading">Drift (%/yr)</label>
                <input
                  className="input mt-1"
                  type="number"
                  step={0.5}
                  placeholder={dominant ? `auto (${(driftDefault(dominant.asset) * 100).toFixed(1)}%)` : 'auto'}
                  value={driftOverride}
                  onChange={(e) => setDriftOverride(e.target.value)}
                />
              </div>
              <div>
                <label className="section-heading">Volatility (%/yr)</label>
                <input
                  className="input mt-1"
                  type="number"
                  step={1}
                  placeholder={dominant ? `auto (${(dominant.volatility * 100).toFixed(0)}%)` : 'auto'}
                  value={volOverride}
                  onChange={(e) => setVolOverride(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="btn h-7 text-[11px]"
                  onClick={() => {
                    setPaths(p.paths);
                    setHorizonDays(p.horizonDays);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Liquidation Prob"
          value={formatPercent(result.liquidationProbability, 2)}
          tone={result.liquidationProbability > 0.25 ? 'negative' : 'accent'}
          hint={`P( min HF_t < 1 ) over ${horizonDays}d`}
        />
        <StatCard
          label="Insolvency Prob"
          value={formatPercent(result.insolvencyProbability, 2)}
          tone="warning"
          hint="HF dips below 0.95"
        />
        <StatCard label="VaR (95%)" value={formatPercent(result.var95, 1)} hint="5% tail loss" />
        <StatCard
          label="CVaR (95%)"
          value={formatPercent(result.cvar95, 1)}
          hint="Mean loss in worst 5% of paths"
        />
      </div>

      <Panel>
        <PanelHeader
          title="Price cone"
          subtitle="5 / 50 / 95 percentile collateral price paths plus the liquidation threshold."
        />
        <PriceCone
          p5={result.p5Path}
          median={result.medianPath}
          p95={result.p95Path}
          liquidationPrice={snap.liquidationPriceUsd}
        />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader
            title="Final-day price distribution"
            subtitle="Histogram of terminal collateral prices across paths."
          />
          <Histogram data={result.histogram} liquidationPrice={snap.liquidationPriceUsd} />
        </Panel>

        <Panel>
          <PanelHeader
            title="Days-to-liquidation"
            subtitle={
              daysToLiqMedian
                ? `Median ${daysToLiqMedian}d · ${result.daysToLiquidation.length} of ${paths} paths triggered liquidation`
                : 'No paths liquidated within horizon.'
            }
          />
          <DTLHistogram days={result.daysToLiquidation} horizon={horizonDays} />
        </Panel>
      </div>

      <ExplanationBlock
        headline={explanation.headline}
        bullets={explanation.bullets}
        tone={result.liquidationProbability > 0.25 ? 'danger' : 'accent'}
      />

      <Panel>
        <PanelHeader title="Run log" subtitle="Recent simulation summary stats." />
        <Table>
          <thead>
            <tr>
              <Th>Position</Th>
              <Th align="right">Paths</Th>
              <Th align="right">Horizon</Th>
              <Th align="right">Liq P</Th>
              <Th align="right">VaR</Th>
              <Th align="right">CVaR</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>{position.label}</Td>
              <Td align="right">{paths.toLocaleString()}</Td>
              <Td align="right">{horizonDays}d</Td>
              <Td align="right">{formatPercent(result.liquidationProbability, 2)}</Td>
              <Td align="right">{formatPercent(result.var95, 1)}</Td>
              <Td align="right">{formatPercent(result.cvar95, 1)}</Td>
            </tr>
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}

function driftDefault(asset: string): number {
  switch (asset.toUpperCase()) {
    case 'WETH':
    case 'ETH':
      return 0.1;
    case 'WBTC':
    case 'BTC':
      return 0.08;
    case 'WSTETH':
    case 'CBETH':
      return 0.09;
    case 'ARB':
      return 0.02;
    default:
      return 0.04;
  }
}

function DTLHistogram({ days, horizon }: { days: number[]; horizon: number }) {
  const buckets = 20;
  const step = Math.max(1, Math.ceil(horizon / buckets));
  const bins: { x: string; count: number }[] = [];
  for (let i = 0; i < buckets; i++) {
    bins.push({ x: `${i * step + 1}-${(i + 1) * step}d`, count: 0 });
  }
  for (const d of days) {
    const idx = Math.min(buckets - 1, Math.floor((d - 1) / step));
    bins[idx].count += 1;
  }
  return (
    <div className="grid grid-cols-10 gap-0.5 mt-3 mono">
      {bins.map((b, i) => {
        const max = Math.max(1, ...bins.map((x) => x.count));
        const h = (b.count / max) * 120;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex items-end" style={{ height: 120 }}>
              <div
                title={`${b.x}: ${b.count}`}
                className="w-full bg-[var(--accent)]/40 rounded-sm"
                style={{ height: `${Math.max(2, h)}px`, width: 16 }}
              />
            </div>
            <div className="text-[8px] text-[var(--text-muted)] -rotate-30">
              {i % 2 === 0 ? b.x : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
