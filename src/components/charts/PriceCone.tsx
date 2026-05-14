'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatUsd } from '@/utils';

interface ConePoint {
  day: number;
  p5: number;
  p50: number;
  p95: number;
  liqPrice?: number | null;
}

export function PriceCone({
  p5,
  median,
  p95,
  liquidationPrice,
  height = 300,
}: {
  p5: number[];
  median: number[];
  p95: number[];
  liquidationPrice?: number | null;
  height?: number;
}) {
  const data: ConePoint[] = median.map((m, i) => ({
    day: i,
    p5: p5[i] ?? m,
    p50: m,
    p95: p95[i] ?? m,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="day"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            label={{
              value: 'days',
              position: 'insideBottomRight',
              offset: -2,
              fill: 'var(--text-muted)',
              fontSize: 10,
            }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickFormatter={(v) => formatUsd(v as number, { compact: true })}
            width={62}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(v) => formatUsd(v as number)}
          />
          <Area
            type="monotone"
            dataKey="p95"
            stroke="none"
            fill="rgba(56, 189, 248, 0.06)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="p5"
            stroke="none"
            fill="var(--bg-primary)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p50"
            stroke="var(--accent)"
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p95"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p5"
            stroke="rgba(236, 72, 153, 0.5)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          {liquidationPrice ? (
            <ReferenceLine
              y={liquidationPrice}
              stroke="var(--red)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Liq ${formatUsd(liquidationPrice, { compact: true })}`,
                position: 'insideTopRight',
                fill: 'var(--red)',
                fontSize: 10,
              }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
