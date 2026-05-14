// ============================================================
// Explanation Engine
// ============================================================
//
// Rule-based NLP that converts the numeric risk output into
// plain-English insights a user can read. Mirrors how trading
// terminals annotate price action — "you have N% room before
// liquidation; ETH would need to drop X% in Y days".
//
// Intentionally deterministic so explanations stay identical
// between sessions, which makes them useful for changelogs and
// audit trails.
// ============================================================

import type { HealthSnapshot, LendingPosition, MonteCarloResult } from '@/types';
import { formatHealthFactor, formatPercent, formatUsd } from '@/utils';

export interface Explanation {
  headline: string;
  bullets: string[];
}

export function explainSnapshot(
  position: LendingPosition,
  snap: HealthSnapshot,
): Explanation {
  const bullets: string[] = [];
  const headline = headlineFor(snap);

  bullets.push(
    `Health Factor is **${formatHealthFactor(snap.healthFactor)}** with ` +
      `${formatUsd(snap.collateralUsd, { compact: true })} collateral against ` +
      `${formatUsd(snap.debtUsd, { compact: true })} debt.`,
  );

  if (snap.healthFactor < 1) {
    bullets.push(
      'Position is **already liquidatable** — bots will close it the next time they crank the protocol.',
    );
  } else if (snap.healthFactor < 1.15) {
    bullets.push(
      'Buffer is critically thin — a routine ' +
        `${formatPercent(snap.liquidationBuffer, 1)} drop in collateral price ` +
        'would trigger liquidation.',
    );
  } else if (snap.healthFactor < 1.5) {
    bullets.push(
      `Position can absorb ${formatPercent(snap.liquidationBuffer, 1)} downside before HF crosses 1. ` +
        'Consider trimming debt or adding collateral before macro events.',
    );
  } else {
    bullets.push(
      `Comfortable buffer — collateral can drop up to ${formatPercent(
        snap.liquidationBuffer,
        1,
      )} before liquidation.`,
    );
  }

  if (snap.liquidationPriceUsd && snap.liquidationPriceUsd > 0) {
    const dominant = position.collateral[0];
    if (dominant) {
      bullets.push(
        `${dominant.asset} liquidation price ≈ **${formatUsd(snap.liquidationPriceUsd)}** ` +
          `(spot ${formatUsd(dominant.priceUsd)}).`,
      );
    }
  }

  bullets.push(
    `Weighted liquidation threshold across collateral is ` +
      `${formatPercent(snap.weightedLiquidationThreshold, 1)}; ` +
      `current LTV is ${formatPercent(snap.ltv, 1)}.`,
  );

  return { headline, bullets };
}

function headlineFor(snap: HealthSnapshot): string {
  switch (snap.tier) {
    case 'Imminent':
      return 'Liquidation imminent';
    case 'Critical':
      return 'Critically thin buffer';
    case 'Elevated':
      return 'Elevated liquidation risk';
    case 'Caution':
      return 'Moderate buffer remaining';
    case 'Safe':
    default:
      return 'Position is comfortably solvent';
  }
}

export function explainMonteCarlo(
  result: MonteCarloResult,
  horizonDays: number,
): Explanation {
  const bullets: string[] = [];

  if (result.liquidationProbability >= 0.5) {
    bullets.push(
      `**${formatPercent(result.liquidationProbability, 1)}** of simulated paths liquidate ` +
        `within ${horizonDays} days — this position is essentially a wager on a benign tape.`,
    );
  } else if (result.liquidationProbability >= 0.15) {
    bullets.push(
      `${formatPercent(result.liquidationProbability, 1)} of paths liquidate in ${horizonDays} days. ` +
        'Plan an automated rebalance or de-leverage trigger.',
    );
  } else if (result.liquidationProbability >= 0.03) {
    bullets.push(
      `${formatPercent(result.liquidationProbability, 1)} liquidation probability over ${horizonDays} days. ` +
        'Acceptable for a managed position, but keep collateral additions ready.',
    );
  } else {
    bullets.push(
      `${formatPercent(result.liquidationProbability, 1)} liquidation probability over ${horizonDays} days — ` +
        'comfortably low under the modelled volatility regime.',
    );
  }

  bullets.push(
    `Value-at-Risk (95%): ${formatPercent(result.var95, 1)} of collateral. ` +
      `Conditional VaR: ${formatPercent(result.cvar95, 1)}.`,
  );

  if (result.daysToLiquidation.length > 0) {
    const median =
      [...result.daysToLiquidation].sort((a, b) => a - b)[
        Math.floor(result.daysToLiquidation.length / 2)
      ];
    bullets.push(
      `Median days-to-liquidation across affected paths is **${median}** days.`,
    );
  }

  bullets.push(
    `Expected loss across all paths is ${formatPercent(result.expectedLossFraction, 2)} ` +
      'of collateral (includes only liquidator-bonus losses, not slippage).',
  );

  let headline: string;
  if (result.liquidationProbability >= 0.5) headline = 'High likelihood of liquidation';
  else if (result.liquidationProbability >= 0.15) headline = 'Elevated liquidation risk';
  else if (result.liquidationProbability >= 0.03) headline = 'Modest liquidation risk';
  else headline = 'Liquidation risk is contained';

  return { headline, bullets };
}
