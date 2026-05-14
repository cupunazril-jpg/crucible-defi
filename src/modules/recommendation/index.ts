// ============================================================
// Recommendation Engine
// ============================================================
//
// Rule-based, deterministic recommendation generator. Reads the
// position state plus the protocol catalog and emits ranked,
// actionable suggestions like:
//
//   - "Repay $X to bring HF to Y"
//   - "Move from Aave V3 to Morpho Blue to save N bps on borrow rate"
//   - "Add $Z of wstETH to absorb a Black Thursday-style shock"
//
// Suggestions are sorted by `priority` then `hfDelta` so the most
// urgent + most impactful action surfaces first.
// ============================================================

import type {
  LendingPosition,
  PositionLeg,
  ProtocolParams,
  Recommendation,
  RiskTier,
} from '@/types';
import { assessHealth } from '@/modules/health-factor';
import { PROTOCOL_PARAMS, paramFor } from '@/modules/protocol-params';
import { formatPercent, formatUsd, uid } from '@/utils';

const TARGET_HF_BY_TIER: Record<RiskTier, number> = {
  Imminent: 1.6,
  Critical: 1.4,
  Elevated: 1.3,
  Caution: 1.25,
  Safe: 1.2,
};

export function generateRecommendations(
  position: LendingPosition,
): Recommendation[] {
  const snap = assessHealth(position);
  const out: Recommendation[] = [];

  // ---- 1. Repay-to-target ------------------------------------------
  const targetHF = TARGET_HF_BY_TIER[snap.tier];
  if (snap.debtUsd > 0 && snap.healthFactor < targetHF) {
    // Solve for amount to repay so that liqPower / (debt - r) = targetHF
    //   ⇒ r = debt - liqPower / targetHF
    const r = Math.max(0, snap.debtUsd - snap.liquidationPower / targetHF);
    if (r > 0) {
      out.push({
        id: uid(),
        positionId: position.id,
        kind: 'repay',
        title: `Repay ${formatUsd(r, { compact: true })} to lift HF to ${targetHF.toFixed(
          2,
        )}`,
        body:
          `Closing ${formatUsd(r, { compact: true })} of debt brings the Health Factor ` +
          `from ${snap.healthFactor.toFixed(2)} to ${targetHF.toFixed(2)}. ` +
          'This is the most direct lever to de-risk a thin position.',
        hfDelta: targetHF - snap.healthFactor,
        confidence: 0.95,
        priority: snap.healthFactor < 1.2 ? 'high' : 'medium',
      });
    }
  }

  // ---- 2. Add collateral ------------------------------------------
  if (snap.debtUsd > 0 && snap.healthFactor < targetHF) {
    // ΔliqPower needed = targetHF * debt - liqPower
    // Adding collateral C at weighted LT W contributes W * C to liqPower.
    const wlt = snap.weightedLiquidationThreshold || 0.75;
    const need = Math.max(0, targetHF * snap.debtUsd - snap.liquidationPower) / wlt;
    if (need > 0) {
      out.push({
        id: uid(),
        positionId: position.id,
        kind: 'add-collateral',
        title: `Add ~${formatUsd(need, { compact: true })} of collateral`,
        body:
          `Topping up roughly ${formatUsd(need, { compact: true })} more collateral ` +
          `(at weighted LT ${formatPercent(wlt, 1)}) restores the Health Factor to ` +
          `${targetHF.toFixed(2)} without touching debt — useful if rates are favourable ` +
          'and you want to keep leverage.',
        hfDelta: targetHF - snap.healthFactor,
        confidence: 0.9,
        priority: snap.healthFactor < 1.15 ? 'high' : 'medium',
      });
    }
  }

  // ---- 3. Migrate to cheaper / safer protocol ----------------------
  const migrate = bestMigrationTarget(position);
  if (migrate) {
    out.push(migrate);
  }

  // ---- 4. Reduce leverage of weakest leg --------------------------
  const weakest = weakestCollateralLeg(position);
  if (weakest && snap.healthFactor < 1.5) {
    out.push({
      id: uid(),
      positionId: position.id,
      kind: 'reduce-leverage',
      title: `Trim ${weakest.asset} exposure`,
      body:
        `${weakest.asset} contributes ` +
        `${formatPercent((weakest.amount * weakest.priceUsd) / snap.collateralUsd, 1)} of collateral ` +
        `but its annualised volatility (${formatPercent(weakest.volatility, 0)}) drives the ` +
        'majority of the simulated liquidation paths. Reducing this leg by 25% materially ' +
        'cuts Monte Carlo tail risk.',
      hfDelta: 0.1,
      confidence: 0.7,
      priority: 'medium',
    });
  }

  // ---- 5. Hedge with stable debt-side asset -----------------------
  if (snap.healthFactor < 1.4 && hasStableDebt(position)) {
    out.push({
      id: uid(),
      positionId: position.id,
      kind: 'hedge',
      title: 'Hedge debt with a short collateral perp',
      body:
        'Because the debt is stablecoin and the collateral is volatile, a small short ' +
        'position on the collateral on a perp DEX caps downside without unwinding the loan. ' +
        'Size the hedge to roughly 25% of dominant collateral notional and re-evaluate weekly.',
      hfDelta: 0.05,
      confidence: 0.6,
      priority: 'low',
    });
  }

  // Sort by priority then hfDelta desc.
  const pri = { high: 0, medium: 1, low: 2 } as const;
  out.sort((a, b) => {
    if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
    return b.hfDelta - a.hfDelta;
  });
  return out;
}

function hasStableDebt(p: LendingPosition): boolean {
  return p.debt.some((d) =>
    ['USDC', 'USDT', 'DAI', 'USDC.E', 'USDS'].includes(d.asset.toUpperCase()),
  );
}

function weakestCollateralLeg(p: LendingPosition): PositionLeg | null {
  if (p.collateral.length === 0) return null;
  let worst = p.collateral[0];
  for (let i = 1; i < p.collateral.length; i++) {
    if (p.collateral[i].volatility > worst.volatility) worst = p.collateral[i];
  }
  return worst;
}

interface MigrationCandidate {
  params: ProtocolParams;
  apySavedPerYear: number;
}

function bestMigrationTarget(position: LendingPosition): Recommendation | null {
  // Look at every debt leg, find a different protocol/asset row offering
  // a cheaper borrow rate, and surface the best one.
  let best: MigrationCandidate | null = null;
  for (const debt of position.debt) {
    const current = paramFor(position.protocol, debt.asset);
    const currentApy = current?.borrowApy ?? 0.05;

    for (const candidate of PROTOCOL_PARAMS) {
      if (candidate.slug === position.protocol) continue;
      if (candidate.asset.toUpperCase() !== debt.asset.toUpperCase()) continue;
      if (!candidate.borrowApy) continue;
      const saved = (currentApy - candidate.borrowApy) * debt.amount * debt.priceUsd;
      if (saved <= 0) continue;
      if (!best || saved > best.apySavedPerYear) {
        best = { params: candidate, apySavedPerYear: saved };
      }
    }
  }
  if (!best) return null;
  return {
    id: uid(),
    positionId: position.id,
    kind: 'migrate',
    title: `Migrate debt to ${best.params.name} on ${best.params.chain}`,
    body:
      `${best.params.name} offers a borrow APY of ` +
      `${formatPercent(best.params.borrowApy ?? 0, 2)} on ${best.params.asset}, ` +
      `saving roughly ${formatUsd(best.apySavedPerYear, { compact: true })} per year ` +
      'versus the current position. Migration cost (one-time) typically pays back within ' +
      'a few months at this size.',
    hfDelta: 0,
    confidence: 0.7,
    priority: 'low',
  };
}
