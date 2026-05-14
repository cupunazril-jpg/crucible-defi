import { NextRequest, NextResponse } from 'next/server';
import { runMonteCarlo } from '@/modules/monte-carlo';
import { explainMonteCarlo } from '@/modules/explanation';
import { findSample } from '@/modules/data-pipeline/positions';
import type { LendingPosition, MonteCarloInput } from '@/types';

export const dynamic = 'force-dynamic';

interface Body {
  position?: LendingPosition;
  positionId?: string;
  paths?: number;
  horizonDays?: number;
  drift?: number;
  volatility?: number;
  seed?: number;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const position = body.position ?? (body.positionId ? findSample(body.positionId) : undefined);
  if (!position) {
    return NextResponse.json({ error: 'position_missing' }, { status: 400 });
  }
  const input: MonteCarloInput = {
    position,
    paths: clampInt(body.paths ?? 2000, 200, 20_000),
    horizonDays: clampInt(body.horizonDays ?? 30, 1, 365),
    drift: body.drift,
    volatility: body.volatility,
  };
  const result = runMonteCarlo(input, { seed: body.seed });
  const explanation = explainMonteCarlo(result, input.horizonDays);
  return NextResponse.json({ result, explanation, input, updatedAt: Date.now() });
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
