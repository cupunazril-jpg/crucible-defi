'use client';

import { cn } from '@/utils';
import type { DataSource } from '@/context/WalletContext';

const BADGE_CONFIG: Record<DataSource, { label: string; color: string; bg: string; border: string }> = {
  DEMO: { label: 'DEMO', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-card)]', border: 'border-[var(--border)]' },
  LIVE: { label: 'LIVE', color: 'text-[var(--green)]', bg: 'bg-[var(--green-dim)]', border: 'border-[rgba(16,185,129,0.30)]' },
  SYNTHETIC: { label: 'SYNTHETIC', color: 'text-[var(--purple)]', bg: 'bg-[var(--purple-dim)]', border: 'border-[rgba(139,92,246,0.30)]' },
  PARTIAL: { label: 'PARTIAL', color: 'text-[var(--amber)]', bg: 'bg-[var(--amber-dim)]', border: 'border-[rgba(245,158,11,0.30)]' },
};

export function DataSourceBadge({ source, className }: { source: DataSource; className?: string }) {
  const cfg = BADGE_CONFIG[source];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded border", cfg.color, cfg.bg, cfg.border, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", source === 'LIVE' ? 'bg-[var(--green)]' : source === 'DEMO' ? 'bg-[var(--text-muted)]' : source === 'SYNTHETIC' ? 'bg-[var(--purple)]' : 'bg-[var(--amber)]')} />
      {cfg.label}
    </span>
  );
}
