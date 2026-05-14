// ============================================================
// Protocol Parameter Catalog
// ============================================================
//
// Curated reference table of lending-market parameters across
// the major DeFi money markets. Values were sourced from each
// protocol's published risk frameworks and on-chain configuration
// snapshots (Q4 2024). They are intended as a representative
// reference, not a live oracle of on-chain state.
//
// The Crucible engines all read parameters from this catalog so
// the risk calculations remain protocol-aware.
// ============================================================

import type { ProtocolParams, ProtocolSlug } from '@/types';

export const PROTOCOL_PARAMS: ProtocolParams[] = [
  // ---- Aave V3 (Ethereum) ----
  {
    slug: 'aave-v3',
    name: 'Aave V3',
    chain: 'ethereum',
    asset: 'WETH',
    ltv: 0.80,
    liquidationThreshold: 0.825,
    liquidationBonus: 0.05,
    closeFactor: 0.50,
    tvlUsd: 14_200_000_000,
    borrowApy: 0.029,
    supplyApy: 0.018,
    maturity: 'Mature',
  },
  {
    slug: 'aave-v3',
    name: 'Aave V3',
    chain: 'ethereum',
    asset: 'WBTC',
    ltv: 0.73,
    liquidationThreshold: 0.78,
    liquidationBonus: 0.0625,
    closeFactor: 0.50,
    tvlUsd: 14_200_000_000,
    borrowApy: 0.025,
    supplyApy: 0.012,
    maturity: 'Mature',
  },
  {
    slug: 'aave-v3',
    name: 'Aave V3',
    chain: 'ethereum',
    asset: 'USDC',
    ltv: 0.75,
    liquidationThreshold: 0.78,
    liquidationBonus: 0.045,
    closeFactor: 0.50,
    tvlUsd: 14_200_000_000,
    borrowApy: 0.062,
    supplyApy: 0.048,
    maturity: 'Mature',
  },
  {
    slug: 'aave-v3',
    name: 'Aave V3',
    chain: 'arbitrum',
    asset: 'ARB',
    ltv: 0.55,
    liquidationThreshold: 0.60,
    liquidationBonus: 0.10,
    closeFactor: 0.50,
    tvlUsd: 1_320_000_000,
    borrowApy: 0.041,
    supplyApy: 0.022,
    maturity: 'Mature',
    isolated: true,
  },
  {
    slug: 'aave-v3',
    name: 'Aave V3',
    chain: 'base',
    asset: 'cbETH',
    ltv: 0.745,
    liquidationThreshold: 0.77,
    liquidationBonus: 0.075,
    closeFactor: 0.50,
    tvlUsd: 620_000_000,
    borrowApy: 0.034,
    supplyApy: 0.017,
    maturity: 'Mature',
  },

  // ---- Aave V2 (Ethereum) ----
  {
    slug: 'aave-v2',
    name: 'Aave V2',
    chain: 'ethereum',
    asset: 'WETH',
    ltv: 0.825,
    liquidationThreshold: 0.86,
    liquidationBonus: 0.05,
    closeFactor: 0.50,
    tvlUsd: 380_000_000,
    borrowApy: 0.033,
    supplyApy: 0.014,
    maturity: 'Established',
  },

  // ---- Compound V3 (Ethereum) ----
  {
    slug: 'compound-v3',
    name: 'Compound V3',
    chain: 'ethereum',
    asset: 'WETH',
    ltv: 0.83,
    liquidationThreshold: 0.90,
    liquidationBonus: 0.05,
    closeFactor: 1.00,
    tvlUsd: 4_350_000_000,
    borrowApy: 0.041,
    supplyApy: 0.027,
    maturity: 'Mature',
  },
  {
    slug: 'compound-v3',
    name: 'Compound V3',
    chain: 'ethereum',
    asset: 'WBTC',
    ltv: 0.80,
    liquidationThreshold: 0.85,
    liquidationBonus: 0.05,
    closeFactor: 1.00,
    tvlUsd: 4_350_000_000,
    borrowApy: 0.029,
    supplyApy: 0.013,
    maturity: 'Mature',
  },
  {
    slug: 'compound-v3',
    name: 'Compound V3',
    chain: 'arbitrum',
    asset: 'USDC.e',
    ltv: 0.80,
    liquidationThreshold: 0.86,
    liquidationBonus: 0.04,
    closeFactor: 1.00,
    tvlUsd: 410_000_000,
    borrowApy: 0.057,
    supplyApy: 0.041,
    maturity: 'Mature',
  },

  // ---- Compound V2 (Ethereum) ----
  {
    slug: 'compound-v2',
    name: 'Compound V2',
    chain: 'ethereum',
    asset: 'WETH',
    ltv: 0.75,
    liquidationThreshold: 0.80,
    liquidationBonus: 0.08,
    closeFactor: 0.50,
    tvlUsd: 220_000_000,
    borrowApy: 0.027,
    supplyApy: 0.011,
    maturity: 'Established',
  },

  // ---- Morpho Blue ----
  {
    slug: 'morpho-blue',
    name: 'Morpho Blue',
    chain: 'ethereum',
    asset: 'wstETH',
    ltv: 0.86,
    liquidationThreshold: 0.86,
    liquidationBonus: 0.045,
    closeFactor: 1.00,
    tvlUsd: 1_870_000_000,
    borrowApy: 0.048,
    supplyApy: 0.038,
    maturity: 'Emerging',
    isolated: true,
  },
  {
    slug: 'morpho-blue',
    name: 'Morpho Blue',
    chain: 'ethereum',
    asset: 'WBTC',
    ltv: 0.86,
    liquidationThreshold: 0.86,
    liquidationBonus: 0.05,
    closeFactor: 1.00,
    tvlUsd: 1_870_000_000,
    borrowApy: 0.042,
    supplyApy: 0.033,
    maturity: 'Emerging',
    isolated: true,
  },

  // ---- Spark ----
  {
    slug: 'spark',
    name: 'Spark',
    chain: 'ethereum',
    asset: 'WETH',
    ltv: 0.80,
    liquidationThreshold: 0.83,
    liquidationBonus: 0.05,
    closeFactor: 0.50,
    tvlUsd: 2_180_000_000,
    borrowApy: 0.036,
    supplyApy: 0.024,
    maturity: 'Established',
  },
  {
    slug: 'spark',
    name: 'Spark',
    chain: 'ethereum',
    asset: 'DAI',
    ltv: 0.74,
    liquidationThreshold: 0.76,
    liquidationBonus: 0.045,
    closeFactor: 0.50,
    tvlUsd: 2_180_000_000,
    borrowApy: 0.072,
    supplyApy: 0.055,
    maturity: 'Established',
  },

  // ---- MakerDAO ----
  {
    slug: 'maker',
    name: 'MakerDAO',
    chain: 'ethereum',
    asset: 'WETH',
    ltv: 0.625,
    liquidationThreshold: 0.625,
    liquidationBonus: 0.13,
    closeFactor: 1.00,
    tvlUsd: 4_120_000_000,
    borrowApy: 0.055,
    maturity: 'Mature',
  },
  {
    slug: 'maker',
    name: 'MakerDAO',
    chain: 'ethereum',
    asset: 'wstETH',
    ltv: 0.69,
    liquidationThreshold: 0.69,
    liquidationBonus: 0.13,
    closeFactor: 1.00,
    tvlUsd: 4_120_000_000,
    borrowApy: 0.062,
    maturity: 'Mature',
  },

  // ---- Venus (BSC) ----
  {
    slug: 'venus',
    name: 'Venus',
    chain: 'bsc',
    asset: 'BNB',
    ltv: 0.65,
    liquidationThreshold: 0.70,
    liquidationBonus: 0.10,
    closeFactor: 0.50,
    tvlUsd: 980_000_000,
    borrowApy: 0.049,
    supplyApy: 0.033,
    maturity: 'Established',
  },

  // ---- Radiant ----
  {
    slug: 'radiant',
    name: 'Radiant',
    chain: 'arbitrum',
    asset: 'WETH',
    ltv: 0.75,
    liquidationThreshold: 0.80,
    liquidationBonus: 0.075,
    closeFactor: 0.50,
    tvlUsd: 170_000_000,
    borrowApy: 0.058,
    supplyApy: 0.039,
    maturity: 'Emerging',
  },
];

const _bySlug: Map<ProtocolSlug, ProtocolParams[]> = new Map();
for (const p of PROTOCOL_PARAMS) {
  const arr = _bySlug.get(p.slug);
  if (arr) arr.push(p);
  else _bySlug.set(p.slug, [p]);
}

export function paramsForProtocol(slug: ProtocolSlug): ProtocolParams[] {
  return _bySlug.get(slug) ?? [];
}

export function paramFor(slug: ProtocolSlug, asset: string): ProtocolParams | undefined {
  return _bySlug.get(slug)?.find((p) => p.asset.toLowerCase() === asset.toLowerCase());
}

export function listProtocols(): ProtocolSlug[] {
  return Array.from(_bySlug.keys());
}

/** Aggregated headline numbers per protocol — used by the Compare page. */
export interface ProtocolSummary {
  slug: ProtocolSlug;
  name: string;
  chain: string;
  assetsCount: number;
  avgLtv: number;
  avgLiquidationThreshold: number;
  avgLiquidationBonus: number;
  tvlUsd: number;
  maturity: ProtocolParams['maturity'];
}

export function summariseProtocols(): ProtocolSummary[] {
  const summaries: ProtocolSummary[] = [];
  for (const [slug, rows] of _bySlug.entries()) {
    if (rows.length === 0) continue;
    const sumLtv = rows.reduce((s, r) => s + r.ltv, 0);
    const sumLt = rows.reduce((s, r) => s + r.liquidationThreshold, 0);
    const sumLb = rows.reduce((s, r) => s + r.liquidationBonus, 0);
    summaries.push({
      slug,
      name: rows[0].name,
      chain: rows.map((r) => r.chain).join(', '),
      assetsCount: rows.length,
      avgLtv: sumLtv / rows.length,
      avgLiquidationThreshold: sumLt / rows.length,
      avgLiquidationBonus: sumLb / rows.length,
      tvlUsd: rows[0].tvlUsd,
      maturity: rows[0].maturity,
    });
  }
  return summaries.sort((a, b) => b.tvlUsd - a.tvlUsd);
}
