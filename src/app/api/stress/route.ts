import { NextRequest, NextResponse } from 'next/server';
import { applyAllScenarios, STRESS_SCENARIOS } from '@/modules/stress-test';
import { findSample } from '@/modules/data-pipeline/positions';
import type { LendingPosition } from '@/types';

export const dynamic = 'force-dynamic';

interface Body {
  position?: LendingPosition;
  positionId?: string;
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
  const results = applyAllScenarios(position);
  return NextResponse.json({ scenarios: STRESS_SCENARIOS, results, updatedAt: Date.now() });
}

export async function GET() {
  return NextResponse.json({ scenarios: STRESS_SCENARIOS });
}
