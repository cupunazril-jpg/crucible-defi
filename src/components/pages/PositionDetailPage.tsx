'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, RefreshCw } from 'lucide-react';
import {
  ExplanationBlock,
  Panel,
  PanelHeader,
  RiskChip,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { HFGauge } from '@/components/charts/HFGauge';
import { HealthCurve } from '@/components/charts/HealthCurve';
import { PriceCone } from '@/components/charts/PriceCone';
import { findSample } from '@/modules/data-pipeline/positions';
import {
  assessHealth,
  buildHealthCurve,
  dominantCollateral,
  healthAtPriceDelta,
} from '@/modules/health-factor';
import { runMonteCarlo } from '@/modules/monte-carlo';
import { generateRecommendations } from '@/modules/recommendation';
import { explainMonteCarlo, explainSnapshot } from '@/modules/explanation';
import { paramFor } from '@/modules/protocol-params';
import { applyAllScenarios } from '@/modules/stress-test';
import { formatPercent, formatUsd, formatRelativeTime, cn } from '@/utils';
import type { LendingPosition, RiskTier } from '@/types';

const TIER_TONE: Record<RiskTier, 'positive' | 'accent' | 'warning' | 'negative'> = {
  Safe: 'positive',
  Caution: 'accent',
  Elevated: 'warning',
  Critical: 'negative',
  Imminent: 'negative',
};

export function PositionDetailPage({ positionId }: { positionId: string }) {
  const sample = findSample(positionId);
  const router = useRouter();

  if (!sample) {
    return (
      <Panel>
        <PanelHeader title="Position not found" />
        <div className="text-[13px] text-[var(--text-secondary)] mb-3">
          That position id is not in the demo catalog.
        </div>
        <button className="btn" onClick={() => router.push('/positions')}>
          Back to positions
        </button>
      </Panel>
    );
  }

  return <PositionDetailInner basePosition={sample} />;
}

function PositionDetailInner({ basePosition }: { basePosition: LendingPosition }) {
  const router = useRouter();
  const [position] = useState<LendingPosition>(basePosition);
  const [priceDelta, setPriceDelta] = useState(0);
  const [repayAmount, setRepayAmount] = useState(0);

  const snap = useMemo(() => assessHealth(position), [position]);
  const explanation = useMemo(() => explainSnapshot(position, snap), [position, snap]);
  const recs = useMemo(() => generateRecommendations(position), [position]);
  const healthCurve = useMemo(() => buildHealthCurve(position, 0.6, 41), [position]);
  const stress = useMemo(() => applyAllScenarios(position), [position]);

  const adjusted = useMemo(() => {
    const next: LendingPosition = {
      ...position,
      debt: position.debt.map((d, i) =>
        i === 0
          ? {
              ...d,
              amount: Math.max(0, d.amount - repayAmount / Math.max(1e-9, d.priceUsd)),
            }
          : d,
      ),
    };
    return {
      position: next,
      snap: healthAtPriceDelta(next, priceDelta),
    };
  }, [position, priceDelta, repayAmount]);

  const [mc, setMC] = useState(() =>
    runMonteCarlo(
      { position, paths: 800, horizonDays: 30 },
      { seed: 12345 },
    ),
  );
  const [mcRunning, setMcRunning] = useState(false);

  const runFreshMC = async () => {
    setMcRunning(true);
    await new Promise((r) => setTimeout(r, 50));
    setMC(runMonteCarlo({ position, paths: 1500, horizonDays: 30 }, { seed: Date.now() & 0xffffff }));
    setMcRunning(false);
  };

  const dominant = dominantCollateral(position);
  const params = dominant ? paramFor(position.protocol, dominant.asset) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => router.back()} className="btn btn-ghost h-8 text-[12px]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="text-[11px] text-[var(--text-muted)] mono">
          updated {formatRelativeTime(position.updatedAt)}
        </div>
      </div>

      <Panel>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
              {position.protocol} · {position.chain}
            </div>
            <div className="text-2xl font-semibold tracking-tight">{position.label}</div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-1">
              {position.collateral.map((c) => `${c.amount.toLocaleString()} ${c.asset}`).join(' + ')} collateral against{' '}
              {position.debt.map((d) => `${d.amount.toLocaleString()} ${d.asset}`).join(' + ')} debt.
            </div>
            <div className="flex items-center gap-2 mt-3">
              <RiskChip tier={snap.tier} />
              {params ? (
                <span className="chip">
                  LT {formatPercent(params.liquidationThreshold, 1)}
                </span>
              ) : null}
              {params ? (
                <span className="chip">
                  LB {formatPercent(params.liquidationBonus, 1)}
                </span>
              ) : null}
            </div>
          </div>

          <HFGauge hf={snap.healthFactor} tier={snap.tier} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Collateral"
          value={formatUsd(snap.collateralUsd, { compact: true })}
          hint={`${position.collateral.length} leg(s)`}
        />
        <StatCard
          label="Debt"
          value={formatUsd(snap.debtUsd, { compact: true })}
          hint={`LTV ${formatPercent(snap.ltv, 1)}`}
          tone="warning"
        />
        <StatCard
          label="Liq Buffer"
          value={formatPercent(snap.liquidationBuffer, 1)}
          hint={`HF -> 1 if collateral drops by this much`}
          tone={TIER_TONE[snap.tier]}
        />
        <StatCard
          label={`${dominant?.asset ?? 'Collateral'} Liq Price`}
          value={snap.liquidationPriceUsd ? formatUsd(snap.liquidationPriceUsd) : '—'}
          hint={dominant ? `spot ${formatUsd(dominant.priceUsd)}` : ''}
          tone="negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Health curve"
            subtitle="Health Factor as the dominant collateral price moves between -60% and +60%."
          />
          <HealthCurve data={healthCurve} />
        </Panel>

        <Panel>
          <PanelHeader title="Position legs" />
          <div className="space-y-3 text-[12px]">
            <div>
              <div className="section-heading mb-1">Collateral</div>
              <ul className="space-y-1.5 mono">
                {position.collateral.map((c) => (
                  <li key={c.asset} className="flex justify-between">
                    <span>
                      {c.amount.toLocaleString()} {c.asset}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {formatUsd(c.amount * c.priceUsd, { compact: true })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="section-heading mb-1">Debt</div>
              <ul className="space-y-1.5 mono">
                {position.debt.map((d) => (
                  <li key={d.asset} className="flex justify-between">
                    <span>
                      {d.amount.toLocaleString()} {d.asset}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {formatUsd(d.amount * d.priceUsd, { compact: true })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      <ExplanationBlock
        headline={explanation.headline}
        bullets={explanation.bullets}
        tone={snap.healthFactor < 1.15 ? 'danger' : snap.healthFactor < 1.5 ? 'warning' : 'accent'}
      />

      <Panel>
        <PanelHeader
          title="What-if simulator"
          subtitle="Move sliders to see how the Health Factor responds. Math is recomputed instantly."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
              <span>{dominant?.asset ?? 'collateral'} price delta</span>
              <span className="mono">{(priceDelta * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={-0.6}
              max={0.6}
              step={0.01}
              value={priceDelta}
              onChange={(e) => setPriceDelta(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 mono">
              <span>-60%</span>
              <span>0</span>
              <span>+60%</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
              <span>Debt repaid (USD)</span>
              <span className="mono">{formatUsd(repayAmount, { compact: true })}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1, snap.debtUsd)}
              step={Math.max(1, Math.floor(snap.debtUsd / 100))}
              value={repayAmount}
              onChange={(e) => setRepayAmount(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 mono">
              <span>0</span>
              <span>{formatUsd(snap.debtUsd / 2, { compact: true })}</span>
              <span>{formatUsd(snap.debtUsd, { compact: true })}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="HF after"
            value={adjusted.snap.healthFactor.toFixed(2)}
            tone={TIER_TONE[adjusted.snap.tier]}
          />
          <StatCard label="Buffer after" value={formatPercent(adjusted.snap.liquidationBuffer, 1)} />
          <StatCard
            label="Collateral USD"
            value={formatUsd(adjusted.snap.collateralUsd, { compact: true })}
          />
          <StatCard
            label="Debt USD"
            value={formatUsd(adjusted.snap.debtUsd, { compact: true })}
            tone="warning"
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="30-day Monte Carlo cone"
          subtitle={`${mc.medianPath.length - 1} day horizon · ${(mc.liquidationProbability * 100).toFixed(1)}% liquidation probability across simulated paths.`}
          right={
            <button onClick={runFreshMC} disabled={mcRunning} className="btn btn-primary h-8 text-[12px]">
              {mcRunning ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {mcRunning ? 'running…' : 'rerun (1.5k paths)'}
            </button>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <StatCard
            label="Liquidation P"
            value={formatPercent(mc.liquidationProbability, 1)}
            tone={mc.liquidationProbability > 0.2 ? 'negative' : 'accent'}
          />
          <StatCard label="VaR (95%)" value={formatPercent(mc.var95, 1)} tone="warning" />
          <StatCard label="CVaR (95%)" value={formatPercent(mc.cvar95, 1)} tone="warning" />
        </div>
        <PriceCone
          p5={mc.p5Path}
          median={mc.medianPath}
          p95={mc.p95Path}
          liquidationPrice={snap.liquidationPriceUsd}
        />
        <div className="mt-4">
          <ExplanationBlock
            headline={explainMonteCarlo(mc, mc.medianPath.length - 1).headline}
            bullets={explainMonteCarlo(mc, mc.medianPath.length - 1).bullets}
            tone={mc.liquidationProbability > 0.2 ? 'danger' : 'accent'}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Stress scenario summary"
          subtitle="HF under each canonical historical/hypothetical shock applied to the dominant collateral."
        />
        <Table>
          <thead>
            <tr>
              <Th>Scenario</Th>
              <Th align="right">HF After</Th>
              <Th align="right">Buffer After</Th>
              <Th align="right">Collateral Loss</Th>
              <Th>Outcome</Th>
            </tr>
          </thead>
          <tbody>
            {stress.map((r) => (
              <tr key={r.scenarioId}>
                <Td>
                  <div className="text-[12px]">{r.scenarioId}</div>
                </Td>
                <Td
                  align="right"
                  className={cn(
                    r.after.healthFactor < 1 ? 'text-[var(--red)]' : 'text-[var(--text-primary)]',
                  )}
                >
                  {r.after.healthFactor.toFixed(2)}
                </Td>
                <Td align="right">{formatPercent(r.after.liquidationBuffer, 1)}</Td>
                <Td align="right">{formatUsd(r.collateralLossUsd, { compact: true })}</Td>
                <Td>
                  {r.liquidated ? (
                    <span className="chip chip-imminent">Liquidated</span>
                  ) : (
                    <span className="chip chip-safe">Survives</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel>
        <PanelHeader
          title="Recommendations"
          subtitle="Ranked rule-based actions to lift the position's Health Factor."
        />
        <div className="space-y-3">
          {recs.length === 0 ? (
            <div className="text-[12px] text-[var(--text-secondary)]">
              No actions required — position is comfortably solvent.
            </div>
          ) : (
            recs.map((r) => (
              <div key={r.id} className="panel p-4 border-l-2 border-l-[var(--accent)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-medium">{r.title}</div>
                  <div className="flex gap-1.5">
                    <span
                      className={cn(
                        'chip',
                        r.priority === 'high'
                          ? 'chip-imminent'
                          : r.priority === 'medium'
                          ? 'chip-elevated'
                          : 'chip-safe',
                      )}
                    >
                      {r.priority}
                    </span>
                    <span className="chip">{r.kind}</span>
                  </div>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  {r.body}
                </p>
                <div className="text-[10px] text-[var(--text-muted)] mt-2 mono">
                  confidence {(r.confidence * 100).toFixed(0)}% · estimated HF Δ {r.hfDelta.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      <div className="text-[11px] text-[var(--text-muted)]">
        <Link href="/simulator" className="text-[var(--accent)] hover:underline">
          Open this position in the dedicated Monte Carlo workspace →
        </Link>
      </div>

    </div>
  );
}
