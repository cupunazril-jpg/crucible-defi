'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Beaker,
  Bell,
  FileText,
  Flame,
  GitCompareArrows,
  Home,
  Layers,
  ListChecks,
  PieChart,
  Radar,
  Star,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/utils';
import { useLang } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

const NAV_KEYS = [
  { href: '/', labelKey: 'nav.overview', Icon: Home },
  { href: '/positions', labelKey: 'nav.positions', Icon: Layers },
  { href: '/portfolio', labelKey: 'nav.portfolio', Icon: PieChart },
  { href: '/simulator', labelKey: 'nav.simulator', Icon: Activity },
  { href: '/stress', labelKey: 'nav.stress', Icon: Flame },
  { href: '/compare', labelKey: 'nav.compare', Icon: GitCompareArrows },
  { href: '/oracle', labelKey: 'nav.oracle', Icon: Radar },
  { href: '/strategy', labelKey: 'nav.strategy', Icon: Workflow },
  { href: '/liquidations', labelKey: 'nav.liquidations', Icon: ListChecks },
  { href: '/watchlist', labelKey: 'nav.watchlist', Icon: Star },
  { href: '/alerts', labelKey: 'nav.alerts', Icon: Bell },
  { href: '/report', labelKey: 'nav.report', Icon: FileText },
  { href: '/about', labelKey: 'nav.methodology', Icon: Beaker },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLang();
  const { theme } = useTheme();

  return (
    <aside
      className={cn(
        'hidden lg:flex shrink-0 flex-col border-r border-[var(--border)]/40 bg-[var(--bg-secondary)]/60',
        'sticky top-0 h-screen transition-all duration-300 ease-in-out',
        collapsed ? 'w-[64px]' : 'w-[220px]',
      )}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-3 pt-5 pb-3">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-sky-400 via-violet-400 to-pink-400 flex items-center justify-center shadow-[0_0_18px_rgba(139,92,246,0.45)] shrink-0">
              <Flame className="h-4 w-4 text-black" strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[15px] font-semibold tracking-tight">Crucible</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                risk engine v0.1
              </div>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-sky-400 via-violet-400 to-pink-400 flex items-center justify-center shadow-[0_0_18px_rgba(139,92,246,0.45)] mx-auto">
            <Flame className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="mx-3 mb-2 flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/[0.06] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" strokeWidth={1.7} />
        ) : (
          <PanelLeftClose className="h-4 w-4" strokeWidth={1.7} />
        )}
      </button>

      {/* Nav */}
      <nav className={cn('flex-1 px-3 space-y-0.5 overflow-y-auto', collapsed && 'px-2')}>
        {NAV_KEYS.map(({ href, labelKey, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? t(labelKey) : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md text-[13px] transition-colors',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                active
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              {!collapsed && <span>{t(labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-5 text-[10px] text-[var(--text-muted)] mono leading-relaxed">
          <div className="flex items-center gap-2 mb-2">
            <span className="pulse-dot" />
            <span>simulation feeds active</span>
          </div>
          <div>v0.1.0 · gbm sims @ Δt=1d</div>
          <div>HF math is protocol-aware</div>
        </div>
      )}
    </aside>
  );
}
