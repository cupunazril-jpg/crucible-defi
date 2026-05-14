'use client';

import { cn } from '@/utils';
import type { RiskScoreResult } from '@/lib/risk/risk-score';

const TIER_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
  Safe: { text: 'text-[var(--green)]', bg: 'bg-[var(--green-dim)]', ring: 'ring-[rgba(16,185,129,0.30)]' },
  Caution: { text: 'text-[var(--accent)]', bg: 'bg-[var(--accent-dim)]', ring: 'ring-[rgba(56,189,248,0.30)]' },
  Elevated: { text: 'text-[var(--amber)]', bg: 'bg-[var(--amber-dim)]', ring: 'ring-[rgba(245,158,11,0.30)]' },
  Critical: { text: 'text-[var(--magenta)]', bg: 'bg-[var(--magenta-dim)]', ring: 'ring-[rgba(236,72,153,0.30)]' },
  Imminent: { text: 'text-[var(--red)]', bg: 'bg-[var(--red-dim)]', ring: 'ring-[rgba(239,68,68,0.35)]' },
};

export function RiskScoreBadge({ result, size = 'md' }: { result: RiskScoreResult; size?: 'sm' | 'md' | 'lg' }) {
  const colors = TIER_COLORS[result.tier] ?? TIER_COLORS.Safe;
  const sizeClasses = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-14 w-14 text-[18px]',
    lg: 'h-20 w-20 text-[24px]',
  }[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold mono ring-2",
          sizeClasses,
          colors.text,
          colors.bg,
          colors.ring
        )}
        title={result.explanation}
      >
        {result.score}
      </div>
      {size !== 'sm' && (
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", colors.text)}>
          {result.tier}
        </span>
      )}
    </div>
  );
}

export function RiskScoreBar({ result }: { result: RiskScoreResult }) {
  const colors = TIER_COLORS[result.tier] ?? TIER_COLORS.Safe;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Crucible Risk Score</span>
        <span className={cn("text-[13px] font-bold mono", colors.text)}>{result.score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colors.bg)}
          style={{ width: `${result.score}%`, background: result.score > 75 ? 'var(--red)' : result.score > 50 ? 'var(--amber)' : result.score > 25 ? 'var(--accent)' : 'var(--green)' }}
        />
      </div>
      <div className="flex justify-between mt-0.5 text-[8px] text-[var(--text-muted)] mono">
        <span>0 Safe</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
