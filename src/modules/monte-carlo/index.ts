// ============================================================
// Monte Carlo Liquidation Engine
// ============================================================
//
// Simulates a Geometric Brownian Motion (GBM) price process for
// the dominant collateral asset of a lending position and counts
// the fraction of paths in which the Health Factor crosses below
// 1.0 at any point during the horizon.
//
// GBM:  S_{t+dt} = S_t · exp( (μ - σ²/2) · dt + σ · √dt · Z )
//
// Outputs:
//   - liquidationProbability — P(min_t HF_t < 1)
//   - insolvencyProbability  — P(min_t HF_t < 0.95)
//   - expectedLossFraction   — average loss (fraction of collateral)
//   - VaR95 / CVaR95         — tail risk metrics
//   - p5 / median / p95 paths — for the price-cone chart
//   - histogram              — final-day collateral price distribution
//   - daysToLiquidation      — for paths that liquidated, the day index
//
// Designed to be deterministic when a seed is provided so that
// charts don't jitter between renders.
// ============================================================

import type {
  HealthSnapshot,
  LendingPosition,
  MonteCarloInput,
  MonteCarloResult,
} from '@/types';
import { assessHealth, dominantCollateral } from '@/modules/health-factor';
import { mean, mulberry32, percentile, seededNormal } from '@/utils';

const DEFAULT_DRIFT_BY_ASSET: Record<string, number> = {
  WETH: 0.10,
  ETH: 0.10,
  WBTC: 0.08,
  BTC: 0.08,
  WSTETH: 0.09,
  CBETH: 0.09,
  RETH: 0.09,
  ARB: 0.02,
  USDC: 0,
  USDT: 0,
  DAI: 0,
};

const DEFAULT_VOL_BY_ASSET: Record<string, number> = {
  WETH: 0.65,
  ETH: 0.65,
  WBTC: 0.55,
  BTC: 0.55,
  WSTETH: 0.65,
  CBETH: 0.65,
  RETH: 0.65,
  ARB: 0.95,
  USDC: 0.02,
  USDT: 0.02,
  DAI: 0.02,
};

function defaultDrift(asset: string): number {
  return DEFAULT_DRIFT_BY_ASSET[asset.toUpperCase()] ?? 0.04;
}

function defaultVol(asset: string): number {
  return DEFAULT_VOL_BY_ASSET[asset.toUpperCase()] ?? 0.7;
}

/**
 * Single GBM step. dt expressed in years.
 */
function gbmStep(
  price: number,
  mu: number,
  sigma: number,
  dt: number,
  rng: () => number,
): number {
  const z = seededNormal(rng, 0, 1);
  const exponent = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z;
  return price * Math.exp(exponent);
}

/**
 * Re-evaluate HF as if the dominant asset's price moved to `priceUsd`,
 * keeping every other asset price constant.
 *
 * We hand-roll this instead of calling assessHealth in the inner loop
 * because the inner loop runs N × T times and any allocation matters.
 */
function hfAtDominantPrice(
  position: LendingPosition,
  baseSnap: HealthSnapshot,
  dominantAsset: string,
  dominantAmount: number,
  newPrice: number,
  dominantLT: number,
  otherLP: number,
  otherCollateralUsd: number,
  debtUsd: number,
): { hf: number; collateralUsd: number } {
  void position;
  void baseSnap;
  void dominantAsset;
  const newDominantUsd = dominantAmount * newPrice;
  const liqPower = newDominantUsd * dominantLT + otherLP;
  const hf = debtUsd > 0 ? liqPower / debtUsd : Infinity;
  return {
    hf,
    collateralUsd: newDominantUsd + otherCollateralUsd,
  };
}

export interface SimulateOptions {
  seed?: number;
}

export function runMonteCarlo(
  input: MonteCarloInput,
  opts: SimulateOptions = {},
): MonteCarloResult {
  const { position, paths, horizonDays } = input;
  const dominant = dominantCollateral(position);
  const baseSnap = assessHealth(position);

  if (!dominant || baseSnap.debtUsd === 0) {
    // Trivial — no debt or no collateral. Return a benign result.
    return emptyResult(horizonDays, baseSnap.collateralUsd);
  }

  const mu = input.drift ?? defaultDrift(dominant.asset);
  const sigma = input.volatility ?? dominant.volatility ?? defaultVol(dominant.asset);
  const dt = 1 / 365;
  const seed = opts.seed ?? 0xC0FFEE;
  const rng = mulberry32(seed);

  // Pre-compute "everything except the dominant asset" so the inner
  // loop only re-prices the dominant collateral leg.
  const dominantLT = lookupLT(position, dominant.asset);
  const otherCollateralUsd = baseSnap.collateralUsd - dominant.amount * dominant.priceUsd;
  const otherLP = baseSnap.liquidationPower - dominant.amount * dominant.priceUsd * dominantLT;

  const finalPrices: number[] = new Array(paths);
  const minHF: number[] = new Array(paths);
  const liquidatedAtDay: number[] = [];
  const losses: number[] = new Array(paths);

  const pathSamples: number[][] = [];
  const sampleEvery = Math.max(1, Math.floor(paths / 200));

  for (let p = 0; p < paths; p++) {
    let price = dominant.priceUsd;
    let lowestHF = Infinity;
    let firstLiquidationDay = -1;
    let lossFraction = 0;
    const samplePath = p % sampleEvery === 0 ? [price] : null;

    for (let day = 1; day <= horizonDays; day++) {
      price = gbmStep(price, mu, sigma, dt, rng);
      const { hf, collateralUsd } = hfAtDominantPrice(
        position,
        baseSnap,
        dominant.asset,
        dominant.amount,
        price,
        dominantLT,
        otherLP,
        otherCollateralUsd,
        baseSnap.debtUsd,
      );
      if (hf < lowestHF) lowestHF = hf;
      if (hf < 1 && firstLiquidationDay < 0) {
        firstLiquidationDay = day;
        // Liquidator may seize debt × (1 + bonus) worth of collateral.
        // We model loss as that bonus on the seized notional.
        const lossUsd = baseSnap.debtUsd * 0.07; // typical 5-10% liquidator bonus
        lossFraction = collateralUsd > 0 ? lossUsd / collateralUsd : 0;
      }
      if (samplePath) samplePath.push(price);
    }

    finalPrices[p] = price;
    minHF[p] = lowestHF;
    losses[p] = lossFraction;
    if (firstLiquidationDay > 0) liquidatedAtDay.push(firstLiquidationDay);
    if (samplePath) pathSamples.push(samplePath);
  }

  const liqCount = liquidatedAtDay.length;
  const liquidationProbability = liqCount / paths;
  const insolvencyProbability = minHF.filter((h) => h < 0.95).length / paths;
  const expectedLossFraction = mean(losses);

  // VaR / CVaR on final-day P&L (collateral fraction)
  const baseCollateralUsd = baseSnap.collateralUsd;
  const finalPnLFrac = finalPrices.map(
    (p) => ((p - dominant.priceUsd) * dominant.amount) / baseCollateralUsd,
  );
  const sortedLoss = finalPnLFrac.slice().sort((a, b) => a - b);
  const var95 = -percentile(sortedLoss, 0.05);
  const worst5 = sortedLoss.slice(0, Math.max(1, Math.floor(0.05 * paths)));
  const cvar95 = -mean(worst5);

  // Aggregate p5 / median / p95 paths from the samples we collected.
  const horizonPoints = horizonDays + 1;
  const p5Path: number[] = [];
  const medianPath: number[] = [];
  const p95Path: number[] = [];
  for (let t = 0; t < horizonPoints; t++) {
    const xs = pathSamples.map((path) => path[t]).filter((x) => x !== undefined);
    xs.sort((a, b) => a - b);
    p5Path.push(percentile(xs, 0.05));
    medianPath.push(percentile(xs, 0.5));
    p95Path.push(percentile(xs, 0.95));
  }

  // Histogram: 50 bins over final-day prices.
  const sortedFinal = finalPrices.slice().sort((a, b) => a - b);
  const lo = sortedFinal[0];
  const hi = sortedFinal[sortedFinal.length - 1];
  const bins = 50;
  const step = (hi - lo) / bins || 1;
  const histogram: { x: number; count: number }[] = [];
  for (let b = 0; b < bins; b++) {
    histogram.push({ x: lo + step * (b + 0.5), count: 0 });
  }
  for (const fp of finalPrices) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((fp - lo) / step)));
    histogram[idx].count += 1;
  }

  return {
    liquidationProbability,
    insolvencyProbability,
    expectedLossFraction,
    meanFinalCollateralUsd:
      mean(finalPrices) * dominant.amount + otherCollateralUsd,
    var95: Math.max(0, var95),
    cvar95: Math.max(0, cvar95),
    medianPath,
    p5Path,
    p95Path,
    histogram,
    daysToLiquidation: liquidatedAtDay,
  };
}

function lookupLT(position: LendingPosition, asset: string): number {
  // Local proxy — we re-compute the snapshot anyway so just call into
  // assessHealth with a tiny override and read back the weighted LT.
  // For speed we inline the same defaults as assessHealth.
  const a = asset.toUpperCase();
  if (['USDC', 'USDT', 'DAI', 'USDC.E', 'USDS'].includes(a)) return 0.80;
  if (['WETH', 'ETH'].includes(a)) return 0.83;
  if (['WBTC', 'BTC'].includes(a)) return 0.78;
  if (['WSTETH', 'CBETH', 'RETH'].includes(a)) return 0.77;
  if (['ARB'].includes(a)) return 0.60;
  if (['BNB'].includes(a)) return 0.70;
  void position;
  return 0.55;
}

function emptyResult(horizonDays: number, baseCollateralUsd: number): MonteCarloResult {
  const path = Array.from({ length: horizonDays + 1 }, () => 0);
  return {
    liquidationProbability: 0,
    insolvencyProbability: 0,
    expectedLossFraction: 0,
    meanFinalCollateralUsd: baseCollateralUsd,
    var95: 0,
    cvar95: 0,
    medianPath: path,
    p5Path: path,
    p95Path: path,
    histogram: [],
    daysToLiquidation: [],
  };
}
