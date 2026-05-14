import { NextRequest, NextResponse } from 'next/server';
import { syntheticDivergence } from '@/modules/oracle';
import { fetchPrices } from '@/modules/data-pipeline';

export const dynamic = 'force-dynamic';

const DEFAULT_ASSETS = ['WETH', 'WBTC', 'wstETH', 'cbETH', 'ARB', 'USDC', 'DAI'];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const assets = url.searchParams.get('assets')?.split(',').map((s) => s.trim()) ?? DEFAULT_ASSETS;
  const quotes = await fetchPrices(assets);
  const data = assets.map((a, i) => {
    const div = syntheticDivergence(a, i + 1);
    const live = quotes.find((q) => q.asset === a);
    if (live) {
      // Re-centre synthetic quotes around the live median.
      const oldMedian = div.median;
      const scale = oldMedian > 0 ? live.priceUsd / oldMedian : 1;
      const rescaled = {
        ...div,
        median: live.priceUsd,
        quotes: div.quotes.map((q) => ({ ...q, priceUsd: q.priceUsd * scale })),
      };
      return rescaled;
    }
    return div;
  });
  return NextResponse.json({ divergences: data, updatedAt: Date.now() });
}
