'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search } from 'lucide-react';
import { Panel, PanelHeader, RiskChip, Table, Td, Th, Tabs } from '@/components/ui';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { assessHealth } from '@/modules/health-factor';
import { formatHealthFactor, formatPercent, formatUsd, cn } from '@/utils';
import type { RiskTier } from '@/types';

type SortKey = 'label' | 'hf' | 'buffer' | 'debt' | 'collateral' | 'tier';
type SortDir = 'asc' | 'desc';

const TIER_ORDER: Record<RiskTier, number> = {
  Imminent: 0,
  Critical: 1,
  Elevated: 2,
  Caution: 3,
  Safe: 4,
};

export function PositionsPage() {
  const rows = useMemo(
    () =>
      SAMPLE_POSITIONS.map((p) => {
        const s = assessHealth(p);
        return { p, s };
      }),
    [],
  );

  const [query, setQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | RiskTier>('all');
  const [sortKey, setSortKey] = useState<SortKey>('hf');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (filterTier !== 'all' && r.s.tier !== filterTier) return false;
      if (!q) return true;
      return (
        r.p.label.toLowerCase().includes(q) ||
        r.p.protocol.toLowerCase().includes(q) ||
        r.p.chain.toLowerCase().includes(q) ||
        r.p.collateral.some((c) => c.asset.toLowerCase().includes(q)) ||
        r.p.debt.some((d) => d.asset.toLowerCase().includes(q))
      );
    });
    out = out.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'label':
          return dir * a.p.label.localeCompare(b.p.label);
        case 'hf':
          return dir * (a.s.healthFactor - b.s.healthFactor);
        case 'buffer':
          return dir * (a.s.liquidationBuffer - b.s.liquidationBuffer);
        case 'debt':
          return dir * (a.s.debtUsd - b.s.debtUsd);
        case 'collateral':
          return dir * (a.s.collateralUsd - b.s.collateralUsd);
        case 'tier':
          return dir * (TIER_ORDER[a.s.tier] - TIER_ORDER[b.s.tier]);
      }
    });
    return out;
  }, [rows, query, filterTier, sortKey, sortDir]);

  const totals = useMemo(() => {
    let collateral = 0;
    let debt = 0;
    for (const r of rows) {
      collateral += r.s.collateralUsd;
      debt += r.s.debtUsd;
    }
    return { collateral, debt };
  }, [rows]);

  const tierCounts = useMemo(() => {
    const c: Record<RiskTier | 'all', number> = {
      all: rows.length,
      Safe: 0,
      Caution: 0,
      Elevated: 0,
      Critical: 0,
      Imminent: 0,
    };
    for (const r of rows) c[r.s.tier] += 1;
    return c;
  }, [rows]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'label' ? 'asc' : 'asc');
    }
  };

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Position book"
          subtitle={`${rows.length} demo positions · ${formatUsd(totals.collateral, { compact: true })} collateral · ${formatUsd(totals.debt, { compact: true })} debt`}
          right={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  className="input pl-7 w-56 text-[12px]"
                  placeholder="search asset, protocol…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          }
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <Tabs<'all' | RiskTier>
            value={filterTier}
            onChange={setFilterTier}
            options={[
              { value: 'all', label: `All (${tierCounts.all})` },
              { value: 'Imminent', label: `Imminent (${tierCounts.Imminent})` },
              { value: 'Critical', label: `Critical (${tierCounts.Critical})` },
              { value: 'Elevated', label: `Elevated (${tierCounts.Elevated})` },
              { value: 'Caution', label: `Caution (${tierCounts.Caution})` },
              { value: 'Safe', label: `Safe (${tierCounts.Safe})` },
            ]}
          />
        </div>

        <Table>
          <thead>
            <tr>
              <SortableTh col="label" current={sortKey} dir={sortDir} onClick={toggleSort}>
                Position
              </SortableTh>
              <SortableTh col="tier" current={sortKey} dir={sortDir} onClick={toggleSort}>
                Tier
              </SortableTh>
              <SortableTh col="hf" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">
                HF
              </SortableTh>
              <SortableTh col="buffer" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">
                Buffer
              </SortableTh>
              <SortableTh col="collateral" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">
                Collateral
              </SortableTh>
              <SortableTh col="debt" current={sortKey} dir={sortDir} onClick={toggleSort} align="right">
                Debt
              </SortableTh>
              <Th align="right">Liq Price</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ p, s }) => {
              const dominant = p.collateral[0];
              return (
                <tr key={p.id} className="hover:bg-white/[0.025] transition-colors">
                  <Td>
                    <Link href={`/positions/${p.id}`} className="flex flex-col gap-0.5 group">
                      <span className="text-[13px] group-hover:text-[var(--accent)] transition-colors">
                        {p.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                        {p.protocol} · {p.chain} · {dominant?.asset ?? '—'} / {p.debt[0]?.asset ?? '—'}
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <RiskChip tier={s.tier} />
                  </Td>
                  <Td align="right">
                    <span
                      className={cn(
                        s.healthFactor < 1.15
                          ? 'text-[var(--red)]'
                          : s.healthFactor < 1.5
                          ? 'text-[var(--amber)]'
                          : 'text-[var(--green)]',
                      )}
                    >
                      {formatHealthFactor(s.healthFactor)}
                    </span>
                  </Td>
                  <Td align="right">{formatPercent(s.liquidationBuffer, 1)}</Td>
                  <Td align="right">{formatUsd(s.collateralUsd, { compact: true })}</Td>
                  <Td align="right">{formatUsd(s.debtUsd, { compact: true })}</Td>
                  <Td align="right">
                    {s.liquidationPriceUsd ? formatUsd(s.liquidationPriceUsd) : '—'}
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <Td className="text-center text-[var(--text-muted)]">No positions match.</Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}

function SortableTh({
  col,
  current,
  dir,
  onClick,
  children,
  align = 'left',
}: {
  col: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (c: SortKey) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const active = current === col;
  return (
    <Th align={align}>
      <button
        onClick={() => onClick(col)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors',
          active ? 'text-[var(--accent)]' : '',
        )}
      >
        {children}
        <ArrowUpDown className={cn('h-3 w-3 opacity-50', active && 'opacity-100')} />
        {active ? <span className="text-[9px]">{dir}</span> : null}
      </button>
    </Th>
  );
}
