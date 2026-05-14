'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Flame, Sparkles } from 'lucide-react';
import {
  ExplanationBlock,
  Panel,
  PanelHeader,
  RiskChip,
  StatCard,
  Table,
  Td,
  Th,
  Tabs,
} from '@/components/ui';
import { StressBars } from '@/components/charts/StressBars';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { STRESS_SCENARIOS, applyAllScenarios, applyScenario } from '@/modules/stress-test';
import { assessHealth } from '@/modules/health-factor';
import { formatPercent, formatUsd, cn } from '@/utils';
import type { StressScenario } from '@/types';

type Category = 'all' | StressScenario['category'];

export function StressPage() {
  const [positionId, setPositionId] = useState(SAMPLE_POSITIONS[0].id);
  const [category, setCategory] = useState<Category>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const position = useMemo(
    () => SAMPLE_POSITIONS.find((p) => p.id === positionId) ?? SAMPLE_POSITIONS[0],
    [positionId],
  );
  const baseSnap = useMemo(() => assessHealth(position), [position]);
  const all = useMemo(() => applyAllScenarios(position), [position]);

  const filteredScenarios = useMemo(() => {
    if (category === 'all') return STRESS_SCENARIOS;
    return STRESS_SCENARIOS.filter((s) => s.category === category);
  }, [category]);

  const filteredResults = useMemo(
    () => filteredScenarios.map((s) => applyScenario(position, s)),
    [filteredScenarios, position],
  );

  const liquidatedCount = all.filter((r) => r.liquidated).length;
  const worstLoss = all.reduce((m, r) => Math.max(m, r.collateralLossUsd), 0);
  const worstHF = all.reduce((m, r) => Math.min(m, r.after.healthFactor), Infinity);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Stress Lab"
          subtitle="Replay historical drawdowns and hypothetical shocks against your collateral mix. Liquidator bonuses and per-asset thresholds are applied."
          right={
            <select
              className="input w-72"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
            >
              {SAMPLE_POSITIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Baseline HF"
            value={baseSnap.healthFactor.toFixed(2)}
            tone="accent"
          />
          <StatCard
            label="Scenarios surviving"
            value={`${STRESS_SCENARIOS.length - liquidatedCount} / ${STRESS_SCENARIOS.length}`}
            tone={liquidatedCount > 0 ? 'warning' : 'positive'}
          />
          <StatCard
            label="Worst-case HF"
            value={worstHF.toFixed(2)}
            tone={worstHF < 1 ? 'negative' : 'warning'}
          />
          <StatCard
            label="Max collateral loss"
            value={formatUsd(worstLoss, { compact: true })}
            tone="warning"
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Outcome by scenario"
          subtitle="Bars show post-shock Health Factor. Anything left of the dashed line liquidates."
          right={
            <Tabs<Category>
              value={category}
              onChange={setCategory}
              options={[
                { value: 'all', label: 'All' },
                { value: 'Historical', label: 'Historical' },
                { value: 'Hypothetical', label: 'Hypothetical' },
                { value: 'Black Swan', label: 'Black Swan' },
              ]}
            />
          }
        />
        <StressBars results={filteredResults} />
      </Panel>

      <Panel>
        <PanelHeader title="Scenario breakdown" />
        <Table>
          <thead>
            <tr>
              <Th>Scenario</Th>
              <Th>Category</Th>
              <Th align="right">HF Before</Th>
              <Th align="right">HF After</Th>
              <Th align="right">Buffer</Th>
              <Th align="right">Loss USD</Th>
              <Th>Outcome</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r) => {
              const sc = STRESS_SCENARIOS.find((s) => s.id === r.scenarioId)!;
              const open = openId === r.scenarioId;
              return (
                <Fragment key={r.scenarioId}>
                  <tr
                    onClick={() => setOpenId(open ? null : r.scenarioId)}
                    className="cursor-pointer hover:bg-white/[0.025]"
                  >
                    <Td>
                      <div className="flex items-center gap-2">
                        {open ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        )}
                        <div>
                          <div className="text-[13px]">{sc.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{sc.occurred ?? '—'}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'chip',
                          sc.category === 'Historical' && 'chip-caution',
                          sc.category === 'Hypothetical' && 'chip-elevated',
                          sc.category === 'Black Swan' && 'chip-imminent',
                        )}
                      >
                        {sc.category}
                      </span>
                    </Td>
                    <Td align="right">{r.before.healthFactor.toFixed(2)}</Td>
                    <Td
                      align="right"
                      className={cn(
                        r.after.healthFactor < 1
                          ? 'text-[var(--red)]'
                          : 'text-[var(--text-primary)]',
                      )}
                    >
                      {r.after.healthFactor.toFixed(2)}
                    </Td>
                    <Td align="right">{formatPercent(r.after.liquidationBuffer, 1)}</Td>
                    <Td align="right">{formatUsd(r.collateralLossUsd, { compact: true })}</Td>
                    <Td>
                      <RiskChip tier={r.after.tier} />
                    </Td>
                    <Td>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {open ? 'hide' : 'detail'}
                      </span>
                    </Td>
                  </tr>
                  {open ? (
                    <tr>
                      <Td className="bg-[var(--bg-secondary)]/40">
                        <ScenarioDetail scenario={sc} />
                      </Td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </Table>
      </Panel>

      <ExplanationBlock
        headline={liquidatedCount > 0 ? `Liquidates in ${liquidatedCount} scenarios` : 'Survives every scenario'}
        bullets={[
          liquidatedCount > 0
            ? `The position liquidates in **${liquidatedCount}** of ${STRESS_SCENARIOS.length} canonical scenarios. Plan an automated de-leverage trigger before the next macro event.`
            : `The position survives every modelled shock, including the **${STRESS_SCENARIOS.length}** historical and hypothetical scenarios.`,
          `Worst observed Health Factor across scenarios: **${worstHF.toFixed(2)}**.`,
          `Largest collateral loss observed: **${formatUsd(worstLoss, { compact: true })}**.`,
          'Shock magnitudes are calibrated to single-day to two-week historical drawdowns. They are conservative, not predictive.',
        ]}
        tone={liquidatedCount > 0 ? 'warning' : 'accent'}
      />

      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-[var(--accent)] mt-0.5" />
          <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Add your own scenario in code: drop a new entry into
            <code className="mono ml-1 mr-1 px-1.5 py-0.5 bg-[var(--bg-card)] rounded">src/modules/stress-test/index.ts</code>
            with per-asset shock multipliers. The engine will pick it up automatically.
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ScenarioDetail({ scenario }: { scenario: StressScenario }) {
  return (
    <div className="py-3 text-[12px] leading-relaxed">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="h-3.5 w-3.5 text-[var(--accent)]" />
        <div className="font-semibold">{scenario.name}</div>
      </div>
      <div className="text-[var(--text-secondary)] mb-3">{scenario.description}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mono">
        {Object.entries(scenario.shocks).map(([asset, mult]) => (
          <div key={asset} className="panel p-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{asset}</div>
            <div className="text-[13px]">{((mult - 1) * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
