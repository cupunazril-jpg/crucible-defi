// ============================================================
// Stress Test Engine
// ============================================================
//
// Applies a curated catalog of historical and hypothetical
// market-shock scenarios to a lending position and reports
// whether the position would have survived.
//
// A "shock" is a multiplier applied to the spot price of one or
// more assets (e.g. ETH × 0.45 ⇒ -55% drawdown). The engine
// re-runs the Health Factor math under those prices and surfaces
// the resulting tier, buffer, and liquidator payout.
//
// The scenarios are intentionally conservative — they correspond
// to the worst single-day to two-week drawdowns each asset has
// historically experienced. They are not predictions.
// ============================================================

import type { LendingPosition, StressResult, StressScenario } from '@/types';
import { assessHealth } from '@/modules/health-factor';

export const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: 'covid-mar-2020',
    name: 'Covid Black Thursday',
    description:
      'ETH dropped roughly 43% in 24 hours, BTC -38%. MakerDAO experienced bad debt because the oracle and liquidator infrastructure failed to keep up.',
    category: 'Historical',
    occurred: '2020-03-12',
    shocks: { WETH: 0.57, ETH: 0.57, WBTC: 0.62, BTC: 0.62, WSTETH: 0.57, CBETH: 0.57, RETH: 0.57 },
  },
  {
    id: 'may-2021-crash',
    name: 'May 2021 Crash',
    description:
      'Cascading liquidations sent ETH from $4,200 to $1,800 in a week (-57%) as overleveraged perp positions unwound across CEXs.',
    category: 'Historical',
    occurred: '2021-05-19',
    shocks: { WETH: 0.43, ETH: 0.43, WBTC: 0.49, BTC: 0.49, WSTETH: 0.43, CBETH: 0.43 },
  },
  {
    id: 'luna-collapse',
    name: 'Terra/Luna Collapse',
    description:
      'LUNA → 0 and UST depeg dragged the broader market down. ETH lost 38% in seven days, BTC -36%, and ARB-style alts -55% or more.',
    category: 'Historical',
    occurred: '2022-05-09',
    shocks: { WETH: 0.62, ETH: 0.62, WBTC: 0.64, BTC: 0.64, ARB: 0.45 },
  },
  {
    id: 'ftx-collapse',
    name: 'FTX Insolvency',
    description:
      'Crypto exchange FTX revealed insolvency and filed for bankruptcy, triggering -25% in BTC/ETH within days and severe alt drawdowns.',
    category: 'Historical',
    occurred: '2022-11-08',
    shocks: { WETH: 0.75, ETH: 0.75, WBTC: 0.74, BTC: 0.74, ARB: 0.55 },
  },
  {
    id: 'banking-crisis-2023',
    name: 'USDC Depeg / SVB Crisis',
    description:
      'USDC briefly traded at $0.87 after Circle disclosed exposure to Silicon Valley Bank. Stablecoin-collateralised positions saw their book value collapse in hours.',
    category: 'Historical',
    occurred: '2023-03-11',
    shocks: { USDC: 0.87, DAI: 0.95 },
  },
  {
    id: 'pectra-fork-uncertainty',
    name: 'Hypothetical: -35% ETH in 48h',
    description:
      'Hypothetical broad-market sell-off where ETH drops 35% in 48 hours and BTC drops 20%. Used to test "ordinary bad week" survivability.',
    category: 'Hypothetical',
    shocks: { WETH: 0.65, ETH: 0.65, WBTC: 0.80, BTC: 0.80 },
  },
  {
    id: 'staking-derivative-depeg',
    name: 'LST Depeg (-12%)',
    description:
      'Hypothetical scenario where wstETH/cbETH/rETH temporarily depeg 12% from ETH due to validator slashing or oracle lag, while ETH spot is flat.',
    category: 'Hypothetical',
    shocks: { WSTETH: 0.88, CBETH: 0.88, RETH: 0.88 },
  },
  {
    id: 'sovereign-debt-crisis',
    name: 'Black Swan: -60% Risk Assets',
    description:
      'A coordinated risk-off event: equities -30%, ETH -60%, BTC -45%, alts -75%. Used as a "do we survive a credit crisis?" stress test.',
    category: 'Black Swan',
    shocks: { WETH: 0.40, ETH: 0.40, WBTC: 0.55, BTC: 0.55, ARB: 0.25, WSTETH: 0.40, CBETH: 0.40 },
  },
  {
    id: 'oracle-failure',
    name: 'Oracle Glitch (-100% briefly)',
    description:
      'A spike in oracle latency causes the protocol to briefly observe a collateral price ~50% below spot. Models a single-block bad print.',
    category: 'Black Swan',
    shocks: { WETH: 0.50, ETH: 0.50, WBTC: 0.50, BTC: 0.50, WSTETH: 0.50, CBETH: 0.50, ARB: 0.50 },
  },
];

const _byId: Map<string, StressScenario> = new Map(
  STRESS_SCENARIOS.map((s) => [s.id, s]),
);

export function getScenario(id: string): StressScenario | undefined {
  return _byId.get(id);
}

/** Run a single stress scenario against a position. */
export function applyScenario(
  position: LendingPosition,
  scenario: StressScenario,
): StressResult {
  const before = assessHealth(position);

  // Compute price overrides as absolute USD prices (current price × shock).
  const overrides: Record<string, number> = {};
  for (const leg of position.collateral) {
    const shock = scenario.shocks[leg.asset.toUpperCase()];
    if (shock !== undefined) overrides[leg.asset] = leg.priceUsd * shock;
  }
  for (const leg of position.debt) {
    const shock = scenario.shocks[leg.asset.toUpperCase()];
    if (shock !== undefined) overrides[leg.asset] = leg.priceUsd * shock;
  }

  const after = assessHealth(position, { priceOverrides: overrides });
  const liquidated = after.healthFactor < 1;
  const collateralLossUsd = Math.max(0, before.collateralUsd - after.collateralUsd);

  // If liquidated, model the liquidator's payout as `bonus × debt`,
  // capped at remaining collateral.
  let liquidatorProfitUsd = 0;
  if (liquidated) {
    const bonus = 0.07;
    liquidatorProfitUsd = Math.min(after.collateralUsd, before.debtUsd * bonus);
  }

  return {
    scenarioId: scenario.id,
    before,
    after,
    collateralLossUsd,
    liquidated,
    liquidatorProfitUsd,
  };
}

/** Run every scenario in the catalog against a position. */
export function applyAllScenarios(position: LendingPosition): StressResult[] {
  return STRESS_SCENARIOS.map((s) => applyScenario(position, s));
}
