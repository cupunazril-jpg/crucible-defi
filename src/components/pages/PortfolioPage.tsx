'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Layers, ListChecks } from 'lucide-react';
import {
  Panel,
  PanelHeader,
  RiskChip,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { assessHealth, healthAtPriceDelta } from '@/modules/health-factor';
import { STRESS_SCENARIOS, applyAllScenarios } from '@/modules/stress-test';
import { formatPercent, formatUsd, cn } from '@/utils';
import type { LendingPosition, RiskTier } from '@/types';

const TIER_COLOR: Record<RiskTier, string> = {
  Safe: 'var(--green)',
  Caution: 'var(--accent)',
  Elevated: 'var(--amber)',
  Critical: 'var(--magenta)',
  Imminent: 'var(--red)',
};

export function PortfolioPage() {
  const [scenarioId, setScenarioId] = useState<string>('covid-march-2020');
  const [shock, setShock] = useState(0);

  const snapshots = useMemo(
    () =>
      SAMPLE_POSITIONS.map((p) => ({
        position: p,
        snap: assessHealth(p),
      })),
    [],
  );

  const totals = useMemo(() => {
    let c = 0,
      d = 0;
    const byProtocol: Record<string, number> = {};
    const byChain: Record<string, number> = {};
    const byCollateral: Record<string, number> = {};
    const byTier: Record<RiskTier, number> = {
      Safe: 0,
      Caution: 0,
      Elevated: 0,
      Critical: 0,
      Imminent: 0,
    };
    let weighted = 0;
    let weightSum = 0;
    for (const { position, snap } of snapshots) {
      c += snap.collateralUsd;
      d += snap.debtUsd;
      byProtocol[position.protocol] =
        (byProtocol[position.protocol] ?? 0) + snap.collateralUsd;
      byChain[position.chain] = (byChain[position.chain] ?? 0) + snap.collateralUsd;
      for (const leg of position.collateral) {
        byCollateral[leg.asset] =
          (byCollateral[leg.asset] ?? 0) + leg.amount * leg.priceUsd;
      }
      byTier[snap.tier] += 1;
      weighted += snap.healthFactor * snap.debtUsd;
      weightSum += snap.debtUsd;
    }
    return {
      collateral: c,
      debt: d,
      net: c - d,
      weightedHF: weightSum ? weighted / weightSum : 0,
      utilisation: c ? d / c : 0,
      byProtocol,
      byChain,
      byCollateral,
      byTier,
    };
  }, [snapshots]);

  const protocolPie = useMemo(
    () =>
      Object.entries(totals.byProtocol).map(([name, value]) => ({
        name,
        value,
      })),
    [totals],
  );

  const collateralBars = useMemo(() => {
    const entries = Object.entries(totals.byCollateral).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 8).map(([asset, value]) => ({ asset, value }));
  }, [totals]);

  const tierBars = useMemo(
    () =>
      (['Safe', 'Caution', 'Elevated', 'Critical', 'Imminent'] as RiskTier[]).map(
        (tier) => ({
          tier,
          count: totals.byTier[tier],
        }),
      ),
    [totals],
  );

  const scenario = STRESS_SCENARIOS.find((s) => s.id === scenarioId) ?? STRESS_SCENARIOS[0];

  const stressedRows = useMemo(() => {
    return snapshots.map(({ position }) => {
      // Resolve the shock multiplier for the dominant asset (or 1).
      const dominant = position.collateral
        .slice()
        .sort((a, b) => b.amount * b.priceUsd - a.amount * a.priceUsd)[0];
      const m = scenario.shocks[dominant?.asset ?? ''] ?? 1;
      // Reduce dominant collateral price by m.
      const next: LendingPosition = {
        ...position,
        collateral: position.collateral.map((leg) =>
          leg.asset === dominant?.asset
            ? { ...leg, priceUsd: leg.priceUsd * m }
            : leg,
        ),
      };
      const snap = assessHealth(next);
      return { position, snap, shockApplied: m };
    });
  }, [snapshots, scenario]);

  const shocked = useMemo(() => {
    return snapshots.map(({ position }) => ({
      position,
      snap: healthAtPriceDelta(position, shock),
    }));
  }, [snapshots, shock]);

  const stressedTotals = useMemo(() => {
    let liquidated = 0;
    let collateralLoss = 0;
    for (let i = 0; i < snapshots.length; i++) {
      const before = snapshots[i].snap.collateralUsd;
      const after = stressedRows[i].snap.collateralUsd;
      if (stressedRows[i].snap.healthFactor < 1) liquidated += 1;
      collateralLoss += Math.max(0, before - after);
    }
    return { liquidated, collateralLoss };
  }, [snapshots, stressedRows]);

  const concentrationConcerns = useMemo(() => {
    const out: string[] = [];
    for (const [proto, usd] of Object.entries(totals.byProtocol)) {
      if (usd / Math.max(1, totals.collateral) > 0.4) {
        out.push(`${formatPercent(usd / totals.collateral, 0)} of collateral on ${proto}`);
      }
    }
    for (const [asset, usd] of Object.entries(totals.byCollateral)) {
      if (usd / Math.max(1, totals.collateral) > 0.4) {
        out.push(`${formatPercent(usd / totals.collateral, 0)} of collateral in ${asset}`);
      }
    }
    if (totals.utilisation > 0.55) {
      out.push(
        `Portfolio utilisation is ${formatPercent(
          totals.utilisation,
          1,
        )} — above safe threshold`,
      );
    }
    return out;
  }, [totals]);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Portfolio overview"
          subtitle="Aggregate health, concentration, and scenario impact across every demo position."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Collateral"
            value={formatUsd(totals.collateral, { compact: true })}
            tone="accent"
          />
          <StatCard
            label="Debt"
            value={formatUsd(totals.debt, { compact: true })}
            tone="warning"
          />
          <StatCard
            label="Net equity"
            value={formatUsd(totals.net, { compact: true })}
            tone="positive"
          />
          <StatCard
            label="Debt-weighted HF"
            value={totals.weightedHF.toFixed(2)}
            tone={totals.weightedHF >= 1.5 ? 'positive' : 'negative'}
            hint={`Utilisation ${formatPercent(totals.utilisation, 1)}`}
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Concentration by collateral asset" />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={collateralBars} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="asset"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => formatUsd(v as number, { compact: true })}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => formatUsd(v as number)}
                />
                <Bar dataKey="value" fill="var(--accent)" isAnimationActive={false}>
                  {collateralBars.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? 'var(--accent)' : 'var(--magenta)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Allocation by protocol" />
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={protocolPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={88}
                  isAnimationActive={false}
                >
                  {protocolPie.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ['var(--accent)', 'var(--magenta)', 'var(--amber)', 'var(--green)', 'var(--red)'][
                          i % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => formatUsd(v as number)}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Tier distribution" />
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={tierBars} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="tier" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} width={32} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" isAnimationActive={false}>
                {tierBars.map((b) => (
                  <Cell key={b.tier} fill={TIER_COLOR[b.tier]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Concentration concerns"
          right={
            <span className="chip">
              <ListChecks className="h-3 w-3" /> {concentrationConcerns.length} flagged
            </span>
          }
        />
        {concentrationConcerns.length === 0 ? (
          <div className="text-[12px] text-[var(--text-secondary)]">
            Portfolio is diversified across protocols and assets. No concentration concerns.
          </div>
        ) : (
          <ul className="space-y-2 text-[12px] text-[var(--text-secondary)] list-disc pl-5">
            {concentrationConcerns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Scenario impact"
          subtitle="Apply a historical or hypothetical scenario across every position simultaneously."
          right={
            <select
              className="input w-72 text-[12px]"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
            >
              {STRESS_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Liquidations"
            value={`${stressedTotals.liquidated}/${snapshots.length}`}
            tone={stressedTotals.liquidated > 0 ? 'negative' : 'positive'}
          />
          <StatCard
            label="Collateral lost"
            value={formatUsd(stressedTotals.collateralLoss, { compact: true })}
            tone="warning"
          />
          <StatCard
            label="Scenario class"
            value={scenario.category}
            hint={scenario.description}
          />
          <StatCard
            label="Worst shock"
            value={`${Math.round(
              (1 - Math.min(...Object.values(scenario.shocks))) * 100,
            )}% drop`}
            tone="negative"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-md">
          <Table>
            <thead>
              <tr>
                <Th>Position</Th>
                <Th>Protocol</Th>
                <Th align="right">HF (before)</Th>
                <Th align="right">HF (after)</Th>
                <Th align="right">Shock</Th>
                <Th>Outcome</Th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map(({ position, snap }, i) => {
                const after = stressedRows[i].snap;
                const m = stressedRows[i].shockApplied;
                const survived = after.healthFactor >= 1;
                return (
                  <tr key={position.id}>
                    <Td>
                      <Link href={`/positions/${position.id}`} className="hover:text-[var(--accent)]">
                        {position.label}
                      </Link>
                    </Td>
                    <Td>{position.protocol}</Td>
                    <Td align="right">{snap.healthFactor.toFixed(2)}</Td>
                    <Td
                      align="right"
                      className={cn(
                        after.healthFactor < 1
                          ? 'text-[var(--red)]'
                          : after.healthFactor < 1.3
                          ? 'text-[var(--amber)]'
                          : 'text-[var(--green)]',
                      )}
                    >
                      {after.healthFactor.toFixed(2)}
                    </Td>
                    <Td align="right">{((m - 1) * 100).toFixed(1)}%</Td>
                    <Td>
                      {survived ? (
                        <span className="chip chip-safe">survives</span>
                      ) : (
                        <span className="chip chip-imminent">liquidated</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Live what-if"
          subtitle="Move the slider to shock every position's dominant collateral by the same percentage."
        />
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="range"
              min={-80}
              max={50}
              step={1}
              value={shock * 100}
              onChange={(e) => setShock(Number(e.target.value) / 100)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>-80%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>
          <div className="mono text-[13px] w-24 text-right">
            <span className={cn(shock < 0 ? 'text-[var(--red)]' : 'text-[var(--green)]')}>
              {shock >= 0 ? '+' : ''}
              {(shock * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shocked.map((row) => (
            <div key={row.position.id} className="panel p-3">
              <div className="flex items-center justify-between text-[12px]">
                <div>
                  <div>{row.position.label}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {row.position.protocol}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'mono',
                      row.snap.healthFactor < 1
                        ? 'text-[var(--red)]'
                        : row.snap.healthFactor < 1.3
                        ? 'text-[var(--amber)]'
                        : 'text-[var(--green)]',
                    )}
                  >
                    HF {row.snap.healthFactor.toFixed(2)}
                  </div>
                  <RiskChip tier={row.snap.tier} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Per-scenario survival"
          subtitle="How many positions survive each named scenario individually."
        />
        <Table>
          <thead>
            <tr>
              <Th>Scenario</Th>
              <Th>Class</Th>
              <Th align="right">Surviving</Th>
              <Th align="right">Avg HF after</Th>
              <Th align="right">Loss</Th>
            </tr>
          </thead>
          <tbody>
            {STRESS_SCENARIOS.map((s) => {
              const rows = snapshots.map(({ position }) =>
                applyAllScenarios(position).find((r) => r.scenarioId === s.id),
              );
              const surviving = rows.filter((r) => r && r.after.healthFactor >= 1).length;
              const avgHF =
                rows.reduce((acc, r) => acc + (r?.after.healthFactor ?? 0), 0) / Math.max(1, rows.length);
              const loss = rows.reduce((acc, r) => acc + (r?.collateralLossUsd ?? 0), 0);
              return (
                <tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Layers className="h-3 w-3 text-[var(--text-muted)]" />
                      {s.name}
                    </div>
                  </Td>
                  <Td>{s.category}</Td>
                  <Td align="right">
                    {surviving}/{snapshots.length}
                  </Td>
                  <Td align="right">{avgHF.toFixed(2)}</Td>
                  <Td align="right">{formatUsd(loss, { compact: true })}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
