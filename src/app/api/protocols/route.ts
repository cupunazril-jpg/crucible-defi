import { NextResponse } from 'next/server';
import { PROTOCOL_PARAMS, summariseProtocols } from '@/modules/protocol-params';
import { fetchLendingProtocolsTvl } from '@/modules/data-pipeline';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summaries = summariseProtocols();
  let live: Awaited<ReturnType<typeof fetchLendingProtocolsTvl>> = [];
  try {
    live = await fetchLendingProtocolsTvl();
  } catch {
    live = [];
  }
  return NextResponse.json({
    summaries,
    rows: PROTOCOL_PARAMS,
    live,
    updatedAt: Date.now(),
  });
}
