import { NextRequest, NextResponse } from 'next/server';
import { generateLiquidations } from '@/modules/data-pipeline/liquidations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const count = Math.min(500, Math.max(10, Number(url.searchParams.get('count') ?? 80)));
  const events = generateLiquidations(count);
  return NextResponse.json({ events, updatedAt: Date.now() });
}
