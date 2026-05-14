import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_POSITIONS, findSample } from '@/modules/data-pipeline/positions';
import { assessHealth } from '@/modules/health-factor';
import { explainSnapshot } from '@/modules/explanation';
import { generateRecommendations } from '@/modules/recommendation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id) {
    const position = findSample(id);
    if (!position) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const snapshot = assessHealth(position);
    const explanation = explainSnapshot(position, snapshot);
    const recommendations = generateRecommendations(position);
    return NextResponse.json({ position, snapshot, explanation, recommendations });
  }
  const list = SAMPLE_POSITIONS.map((p) => {
    const snap = assessHealth(p);
    return { position: p, snapshot: snap };
  });
  return NextResponse.json({ positions: list, updatedAt: Date.now() });
}
