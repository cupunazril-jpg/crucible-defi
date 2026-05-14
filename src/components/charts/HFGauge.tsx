'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { formatHealthFactor } from '@/utils';
import type { RiskTier } from '@/types';

const TIER_COLOR: Record<RiskTier, string> = {
  Safe: '#10b981',
  Caution: '#38bdf8',
  Elevated: '#f59e0b',
  Critical: '#ec4899',
  Imminent: '#ef4444',
};

export function HFGauge({
  hf,
  tier,
  size = 180,
}: {
  hf: number;
  tier: RiskTier;
  size?: number;
}) {
  // Cap the visual scale at HF=3.0 for legibility.
  const visualMax = 3.0;
  const visualValue = Math.min(visualMax, hf);
  const fillPct = (visualValue / visualMax) * 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={10}
          data={[{ name: 'hf', value: fillPct }]}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            fill={TIER_COLOR[tier]}
            background={{ fill: 'rgba(255,255,255,0.04)' }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Health Factor
        </div>
        <div
          className="mono text-3xl font-semibold tracking-tight"
          style={{ color: TIER_COLOR[tier] }}
        >
          {formatHealthFactor(hf)}
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{tier}</div>
      </div>
    </div>
  );
}
