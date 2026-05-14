'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Panel,
  PanelHeader,
  StatCard,
  Table,
  Td,
  Th,
  Tabs,
} from '@/components/ui';
import { ProtocolRadar } from '@/components/charts/ProtocolRadar';
import {
  PROTOCOL_PARAMS,
  summariseProtocols,
  paramsForProtocol,
} from '@/modules/protocol-params';
import { formatPercent, formatUsd, cn } from '@/utils';
import type { ProtocolSlug } from '@/types';

type View = 'matrix' | 'asset';

export function ComparePage() {
  const summaries = useMemo(() => summariseProtocols(), []);
  const [selected, setSelected] = useState<ProtocolSlug[]>([
    summaries[0]?.slug,
    summaries[1]?.slug,
    summaries[2]?.slug,
  ].filter(Boolean) as ProtocolSlug[]);
  const [view, setView] = useState<View>('matrix');
  const [assetFilter, setAssetFilter] = useState<string>('all');

  const toggle = (slug: ProtocolSlug) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const radarRows = useMemo(
    () => summaries.filter((s) => selected.includes(s.slug)),
    [summaries, selected],
  );

  const assetOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of PROTOCOL_PARAMS) set.add(p.asset);
    return ['all', ...Array.from(set).sort()];
  }, []);

  const assetRows = useMemo(() => {
    return PROTOCOL_PARAMS.filter(
      (p) =>
        (assetFilter === 'all' || p.asset === assetFilter) &&
        selected.includes(p.slug),
    );
  }, [assetFilter, selected]);

  const totalTvl = summaries.reduce((s, p) => s + p.tvlUsd, 0);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Protocol selector"
          subtitle="Pick the lending markets you want to benchmark side-by-side."
        />
        <div className="flex flex-wrap gap-2">
          {summaries.map((s) => {
            const active = selected.includes(s.slug);
            return (
              <button
                key={s.slug}
                onClick={() => toggle(s.slug)}
                className={cn(
                  'panel hover p-3 text-left flex items-start gap-2 w-[220px]',
                  active && 'ring-2 ring-[var(--accent)]/40 border-[var(--accent)]/40',
                )}
              >
                <div className="h-8 w-8 rounded-md bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  {active ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{s.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                    {s.assetsCount} assets · {s.maturity}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] mono mt-0.5">
                    LT {formatPercent(s.avgLiquidationThreshold, 1)} · TVL {formatUsd(s.tvlUsd, { compact: true })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Protocols"
          value={selected.length.toString()}
          hint={`${summaries.length} catalogued`}
        />
        <StatCard
          label="Combined TVL"
          value={formatUsd(
            radarRows.reduce((s, p) => s + p.tvlUsd, 0),
            { compact: true },
          )}
          hint={`${formatPercent(
            radarRows.reduce((s, p) => s + p.tvlUsd, 0) / Math.max(1, totalTvl),
            1,
          )} of catalogued lending TVL`}
          tone="accent"
        />
        <StatCard
          label="Avg LTV"
          value={formatPercent(
            avg(radarRows.map((p) => p.avgLtv)),
            1,
          )}
          tone="warning"
        />
        <StatCard
          label="Avg LB"
          value={formatPercent(
            avg(radarRows.map((p) => p.avgLiquidationBonus)),
            2,
          )}
          hint="Liquidator bonus"
        />
      </div>

      <Panel>
        <PanelHeader
          title="Risk-parameter radar"
          subtitle="Higher = friendlier-to-borrower. Conservatism rewards a wide LTV→LT gap; Maturity rewards age/audit count."
        />
        <ProtocolRadar protocols={radarRows} />
      </Panel>

      <Panel>
        <PanelHeader
          title={view === 'matrix' ? 'Protocol matrix' : `${assetFilter === 'all' ? 'All asset' : assetFilter} rows`}
          subtitle="Side-by-side risk parameters across selected protocols."
          right={
            <div className="flex items-center gap-2">
              {view === 'asset' ? (
                <select
                  className="input w-40"
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                >
                  {assetOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              ) : null}
              <Tabs<View>
                value={view}
                onChange={setView}
                options={[
                  { value: 'matrix', label: 'Protocol matrix' },
                  { value: 'asset', label: 'Asset detail' },
                ]}
              />
            </div>
          }
        />

        {view === 'matrix' ? (
          <Table>
            <thead>
              <tr>
                <Th>Protocol</Th>
                <Th>Chain</Th>
                <Th align="right">Assets</Th>
                <Th align="right">Avg LTV</Th>
                <Th align="right">Avg LT</Th>
                <Th align="right">Avg LB</Th>
                <Th align="right">TVL</Th>
                <Th>Maturity</Th>
              </tr>
            </thead>
            <tbody>
              {radarRows.map((s) => (
                <tr key={s.slug}>
                  <Td>
                    <div className="text-[13px]">{s.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      {s.slug}
                    </div>
                  </Td>
                  <Td>{s.chain}</Td>
                  <Td align="right">{s.assetsCount}</Td>
                  <Td align="right">{formatPercent(s.avgLtv, 1)}</Td>
                  <Td align="right">{formatPercent(s.avgLiquidationThreshold, 1)}</Td>
                  <Td align="right">{formatPercent(s.avgLiquidationBonus, 2)}</Td>
                  <Td align="right">{formatUsd(s.tvlUsd, { compact: true })}</Td>
                  <Td>
                    <span className="chip">{s.maturity}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Protocol</Th>
                <Th>Chain</Th>
                <Th>Asset</Th>
                <Th align="right">LTV</Th>
                <Th align="right">LT</Th>
                <Th align="right">Bonus</Th>
                <Th align="right">Close Factor</Th>
                <Th align="right">Borrow APY</Th>
                <Th align="right">Supply APY</Th>
              </tr>
            </thead>
            <tbody>
              {assetRows.map((p, i) => (
                <tr key={`${p.slug}-${p.asset}-${i}`}>
                  <Td>
                    <div className="text-[13px]">{p.name}</div>
                  </Td>
                  <Td>{p.chain}</Td>
                  <Td>{p.asset}</Td>
                  <Td align="right">{formatPercent(p.ltv, 1)}</Td>
                  <Td align="right">{formatPercent(p.liquidationThreshold, 1)}</Td>
                  <Td align="right">{formatPercent(p.liquidationBonus, 2)}</Td>
                  <Td align="right">{formatPercent(p.closeFactor, 0)}</Td>
                  <Td align="right">
                    {p.borrowApy != null ? formatPercent(p.borrowApy, 2) : '—'}
                  </Td>
                  <Td align="right">
                    {p.supplyApy != null ? formatPercent(p.supplyApy, 2) : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Spread analysis" subtitle="Wider LT-LTV gap = more headroom before liquidation." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {radarRows.map((s) => {
            const spread = s.avgLiquidationThreshold - s.avgLtv;
            const rows = paramsForProtocol(s.slug);
            return (
              <div key={s.slug} className="panel p-4">
                <div className="text-[13px] font-semibold tracking-tight">{s.name}</div>
                <div className="mono text-[11px] mt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">LT - LTV</span>
                    <span>{formatPercent(spread, 1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Close factor</span>
                    <span>{formatPercent(rows[0]?.closeFactor ?? 0, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Maturity score</span>
                    <span>{s.maturity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Isolated assets</span>
                    <span>{rows.filter((r) => r.isolated).length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}
