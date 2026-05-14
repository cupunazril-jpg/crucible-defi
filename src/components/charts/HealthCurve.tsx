'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export function HealthCurve({
  data,
  height = 240,
}: {
  data: { delta: number; hf: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <defs>
            <linearGradient id="hf-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="delta"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickFormatter={(v) => `${((v as number) * 100).toFixed(0)}%`}
            label={{
              value: 'collateral Δ',
              position: 'insideBottomRight',
              offset: -2,
              fill: 'var(--text-muted)',
              fontSize: 10,
            }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            width={36}
            domain={[0, (max: number) => Math.max(2, max)] as [number, (max: number) => number]}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => `Δ ${((v as number) * 100).toFixed(1)}%`}
            formatter={(v) => (v as number).toFixed(2)}
          />
          <ReferenceLine
            y={1}
            stroke="var(--red)"
            strokeDasharray="3 3"
            label={{ value: 'HF = 1', fill: 'var(--red)', fontSize: 10, position: 'insideTopLeft' }}
          />
          <Area
            type="monotone"
            dataKey="hf"
            stroke="var(--accent)"
            fill="url(#hf-grad)"
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
