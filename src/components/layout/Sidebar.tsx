'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Beaker,
  Flame,
  GitCompareArrows,
  Home,
  Layers,
  ListChecks,
  PieChart,
  Radar,
  Star,
  Workflow,
} from 'lucide-react';
import { cn } from '@/utils';

const NAV = [
  { href: '/', label: 'Overview', Icon: Home },
  { href: '/positions', label: 'Positions', Icon: Layers },
  { href: '/portfolio', label: 'Portfolio', Icon: PieChart },
  { href: '/simulator', label: 'Monte Carlo', Icon: Activity },
  { href: '/stress', label: 'Stress Lab', Icon: Flame },
  { href: '/compare', label: 'Protocol Compare', Icon: GitCompareArrows },
  { href: '/oracle', label: 'Oracle Spread', Icon: Radar },
  { href: '/strategy', label: 'Strategy', Icon: Workflow },
  { href: '/liquidations', label: 'Liquidations', Icon: ListChecks },
  { href: '/watchlist', label: 'Watchlist', Icon: Star },
  { href: '/about', label: 'Methodology', Icon: Beaker },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[var(--border)]/40 bg-[var(--bg-secondary)]/60">
      <Link href="/" className="px-5 pt-6 pb-7 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-sky-400 via-violet-400 to-pink-400 flex items-center justify-center shadow-[0_0_18px_rgba(139,92,246,0.45)]">
          <Flame className="h-4 w-4 text-black" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">Crucible</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            risk engine v0.1
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors',
                active
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 text-[10px] text-[var(--text-muted)] mono leading-relaxed">
        <div className="flex items-center gap-2 mb-2">
          <span className="pulse-dot" />
          <span>oracle feeds live</span>
        </div>
        <div>v0.1.0 · gbm sims @ Δt=1d</div>
        <div>HF math is protocol-aware</div>
      </div>
    </aside>
  );
}
