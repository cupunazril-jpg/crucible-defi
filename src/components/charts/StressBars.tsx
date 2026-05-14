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
  Cell,
} from 'recharts';
import type { StressResult } from '@/types';
import { getScenario } from '@/modules/stress-test';

export function StressBars({
  results,
  height = 320,
}: {
  results: StressResult[];
  height?: number;
}) {
  const data = results.map((r) => {
    const s = getScenario(r.scenarioId);
    return {
      name: s?.name ?? r.scenarioId,
      hf: Number(r.after.healthFactor.toFixed(2)),
      liquidated: r.liquidated,
    };
  });
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            domain={[0, (max: number) => Math.max(2, max)]}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            width={170}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => (v as number).toFixed(2)}
          />
          <ReferenceLine
            x={1}
            stroke="var(--red)"
            strokeDasharray="3 3"
            label={{ value: 'liq', fill: 'var(--red)', fontSize: 10, position: 'top' }}
          />
          <Bar dataKey="hf" isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.liquidated ? 'var(--red)' : d.hf < 1.3 ? 'var(--amber)' : 'var(--green)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
