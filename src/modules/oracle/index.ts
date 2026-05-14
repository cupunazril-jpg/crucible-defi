// ============================================================
// Oracle Divergence Module
// ============================================================
//
// Compares prices from several free public sources to surface
// divergence between feeds. In the demo build the quotes are
// generated deterministically per asset so the page renders
// without external HTTP calls; the API route layers in a live
// CoinGecko look-up where available.
// ============================================================

import type { OracleDivergence, OracleQuote, RiskTier } from '@/types';

const DEMO_BASE_PRICES: Record<string, number> = {
  WETH: 2_650,
  WBTC: 61_500,
  USDC: 1.0,
  USDT: 1.0,
  DAI: 1.0,
  WSTETH: 3_080,
  CBETH: 2_790,
  ARB: 0.72,
  BNB: 595,
};

const SOURCES = [
  { name: 'Chainlink', spread: 0.0006 },
  { name: 'CoinGecko', spread: 0.0008 },
  { name: 'Uniswap V3 TWAP', spread: 0.0015 },
  { name: 'Pyth', spread: 0.0009 },
];

/** Build a synthetic divergence record around a base price. */
export function syntheticDivergence(asset: string, seed = 1): OracleDivergence {
  const key = asset.toUpperCase();
  const base = DEMO_BASE_PRICES[key] ?? 1;
  // Tiny deterministic perturbation
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  const quotes: OracleQuote[] = SOURCES.map((src, i) => {
    const skew = (i - 1.5) * src.spread * (0.5 + r);
    return {
      asset,
      source: src.name,
      priceUsd: base * (1 + skew),
      updatedAt: Date.now() - i * 1500,
    };
  });
  const prices = quotes.map((q) => q.priceUsd).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const spreadBps =
    median > 0 ? ((prices[prices.length - 1] - prices[0]) / median) * 10_000 : 0;
  return {
    asset,
    median,
    maxSpreadBps: spreadBps,
    quotes,
    tier: tierFromSpread(spreadBps),
  };
}

function tierFromSpread(bps: number): RiskTier {
  if (bps < 8) return 'Safe';
  if (bps < 25) return 'Caution';
  if (bps < 75) return 'Elevated';
  if (bps < 200) return 'Critical';
  return 'Imminent';
}
