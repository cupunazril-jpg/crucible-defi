'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Lightbulb, ShieldAlert } from 'lucide-react';
import {
  ExplanationBlock,
  Panel,
  PanelHeader,
  RiskChip,
  StatCard,
} from '@/components/ui';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { assessHealth } from '@/modules/health-factor';
import { generateRecommendations } from '@/modules/recommendation';
import { explainSnapshot } from '@/modules/explanation';
import { formatPercent, formatUsd, cn } from '@/utils';
import type { Recommendation } from '@/types';

const KIND_LABEL: Record<Recommendation['kind'], string> = {
  repay: 'Repay debt',
  'add-collateral': 'Add collateral',
  migrate: 'Migrate protocol',
  'reduce-leverage': 'Reduce leverage',
  hedge: 'Hedge collateral',
};

const KIND_ICON: Record<Recommendation['kind'], typeof CheckCircle2> = {
  repay: ShieldAlert,
  'add-collateral': ShieldAlert,
  migrate: ChevronRight,
  'reduce-leverage': ShieldAlert,
  hedge: Lightbulb,
};

export function StrategyPage() {
  const [positionId, setPositionId] = useState(SAMPLE_POSITIONS[0].id);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const position = useMemo(
    () => SAMPLE_POSITIONS.find((p) => p.id === positionId) ?? SAMPLE_POSITIONS[0],
    [positionId],
  );
  const snap = useMemo(() => assessHealth(position), [position]);
  const recs = useMemo(() => generateRecommendations(position), [position]);
  const explanation = useMemo(() => explainSnapshot(position, snap), [position, snap]);

  const filtered = useMemo(() => {
    if (priorityFilter === 'all') return recs;
    return recs.filter((r) => r.priority === priorityFilter);
  }, [recs, priorityFilter]);

  const counts = useMemo(() => {
    return {
      high: recs.filter((r) => r.priority === 'high').length,
      medium: recs.filter((r) => r.priority === 'medium').length,
      low: recs.filter((r) => r.priority === 'low').length,
    };
  }, [recs]);

  const maxHFDelta = recs.reduce((m, r) => Math.max(m, r.hfDelta), 0);
  const target = (snap.healthFactor + maxHFDelta).toFixed(2);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Strategy Engine"
          subtitle="Rule-based recommendations that lift the Health Factor of a position into a safe band."
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
          <StatCard label="Current HF" value={snap.healthFactor.toFixed(2)} tone="accent" />
          <StatCard
            label="Target HF (best action)"
            value={target}
            hint="If you execute the top recommendation"
            tone="positive"
          />
          <StatCard
            label="High-priority actions"
            value={counts.high.toString()}
            tone={counts.high > 0 ? 'negative' : 'positive'}
          />
          <StatCard
            label="Total recommendations"
            value={recs.length.toString()}
            tone="warning"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <RiskChip tier={snap.tier} />
          <div className="text-[12px] text-[var(--text-secondary)]">
            {position.protocol} · {position.chain} · {formatUsd(snap.collateralUsd, { compact: true })}{' '}
            collateral · {formatUsd(snap.debtUsd, { compact: true })} debt ·{' '}
            buffer {formatPercent(snap.liquidationBuffer, 1)}
          </div>
        </div>
      </Panel>

      <ExplanationBlock headline={explanation.headline} bullets={explanation.bullets} tone="accent" />

      <Panel>
        <PanelHeader
          title="Action plan"
          subtitle={`Filter by priority. Higher hfDelta = larger improvement.`}
          right={
            <div className="flex gap-1.5">
              {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={cn(
                    'chip',
                    p === priorityFilter
                      ? 'border-[var(--accent)]/60 text-[var(--accent)] bg-[var(--accent-dim)]'
                      : '',
                  )}
                >
                  {p}
                  {p !== 'all' ? ` (${counts[p as 'high' | 'medium' | 'low']})` : ''}
                </button>
              ))}
            </div>
          }
        />

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="panel p-4 text-[12px] text-[var(--text-secondary)] flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-[var(--green)]" />
              No recommended actions — position is comfortably solvent for the current Health
              Factor tier.
            </div>
          ) : (
            filtered.map((rec, idx) => {
              const Icon = KIND_ICON[rec.kind];
              return (
                <div
                  key={rec.id}
                  className={cn(
                    'panel p-4',
                    rec.priority === 'high' && 'border-l-2 border-l-[var(--red)]',
                    rec.priority === 'medium' && 'border-l-2 border-l-[var(--amber)]',
                    rec.priority === 'low' && 'border-l-2 border-l-[var(--accent)]',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                        rec.priority === 'high'
                          ? 'bg-[var(--red)]/15 text-[var(--red)]'
                          : rec.priority === 'medium'
                          ? 'bg-[var(--amber)]/15 text-[var(--amber)]'
                          : 'bg-[var(--accent-dim)] text-[var(--accent)]',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                            Action {idx + 1} · {KIND_LABEL[rec.kind]}
                          </div>
                          <div className="text-[13px] font-medium mt-0.5">{rec.title}</div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <span
                            className={cn(
                              'chip',
                              rec.priority === 'high' && 'chip-imminent',
                              rec.priority === 'medium' && 'chip-elevated',
                              rec.priority === 'low' && 'chip-safe',
                            )}
                          >
                            {rec.priority}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] mono">
                            HF Δ +{rec.hfDelta.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                        {rec.body}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[11px] mono">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                            Confidence
                          </div>
                          <div>{(rec.confidence * 100).toFixed(0)}%</div>
                        </div>
                        {rec.amountUsd != null ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                              Amount
                            </div>
                            <div>{formatUsd(rec.amountUsd, { compact: true })}</div>
                          </div>
                        ) : null}
                        {rec.targetHf != null ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                              Target HF
                            </div>
                            <div>{rec.targetHf.toFixed(2)}</div>
                          </div>
                        ) : null}
                        {rec.toProtocol ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                              Migrate to
                            </div>
                            <div>{rec.toProtocol}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Next steps" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href={`/positions/${position.id}`} className="panel hover p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">Drill into position detail</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Health curve, scenarios, what-if sliders for {position.label}.
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </Link>
          <Link href="/simulator" className="panel hover p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium">Run Monte Carlo simulation</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  2k+ GBM paths over your dominant collateral asset.
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </Link>
        </div>
      </Panel>
    </div>
  );
}
