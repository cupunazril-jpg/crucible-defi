// ============================================================
// Health Factor Engine
// ============================================================
//
// Computes per-position credit health using the same arithmetic
// the major money markets use on-chain:
//
//   borrowPower         = Σ (collateral_i × price_i × LTV_i)
//   liquidationPower    = Σ (collateral_i × price_i × LT_i)
//   debtValue           = Σ (debt_j × price_j)
//   HF                  = liquidationPower / debtValue
//
// HF < 1 ⇒ the position is liquidatable. HF ≥ 1 means the
// position is solvent at current oracle prices.
//
// We also compute:
//   - liquidationBuffer: % drop the dominant collateral can take
//     before HF crosses 1.0. This is the "how much room do I
//     have left" number a user actually cares about.
//   - liquidationPriceUsd: the dollar price of the dominant
//     collateral asset that triggers liquidation, holding all
//     other inputs constant.
// ============================================================

import type {
  HealthSnapshot,
  LendingPosition,
  PositionLeg,
  ProtocolParams,
  RiskTier,
} from '@/types';
import { clamp } from '@/utils';
import { paramFor } from '@/modules/protocol-params';

function legUsd(leg: PositionLeg): number {
  return leg.amount * leg.priceUsd;
}

function tierFromHealthFactor(hf: number): RiskTier {
  if (!Number.isFinite(hf)) return 'Safe';
  if (hf < 1.0) return 'Imminent';
  if (hf < 1.15) return 'Critical';
  if (hf < 1.35) return 'Elevated';
  if (hf < 1.75) return 'Caution';
  return 'Safe';
}

export interface AssessOptions {
  /** Override price for a specific asset (used by stress scenarios). */
  priceOverrides?: Record<string, number>;
}

/**
 * Build a `HealthSnapshot` for a position by reading per-asset
 * parameters from the protocol catalog.
 *
 * If a price override is supplied the override is used for both
 * collateral and debt valuation.
 */
export function assessHealth(
  position: LendingPosition,
  options: AssessOptions = {},
): HealthSnapshot {
  const overrides = options.priceOverrides ?? {};
  const priceOf = (leg: PositionLeg) =>
    overrides[leg.asset] !== undefined ? overrides[leg.asset] : leg.priceUsd;

  let collateralUsd = 0;
  let borrowPower = 0;
  let liquidationPower = 0;
  let weightedLtSum = 0;
  let weightedLtvSum = 0;

  for (const leg of position.collateral) {
    const params = paramFor(position.protocol, leg.asset);
    const ltv = params?.ltv ?? defaultLtv(leg.asset);
    const lt = params?.liquidationThreshold ?? defaultLt(leg.asset);
    const px = priceOf(leg);
    const usd = leg.amount * px;
    collateralUsd += usd;
    borrowPower += usd * ltv;
    liquidationPower += usd * lt;
    weightedLtSum += usd * lt;
    weightedLtvSum += usd * ltv;
  }

  let debtUsd = 0;
  for (const leg of position.debt) {
    debtUsd += leg.amount * priceOf(leg);
  }

  const healthFactor = debtUsd > 0 ? liquidationPower / debtUsd : Infinity;
  const ltv = collateralUsd > 0 ? debtUsd / collateralUsd : 0;
  const weightedLiquidationThreshold =
    collateralUsd > 0 ? weightedLtSum / collateralUsd : 0;
  const _weightedLtv = collateralUsd > 0 ? weightedLtvSum / collateralUsd : 0;
  void _weightedLtv;

  // % collateral drop until HF = 1: liqPower * (1 - x) = debt
  //   ⇒ x = 1 - (debt / liqPower)
  const liquidationBuffer =
    liquidationPower > 0 ? clamp(1 - debtUsd / liquidationPower, -1, 1) : 0;

  // Liquidation price of dominant collateral asset
  const dominant = dominantCollateral(position);
  let liquidationPriceUsd: number | null = null;
  if (dominant && debtUsd > 0) {
    const params = paramFor(position.protocol, dominant.asset);
    const lt = params?.liquidationThreshold ?? defaultLt(dominant.asset);

    // liquidationPower of everything else (non-dominant) at current prices:
    const otherLp = position.collateral
      .filter((c) => c.asset !== dominant.asset)
      .reduce((sum, c) => {
        const p = paramFor(position.protocol, c.asset);
        const _lt = p?.liquidationThreshold ?? defaultLt(c.asset);
        return sum + c.amount * priceOf(c) * _lt;
      }, 0);

    // Solve for the dominant-asset price that makes HF = 1:
    //   amount * P * lt + otherLp = debt
    const numerator = debtUsd - otherLp;
    if (dominant.amount > 0 && lt > 0 && numerator > 0) {
      liquidationPriceUsd = numerator / (dominant.amount * lt);
    } else {
      liquidationPriceUsd = 0;
    }
  }

  return {
    positionId: position.id,
    collateralUsd,
    debtUsd,
    borrowPower,
    liquidationPower,
    ltv,
    weightedLiquidationThreshold,
    healthFactor,
    liquidationBuffer,
    liquidationPriceUsd,
    tier: tierFromHealthFactor(healthFactor),
  };
}

/** Largest USD-weighted collateral leg, used for liquidation-price math. */
export function dominantCollateral(position: LendingPosition): PositionLeg | null {
  if (position.collateral.length === 0) return null;
  let best: PositionLeg = position.collateral[0];
  let bestUsd = legUsd(best);
  for (let i = 1; i < position.collateral.length; i++) {
    const usd = legUsd(position.collateral[i]);
    if (usd > bestUsd) {
      best = position.collateral[i];
      bestUsd = usd;
    }
  }
  return best;
}

// --- What-if scenarios ----------------------------------------------

/**
 * Recompute the health snapshot with the dominant collateral
 * price moved by `deltaPct` (e.g. -0.25 = -25%).
 */
export function healthAtPriceDelta(
  position: LendingPosition,
  deltaPct: number,
): HealthSnapshot {
  const dominant = dominantCollateral(position);
  if (!dominant) return assessHealth(position);
  const newPrice = dominant.priceUsd * (1 + deltaPct);
  return assessHealth(position, {
    priceOverrides: { [dominant.asset]: newPrice },
  });
}

/**
 * Build an array of (deltaPct, hf, collateralUsd, debtUsd) snapshots
 * across a price range. Used to render the HF curve on the position
 * detail page.
 */
export function buildHealthCurve(
  position: LendingPosition,
  range = 0.6,
  steps = 41,
): Array<{ delta: number; hf: number; collateralUsd: number }> {
  const out: Array<{ delta: number; hf: number; collateralUsd: number }> = [];
  for (let i = 0; i < steps; i++) {
    const delta = -range + (2 * range * i) / (steps - 1);
    const snap = healthAtPriceDelta(position, delta);
    out.push({
      delta,
      hf: snap.healthFactor,
      collateralUsd: snap.collateralUsd,
    });
  }
  return out;
}

// --- Reasonable defaults for unknown protocol/asset rows ------------

function defaultLtv(asset: string): number {
  const a = asset.toUpperCase();
  if (['USDC', 'USDT', 'DAI', 'USDC.E', 'USDS'].includes(a)) return 0.77;
  if (['WETH', 'ETH'].includes(a)) return 0.80;
  if (['WBTC', 'BTC'].includes(a)) return 0.73;
  if (['WSTETH', 'CBETH', 'RETH'].includes(a)) return 0.74;
  return 0.50;
}

function defaultLt(asset: string): number {
  const a = asset.toUpperCase();
  if (['USDC', 'USDT', 'DAI', 'USDC.E', 'USDS'].includes(a)) return 0.80;
  if (['WETH', 'ETH'].includes(a)) return 0.83;
  if (['WBTC', 'BTC'].includes(a)) return 0.78;
  if (['WSTETH', 'CBETH', 'RETH'].includes(a)) return 0.77;
  return 0.55;
}

/** Convenience — protocol parameters lookup re-exported. */
export type { ProtocolParams };
