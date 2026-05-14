'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { LiquidationEvent } from '@/types';
import { formatUsd } from '@/utils';

export function LiquidationsOverTime({
  events,
  height = 220,
}: {
  events: LiquidationEvent[];
  height?: number;
}) {
  const [now] = useState(() => Date.now());
  const buckets = useMemo(() => {
    const days = 14;
    const out: { day: string; volume: number; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const t = now - i * 86_400_000;
      const d = new Date(t);
      out.push({
        day: `${d.getMonth() + 1}/${d.getDate()}`,
        volume: 0,
        count: 0,
      });
    }
    for (const ev of events) {
      const offset = Math.floor((now - ev.timestamp) / 86_400_000);
      if (offset < 0 || offset >= days) continue;
      const idx = days - 1 - offset;
      out[idx].volume += ev.debtRepaidUsd;
      out[idx].count += 1;
    }
    return out;
  }, [events, now]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={buckets} margin={{ top: 6, right: 16, bottom: 6, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <defs>
            <linearGradient id="liq-volume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickFormatter={(v) => formatUsd(v as number, { compact: true })}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => formatUsd(v as number)}
          />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="#ec4899"
            fill="url(#liq-volume)"
            strokeWidth={1.4}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
