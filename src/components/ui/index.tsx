'use client';

import { ReactNode } from 'react';
import { cn } from '@/utils';
import type { RiskTier } from '@/types';

// ============================================================
// Panel — primary content card.
// ============================================================

export function Panel({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn('panel p-5', hover && 'hover', className)}>{children}</div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 mb-4',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold tracking-tight leading-tight">{title}</div>
        {subtitle ? (
          <div className="text-[11px] text-[var(--text-secondary)] mt-1">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

// ============================================================
// StatCard — large kpi tile.
// ============================================================

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'accent';
}) {
  const toneClass = {
    neutral: 'text-[var(--text-primary)]',
    positive: 'text-[var(--green)]',
    negative: 'text-[var(--red)]',
    warning: 'text-[var(--amber)]',
    accent: 'text-[var(--accent)]',
  }[tone];
  return (
    <div className="panel p-4 flex flex-col justify-between min-h-[112px]">
      <div className="text-[10px] uppercase tracking-[0.10em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className={cn('mono text-2xl font-semibold mt-3 tracking-tight', toneClass)}>
        {value}
      </div>
      {hint ? (
        <div className="text-[11px] text-[var(--text-secondary)] mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

// ============================================================
// RiskChip — tier badge.
// ============================================================

const TIER_CLASS: Record<RiskTier, string> = {
  Safe: 'chip-safe',
  Caution: 'chip-caution',
  Elevated: 'chip-elevated',
  Critical: 'chip-critical',
  Imminent: 'chip-imminent',
};

export function RiskChip({ tier, prefix }: { tier: RiskTier; prefix?: string }) {
  return (
    <span className={cn('chip', TIER_CLASS[tier])}>
      {prefix ? <span className="opacity-70">{prefix}</span> : null}
      {tier}
    </span>
  );
}

// ============================================================
// Table primitives.
// ============================================================

export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-[13px] mono border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
  className,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <th
      className={cn(
        'sticky top-0 bg-[var(--bg-card)] text-[10px] uppercase tracking-[0.10em] font-semibold text-[var(--text-muted)] py-2 px-3 border-b border-[var(--border)]/60',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <td
      className={cn(
        'py-2.5 px-3 border-b border-[var(--border)]/30',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </td>
  );
}

// ============================================================
// Inline explanation bullet list.
// ============================================================

export function ExplanationBlock({
  headline,
  bullets,
  tone = 'accent',
}: {
  headline: string;
  bullets: string[];
  tone?: 'accent' | 'warning' | 'danger';
}) {
  const borderClass = {
    accent: 'border-l-[var(--accent)]',
    warning: 'border-l-[var(--amber)]',
    danger: 'border-l-[var(--red)]',
  }[tone];
  return (
    <div
      className={cn(
        'panel p-5 border-l-2',
        borderClass,
      )}
    >
      <div className="text-[13px] font-semibold mb-2 tracking-tight">{headline}</div>
      <ul className="space-y-1.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="exp-bullet"
            dangerouslySetInnerHTML={{ __html: renderInline(b) }}
          />
        ))}
      </ul>
    </div>
  );
}

function renderInline(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// ============================================================
// Tab strip.
// ============================================================

export function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-1 gap-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 h-7 rounded-md text-[11px] font-medium transition-colors',
              active
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Loading skeleton.
// ============================================================

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md bg-[var(--bg-card-hover)] animate-pulse',
        className,
      )}
    />
  );
}
