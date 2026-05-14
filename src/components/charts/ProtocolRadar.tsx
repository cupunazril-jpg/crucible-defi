'use client';

import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { ProtocolSummary } from '@/modules/protocol-params';

const AXES = ['LTV', 'LiqThreshold', 'Bonus', 'Conservatism', 'Maturity'] as const;

const MATURITY_SCORE = {
  Mature: 1,
  Established: 0.75,
  Emerging: 0.5,
  Experimental: 0.25,
};

const COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];

export function ProtocolRadar({
  protocols,
  height = 320,
}: {
  protocols: ProtocolSummary[];
  height?: number;
}) {
  const data = AXES.map((axis) => {
    const row: Record<string, number | string> = { axis };
    protocols.forEach((p) => {
      row[p.name] = scoreFor(axis, p);
    });
    return row;
  });

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <PolarRadiusAxis
            stroke="rgba(255,255,255,0.06)"
            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
            angle={45}
            domain={[0, 1]}
            tickFormatter={(v) => (v as number).toFixed(1)}
          />
          {protocols.map((p, i) => (
            <Radar
              key={p.slug}
              name={p.name}
              dataKey={p.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-secondary)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => (v as number).toFixed(2)}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function scoreFor(axis: typeof AXES[number], p: ProtocolSummary): number {
  switch (axis) {
    case 'LTV':
      return p.avgLtv;
    case 'LiqThreshold':
      return p.avgLiquidationThreshold;
    case 'Bonus':
      // Higher bonus = worse for borrower; invert so higher = friendlier.
      return Math.max(0, 1 - p.avgLiquidationBonus * 5);
    case 'Conservatism':
      // Distance between LTV and liq threshold (more = safer).
      return Math.min(1, (p.avgLiquidationThreshold - p.avgLtv) * 20);
    case 'Maturity':
      return MATURITY_SCORE[p.maturity];
    default:
      return 0;
  }
}
