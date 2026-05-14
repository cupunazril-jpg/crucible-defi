'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { OracleDivergence } from '@/types';

export function OracleSpread({
  divergences,
  height = 280,
}: {
  divergences: OracleDivergence[];
  height?: number;
}) {
  const data = divergences.map((d) => ({
    asset: d.asset,
    bps: Number(d.maxSpreadBps.toFixed(2)),
    tier: d.tier,
  }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="asset"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            label={{
              value: 'spread (bps)',
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--text-muted)',
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => `${(v as number).toFixed(2)} bps`}
          />
          <Bar dataKey="bps" isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={fillFor(d.tier)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function fillFor(tier: OracleDivergence['tier']): string {
  switch (tier) {
    case 'Safe':
      return 'var(--green)';
    case 'Caution':
      return 'var(--accent)';
    case 'Elevated':
      return 'var(--amber)';
    case 'Critical':
      return 'var(--magenta)';
    case 'Imminent':
      return 'var(--red)';
  }
}
