'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Code2, Menu, X } from 'lucide-react';
import { cn } from '@/utils';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/positions': 'Positions',
  '/portfolio': 'Portfolio',
  '/simulator': 'Monte Carlo Liquidation Simulator',
  '/stress': 'Stress Lab',
  '/compare': 'Cross-Protocol Compare',
  '/oracle': 'Oracle Divergence Monitor',
  '/strategy': 'Strategy Recommender',
  '/liquidations': 'Liquidation Feed',
  '/watchlist': 'Watchlist',
  '/about': 'Methodology & Formulas',
};

const MOBILE_NAV = [
  ['/', 'Overview'],
  ['/positions', 'Positions'],
  ['/portfolio', 'Portfolio'],
  ['/simulator', 'Monte Carlo'],
  ['/stress', 'Stress Lab'],
  ['/compare', 'Compare'],
  ['/oracle', 'Oracle'],
  ['/strategy', 'Strategy'],
  ['/liquidations', 'Liquidations'],
  ['/watchlist', 'Watchlist'],
  ['/about', 'Methodology'],
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(d.toLocaleTimeString('en-GB', { hour12: false }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const title = pathname && (ROUTE_TITLES[pathname] ?? routeFallback(pathname));

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)]/40 bg-[var(--bg-primary)]/85 backdrop-blur">
      <div className="px-6 lg:px-10 h-14 flex items-center gap-4 max-w-[1480px] mx-auto w-full">
        <button
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden btn btn-ghost h-9 w-9 p-0"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Crucible
          </div>
          <div className="text-[15px] font-semibold tracking-tight truncate">
            {title}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 mono text-[11px] text-[var(--text-secondary)]">
          <span className="pulse-dot" />
          <span>UTC {now}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>engines: idle</span>
        </div>

        <Link
          href="https://github.com/cupunazril-jpg/crucible"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost h-9 px-3"
        >
          <Code2 className="h-4 w-4" />
          <span className="hidden sm:inline text-[12px]">Repo</span>
        </Link>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[var(--border)]/40 bg-[var(--bg-secondary)]">
          <nav className="px-4 py-3 grid grid-cols-2 gap-2">
            {MOBILE_NAV.map(([href, label]) => {
              const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-md text-[12px]',
                    active
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'text-[var(--text-secondary)]',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

function routeFallback(pathname: string): string {
  const seg = pathname.replace(/^\//, '').split('/')[0];
  if (!seg) return 'Overview';
  return seg.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
