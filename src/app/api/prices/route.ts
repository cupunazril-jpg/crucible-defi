import { NextRequest, NextResponse } from 'next/server';
import { fetchPrices } from '@/modules/data-pipeline';

export const dynamic = 'force-dynamic';

const DEFAULT_ASSETS = ['WETH', 'WBTC', 'wstETH', 'cbETH', 'ARB', 'USDC', 'DAI', 'BNB'];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const assets = url.searchParams.get('assets');
  const list = assets ? assets.split(',').map((s) => s.trim()) : DEFAULT_ASSETS;
  const quotes = await fetchPrices(list);
  return NextResponse.json({ quotes, updatedAt: Date.now() });
}
