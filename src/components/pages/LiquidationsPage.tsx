'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, RefreshCw, Search } from 'lucide-react';
import {
  Panel,
  PanelHeader,
  StatCard,
  Table,
  Td,
  Th,
  Tabs,
} from '@/components/ui';
import { LiquidationsOverTime } from '@/components/charts/LiquidationsOverTime';
import { generateLiquidations } from '@/modules/data-pipeline/liquidations';
import {
  formatPercent,
  formatRelativeTime,
  formatUsd,
  shortAddress,
} from '@/utils';
import type { LiquidationEvent } from '@/types';

type Range = '24h' | '7d' | '30d' | 'all';

export function LiquidationsPage() {
  const [events, setEvents] = useState<LiquidationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('7d');
  const [query, setQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/liquidations?count=160');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      } else {
        setEvents(generateLiquidations(160));
      }
    } catch {
      setEvents(generateLiquidations(160));
    } finally {
      setLoading(false);
    }
  };

  const [now] = useState(() => Date.now());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
     
  }, []);

  const cutoff = useMemo(() => {
    switch (range) {
      case '24h':
        return now - 86_400_000;
      case '7d':
        return now - 7 * 86_400_000;
      case '30d':
        return now - 30 * 86_400_000;
      default:
        return 0;
    }
  }, [range, now]);

  const protocols = useMemo(
    () => Array.from(new Set(events.map((e) => e.protocol))).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => e.timestamp >= cutoff)
      .filter((e) => (protocolFilter === 'all' ? true : e.protocol === protocolFilter))
      .filter((e) => {
        if (!q) return true;
        return (
          e.borrower.toLowerCase().includes(q) ||
          e.protocol.toLowerCase().includes(q) ||
          e.chain.toLowerCase().includes(q) ||
          e.collateralAsset.toLowerCase().includes(q) ||
          e.debtAsset.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [events, cutoff, protocolFilter, query]);

  const stats = useMemo(() => {
    let volume = 0;
    let bonuses = 0;
    let liquidated = 0;
    const protocolVol: Record<string, number> = {};
    const collateralVol: Record<string, number> = {};
    for (const e of filtered) {
      volume += e.debtRepaidUsd;
      bonuses += e.liquidatorBonusUsd;
      liquidated += 1;
      protocolVol[e.protocol] = (protocolVol[e.protocol] ?? 0) + e.debtRepaidUsd;
      collateralVol[e.collateralAsset] =
        (collateralVol[e.collateralAsset] ?? 0) + e.collateralLiquidatedUsd;
    }
    const sortedProtocols = Object.entries(protocolVol).sort((a, b) => b[1] - a[1]);
    const sortedCollateral = Object.entries(collateralVol).sort((a, b) => b[1] - a[1]);
    return {
      volume,
      bonuses,
      liquidated,
      avg: liquidated ? volume / liquidated : 0,
      topProtocols: sortedProtocols.slice(0, 5),
      topCollateral: sortedCollateral.slice(0, 5),
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Liquidation Feed"
          subtitle="Synthetic but plausibly distributed liquidation events across major lending markets. Useful for stress drills and dashboard testing."
          right={
            <button
              onClick={refresh}
              disabled={loading}
              className="btn h-9 text-[12px]"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              refresh feed
            </button>
          }
        />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Tabs<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '24h', label: '24h' },
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: 'all', label: 'All' },
            ]}
          />
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <select
              className="input pl-7 w-48 text-[12px]"
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
            >
              <option value="all">All protocols</option>
              {protocols.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              className="input pl-7 w-56 text-[12px]"
              placeholder="search borrower / asset…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Events"
            value={stats.liquidated.toLocaleString()}
            tone="accent"
          />
          <StatCard
            label="Debt repaid"
            value={formatUsd(stats.volume, { compact: true })}
            tone="negative"
          />
          <StatCard
            label="Liquidator bonus paid"
            value={formatUsd(stats.bonuses, { compact: true })}
            tone="warning"
          />
          <StatCard
            label="Avg event size"
            value={formatUsd(stats.avg, { compact: true })}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Volume timeline" />
        <LiquidationsOverTime events={filtered} height={240} />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Top protocols by volume" />
          <ul className="space-y-2 mono">
            {stats.topProtocols.map(([p, v]) => {
              const pct = v / Math.max(1, stats.volume);
              return (
                <li key={p}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span>{p}</span>
                    <span className="text-[var(--text-secondary)]">
                      {formatUsd(v, { compact: true })} · {formatPercent(pct, 1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded">
                    <div
                      className="h-1.5 rounded bg-[var(--accent)]"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Top collateral assets seized" />
          <ul className="space-y-2 mono">
            {stats.topCollateral.map(([a, v]) => {
              const total = stats.topCollateral.reduce((s, [, vv]) => s + vv, 0) || 1;
              const pct = v / total;
              return (
                <li key={a}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span>{a}</span>
                    <span className="text-[var(--text-secondary)]">
                      {formatUsd(v, { compact: true })} · {formatPercent(pct, 1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded">
                    <div
                      className="h-1.5 rounded bg-[var(--magenta)]"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Event log" subtitle={`${filtered.length} events shown`} />
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Borrower</Th>
              <Th>Protocol</Th>
              <Th>Chain</Th>
              <Th>Collateral</Th>
              <Th>Debt</Th>
              <Th align="right">Seized USD</Th>
              <Th align="right">Repaid USD</Th>
              <Th align="right">Bonus USD</Th>
              <Th align="right">Bonus %</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((e) => (
              <tr key={e.id}>
                <Td className="mono text-[11px] text-[var(--text-muted)]">
                  {formatRelativeTime(e.timestamp)}
                </Td>
                <Td className="mono text-[11px]">{shortAddress(e.borrower)}</Td>
                <Td>{e.protocol}</Td>
                <Td>{e.chain}</Td>
                <Td>{e.collateralAsset}</Td>
                <Td>{e.debtAsset}</Td>
                <Td align="right">{formatUsd(e.collateralLiquidatedUsd, { compact: true })}</Td>
                <Td align="right">{formatUsd(e.debtRepaidUsd, { compact: true })}</Td>
                <Td align="right">{formatUsd(e.liquidatorBonusUsd, { compact: true })}</Td>
                <Td align="right">
                  {(
                    (e.liquidatorBonusUsd / Math.max(1, e.debtRepaidUsd)) *
                    100
                  ).toFixed(2)}
                  %
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
