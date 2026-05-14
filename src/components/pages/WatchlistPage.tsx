'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkPlus, X } from 'lucide-react';
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
import { assessHealth } from '@/modules/health-factor';
import { generateRecommendations } from '@/modules/recommendation';
import { formatPercent, formatUsd, cn } from '@/utils';

const STORAGE_KEY = 'crucible.watchlist';

export function WatchlistPage() {
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWatchedIds(JSON.parse(raw));
      } else {
        const seed = SAMPLE_POSITIONS.filter((p) => assessHealth(p).healthFactor < 1.5).map(
          (p) => p.id,
        );
         
        setWatchedIds(seed);
      }
    } catch {
      // ignore
    } finally {
       
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedIds));
    } catch {
      // ignore
    }
  }, [watchedIds, hydrated]);

  const watched = useMemo(
    () =>
      SAMPLE_POSITIONS.filter((p) => watchedIds.includes(p.id)).map((p) => {
        const snap = assessHealth(p);
        const recs = generateRecommendations(p);
        return { p, snap, recs };
      }),
    [watchedIds],
  );

  const remaining = useMemo(
    () => SAMPLE_POSITIONS.filter((p) => !watchedIds.includes(p.id)),
    [watchedIds],
  );

  const totals = useMemo(() => {
    let c = 0,
      d = 0,
      atRisk = 0,
      minHF = Infinity;
    for (const w of watched) {
      c += w.snap.collateralUsd;
      d += w.snap.debtUsd;
      if (w.snap.healthFactor < 1.35) atRisk += 1;
      if (w.snap.healthFactor < minHF) minHF = w.snap.healthFactor;
    }
    return { c, d, atRisk, minHF };
  }, [watched]);

  const toggle = (id: string) => {
    setWatchedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Watchlist"
          subtitle="Pinned positions persisted to your browser. Useful for tracking strategy execution over time."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Watched positions"
            value={watched.length.toString()}
            tone="accent"
          />
          <StatCard
            label="Collateral"
            value={formatUsd(totals.c, { compact: true })}
          />
          <StatCard
            label="Debt"
            value={formatUsd(totals.d, { compact: true })}
            tone="warning"
          />
          <StatCard
            label="Weakest HF"
            value={Number.isFinite(totals.minHF) ? totals.minHF.toFixed(2) : '—'}
            tone={totals.minHF < 1.2 ? 'negative' : 'positive'}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="On your watchlist" />
        {watched.length === 0 ? (
          <div className="panel p-6 text-center text-[12px] text-[var(--text-secondary)]">
            <Bookmark className="h-6 w-6 mx-auto mb-2 text-[var(--text-muted)]" />
            No positions pinned yet. Click ⭐ on any position below to add it to your watchlist.
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Position</Th>
                <Th>Tier</Th>
                <Th align="right">HF</Th>
                <Th align="right">Buffer</Th>
                <Th align="right">Collateral</Th>
                <Th align="right">Debt</Th>
                <Th align="right">Actions</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {watched.map(({ p, snap, recs }) => (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/positions/${p.id}`} className="hover:text-[var(--accent)]">
                      <div className="text-[13px]">{p.label}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                        {p.protocol} · {p.chain}
                      </div>
                    </Link>
                  </Td>
                  <Td>
                    <RiskChip tier={snap.tier} />
                  </Td>
                  <Td
                    align="right"
                    className={cn(
                      snap.healthFactor < 1.15
                        ? 'text-[var(--red)]'
                        : snap.healthFactor < 1.5
                        ? 'text-[var(--amber)]'
                        : 'text-[var(--green)]',
                    )}
                  >
                    {snap.healthFactor.toFixed(2)}
                  </Td>
                  <Td align="right">{formatPercent(snap.liquidationBuffer, 1)}</Td>
                  <Td align="right">{formatUsd(snap.collateralUsd, { compact: true })}</Td>
                  <Td align="right">{formatUsd(snap.debtUsd, { compact: true })}</Td>
                  <Td align="right">{recs.length}</Td>
                  <Td>
                    <button
                      onClick={() => toggle(p.id)}
                      className="btn btn-ghost h-7 text-[11px]"
                      title="Remove from watchlist"
                    >
                      <X className="h-3 w-3" /> remove
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {remaining.length > 0 ? (
        <Panel>
          <PanelHeader
            title="Add positions"
            subtitle="Click to pin a position to your watchlist."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {remaining.map((p) => {
              const snap = assessHealth(p);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="panel hover p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] truncate">{p.label}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                        {p.protocol} · {p.chain} · HF {snap.healthFactor.toFixed(2)}
                      </div>
                    </div>
                    <BookmarkPlus className="h-4 w-4 text-[var(--accent)] shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
