'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { formatUsd } from '@/utils';

export function Histogram({
  data,
  liquidationPrice,
  height = 260,
}: {
  data: { x: number; count: number }[];
  liquidationPrice?: number | null;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 6, right: 12, bottom: 6, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="x"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickFormatter={(v) => formatUsd(v as number, { compact: true })}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => (v as number).toFixed(0)}
            labelFormatter={(v) => formatUsd(v as number)}
          />
          <Bar dataKey="count" fill="rgba(139, 92, 246, 0.55)" isAnimationActive={false} />
          {liquidationPrice ? (
            <ReferenceLine
              x={liquidationPrice}
              stroke="var(--red)"
              strokeDasharray="4 4"
              label={{
                value: 'Liq',
                fill: 'var(--red)',
                fontSize: 10,
                position: 'top',
              }}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
