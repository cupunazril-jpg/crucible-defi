// ============================================================
// Liquidation Event Generator
// ============================================================
//
// Deterministic sample of historical-style liquidation events.
// In production these would be fetched from a subgraph; for the
// demo we want a stable, reproducible feed that exercises the UI
// tables, filters, and charts.
// ============================================================

import type { LiquidationEvent, ProtocolSlug, Chain } from '@/types';

const PROTOCOLS: { slug: ProtocolSlug; chain: Chain }[] = [
  { slug: 'aave-v3', chain: 'ethereum' },
  { slug: 'aave-v3', chain: 'arbitrum' },
  { slug: 'aave-v3', chain: 'base' },
  { slug: 'aave-v2', chain: 'ethereum' },
  { slug: 'compound-v3', chain: 'ethereum' },
  { slug: 'compound-v3', chain: 'arbitrum' },
  { slug: 'morpho-blue', chain: 'ethereum' },
  { slug: 'spark', chain: 'ethereum' },
  { slug: 'maker', chain: 'ethereum' },
  { slug: 'venus', chain: 'bsc' },
  { slug: 'radiant', chain: 'arbitrum' },
];

const COLLATERALS = ['WETH', 'WBTC', 'wstETH', 'cbETH', 'ARB', 'BNB'];
const DEBTS = ['USDC', 'USDT', 'DAI', 'WETH'];

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fakeAddress(seed: number): string {
  const hex = (seed >>> 0).toString(16).padStart(8, '0');
  return `0x${hex}${'4f9a2b'.repeat(6).slice(0, 32)}`;
}

export function generateLiquidations(count = 60, seed = 17): LiquidationEvent[] {
  const out: LiquidationEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const h = hashStr(`liq-${seed}-${i}`);
    const proto = PROTOCOLS[h % PROTOCOLS.length];
    const collat = COLLATERALS[(h >> 4) % COLLATERALS.length];
    const debt = DEBTS[(h >> 8) % DEBTS.length];
    const debtUsd = 5_000 + ((h >> 12) % 95_000_000) / 1_000;
    const collatUsd = debtUsd * (1.04 + ((h >> 16) % 100) / 1_000);
    const bonus = (collatUsd - debtUsd) * 0.7;
    out.push({
      id: `liq-${i}`,
      protocol: proto.slug,
      chain: proto.chain,
      timestamp: now - i * 3_600_000 - ((h >> 20) % 86_400_000),
      borrower: fakeAddress(h),
      collateralAsset: collat,
      debtAsset: debt,
      collateralLiquidatedUsd: Math.round(collatUsd),
      debtRepaidUsd: Math.round(debtUsd),
      liquidatorBonusUsd: Math.round(bonus),
    });
  }
  return out.sort((a, b) => b.timestamp - a.timestamp);
}
