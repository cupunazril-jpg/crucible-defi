import type { HealthSnapshot, MonteCarloResult, OracleDivergence, StressResult } from '@/types';

export interface RiskScoreInput {
  snapshot?: HealthSnapshot | null;
  monteCarlo?: MonteCarloResult | null;
  divergences?: OracleDivergence[];
  stressResults?: StressResult[];
}

export interface RiskScoreResult {
  score: number;
  tier: 'Safe' | 'Caution' | 'Elevated' | 'Critical' | 'Imminent';
  components: {
    hfScore: number;
    liqProbScore: number;
    ltvScore: number;
    oracleScore: number;
    stressScore: number;
  };
  explanation: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hfToScore(hf: number): number {
  if (hf >= 2.0) return 0;
  if (hf >= 1.5) return 15;
  if (hf >= 1.3) return 35;
  if (hf >= 1.15) return 55;
  if (hf >= 1.05) return 75;
  if (hf >= 1.0) return 90;
  return 100;
}

function ltvToScore(ltv: number): number {
  if (ltv <= 0.3) return 0;
  if (ltv <= 0.5) return 15;
  if (ltv <= 0.65) return 35;
  if (ltv <= 0.75) return 55;
  if (ltv <= 0.85) return 75;
  return 95;
}

function liqProbToScore(prob: number): number {
  return clamp(prob * 100, 0, 100);
}

function oracleToScore(divergences: OracleDivergence[]): number {
  if (divergences.length === 0) return 0;
  const maxBps = Math.max(...divergences.map((d) => d.maxSpreadBps));
  if (maxBps < 10) return 0;
  if (maxBps < 50) return 15;
  if (maxBps < 100) return 30;
  if (maxBps < 200) return 50;
  if (maxBps < 500) return 70;
  return 90;
}

function stressToScore(results: StressResult[]): number {
  if (results.length === 0) return 0;
  const liquidatedCount = results.filter((r) => r.liquidated).length;
  const ratio = liquidatedCount / results.length;
  return clamp(ratio * 100, 0, 100);
}

export function computeRiskScore(input: RiskScoreInput): RiskScoreResult {
  const hfScore = input.snapshot ? hfToScore(input.snapshot.healthFactor) : 25;
  const ltvScore = input.snapshot ? ltvToScore(input.snapshot.ltv) : 25;
  const liqProbScore = input.monteCarlo ? liqProbToScore(input.monteCarlo.liquidationProbability) : 10;
  const oracleScore = input.divergences ? oracleToScore(input.divergences) : 5;
  const stressScore = input.stressResults ? stressToScore(input.stressResults) : 10;

  // Weighted average
  const score = Math.round(
    hfScore * 0.30 +
    ltvScore * 0.20 +
    liqProbScore * 0.25 +
    oracleScore * 0.10 +
    stressScore * 0.15
  );

  let tier: RiskScoreResult['tier'];
  if (score <= 25) tier = 'Safe';
  else if (score <= 50) tier = 'Caution';
  else if (score <= 75) tier = 'Elevated';
  else if (score <= 90) tier = 'Critical';
  else tier = 'Imminent';

  const explanation = [
    `Health Factor contributes ${hfScore}/100`,
    `LTV ratio contributes ${ltvScore}/100`,
    `Liquidation probability contributes ${liqProbScore}/100`,
    `Oracle divergence contributes ${oracleScore}/100`,
    `Stress test resilience contributes ${stressScore}/100`,
  ].join('. ');

  return {
    score: clamp(score, 0, 100),
    tier,
    components: { hfScore, liqProbScore, ltvScore, oracleScore, stressScore },
    explanation,
  };
}
