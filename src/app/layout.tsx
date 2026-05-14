import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/context/ThemeContext';
import { LangProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'Crucible — DeFi Lending Risk & Liquidation Intelligence',
  description:
    'Monte Carlo liquidation simulator, multi-factor stress tester, and cross-protocol risk console for DeFi lending positions.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-mesh text-[var(--text-primary)] antialiased">
        <ThemeProvider>
          <LangProvider>
            <AppShell>{children}</AppShell>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
