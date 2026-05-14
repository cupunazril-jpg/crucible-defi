'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Code2, Menu, X, Sun, Moon, ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/utils';
import { useTheme } from '@/context/ThemeContext';
import { useLang } from '@/context/LanguageContext';

const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/': 'overview.title',
  '/positions': 'positions.title',
  '/portfolio': 'portfolio.title',
  '/simulator': 'simulator.title',
  '/stress': 'stress.title',
  '/compare': 'compare.title',
  '/oracle': 'oracle.title',
  '/strategy': 'strategy.title',
  '/liquidations': 'liquidations.title',
  '/watchlist': 'watchlist.title',
  '/about': 'about.title',
};

const MOBILE_NAV_KEYS = [
  ['/', 'nav.overview'],
  ['/positions', 'nav.positions'],
  ['/portfolio', 'nav.portfolio'],
  ['/simulator', 'nav.simulator'],
  ['/stress', 'nav.stress'],
  ['/compare', 'nav.compare'],
  ['/oracle', 'nav.oracle'],
  ['/strategy', 'nav.strategy'],
  ['/liquidations', 'nav.liquidations'],
  ['/watchlist', 'nav.watchlist'],
  ['/about', 'nav.methodology'],
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<string>('');
  const [langOpen, setLangOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, setLang, t, langs } = useLang();

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(d.toLocaleTimeString('en-GB', { hour12: false }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = () => setLangOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [langOpen]);

  const titleKey = pathname && (ROUTE_TITLE_KEYS[pathname] ?? routeFallback(pathname));

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
            {t(titleKey)}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 mono text-[11px] text-[var(--text-secondary)]">
          <span className="pulse-dot" />
          <span>UTC {now}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>{t('header.engines')}</span>
        </div>

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLangOpen((o) => !o);
            }}
            className="btn btn-ghost h-9 px-2.5 gap-1.5"
            aria-label="Change language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="text-[12px] uppercase">{lang}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 min-w-[140px] py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-50">
              {langs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-white/[0.06] transition-colors',
                    lang === l.code && 'text-[var(--accent)] bg-[var(--accent-dim)]',
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost h-9 w-9 p-0"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

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
            {MOBILE_NAV_KEYS.map(([href, labelKey]) => {
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
                  {t(labelKey)}
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
  // Return a translation key for unknown routes
  const seg = pathname.replace(/^\//, '').split('/')[0];
  if (!seg) return 'overview.title';
  const name = seg.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // For unknown routes, just return the capitalized name directly (no translation key)
  return name;
}
