// ============================================================
// Data Pipeline — Public Sources
// ============================================================
//
// Lightweight wrappers around free, keyless public APIs. Each
// function returns a fully-typed payload and gracefully degrades
// to a deterministic local fallback if the network call fails so
// the demo always renders.
// ============================================================

import { PROTOCOL_PARAMS } from '@/modules/protocol-params';

const COINGECKO_IDS: Record<string, string> = {
  WETH: 'weth',
  ETH: 'ethereum',
  WBTC: 'wrapped-bitcoin',
  BTC: 'bitcoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WSTETH: 'wrapped-steth',
  CBETH: 'coinbase-wrapped-staked-eth',
  RETH: 'rocket-pool-eth',
  ARB: 'arbitrum',
  BNB: 'binancecoin',
};

const FALLBACK_PRICES: Record<string, number> = {
  WETH: 2_650,
  ETH: 2_650,
  WBTC: 61_500,
  BTC: 61_500,
  USDC: 1.0,
  USDT: 1.0,
  DAI: 1.0,
  WSTETH: 3_080,
  CBETH: 2_790,
  RETH: 2_900,
  ARB: 0.72,
  BNB: 595,
};

export interface PriceQuote {
  asset: string;
  priceUsd: number;
  source: 'coingecko' | 'fallback';
}

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_BASE = 'https://api.llama.fi';

export async function fetchPrices(assets: string[]): Promise<PriceQuote[]> {
  const ids = assets
    .map((a) => ({ asset: a, id: COINGECKO_IDS[a.toUpperCase()] }))
    .filter((x) => x.id);
  if (ids.length === 0) {
    return assets.map((a) => ({
      asset: a,
      priceUsd: FALLBACK_PRICES[a.toUpperCase()] ?? 0,
      source: 'fallback' as const,
    }));
  }
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids
    .map((x) => x.id)
    .join(',')}&vs_currencies=usd`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const json = (await res.json()) as Record<string, { usd: number }>;
    return assets.map((asset) => {
      const id = COINGECKO_IDS[asset.toUpperCase()];
      const priceUsd = id && json[id]?.usd
        ? json[id].usd
        : FALLBACK_PRICES[asset.toUpperCase()] ?? 0;
      return {
        asset,
        priceUsd,
        source: id && json[id]?.usd ? 'coingecko' : 'fallback',
      };
    });
  } catch {
    return assets.map((a) => ({
      asset: a,
      priceUsd: FALLBACK_PRICES[a.toUpperCase()] ?? 0,
      source: 'fallback',
    }));
  }
}

export interface LendingProtocolTvl {
  name: string;
  category: string;
  chain: string;
  tvlUsd: number;
}

export async function fetchLendingProtocolsTvl(): Promise<LendingProtocolTvl[]> {
  try {
    const res = await fetch(`${DEFILLAMA_BASE}/protocols`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error(`defillama ${res.status}`);
    const json = (await res.json()) as Array<{
      name: string;
      category: string;
      chain: string;
      tvl: number;
    }>;
    return json
      .filter((p) => p.category === 'Lending' || p.category === 'CDP')
      .slice(0, 50)
      .map((p) => ({
        name: p.name,
        category: p.category,
        chain: p.chain,
        tvlUsd: p.tvl,
      }));
  } catch {
    // Local fallback derived from catalog totals
    return Array.from(
      new Map(PROTOCOL_PARAMS.map((p) => [p.slug, p])).values(),
    ).map((p) => ({
      name: p.name,
      category: 'Lending',
      chain: p.chain,
      tvlUsd: p.tvlUsd,
    }));
  }
}
