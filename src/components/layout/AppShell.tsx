'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 px-6 lg:px-10 py-6 max-w-[1480px] w-full mx-auto">
          {children}
        </main>
        <footer className="px-6 lg:px-10 py-6 text-[11px] text-[var(--text-muted)] mono border-t border-[var(--border)]/40">
          crucible · liquidation engines run client-side · data: defillama + coingecko (no keys)
        </footer>
      </div>
    </div>
  );
}
