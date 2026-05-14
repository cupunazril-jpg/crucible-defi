// ============================================================
// Crucible — Type Definitions
// ============================================================
//
// All domain types live here so module boundaries stay clean.
// ============================================================

export type Chain = 'ethereum' | 'arbitrum' | 'optimism' | 'polygon' | 'base' | 'avalanche' | 'bsc';

export type ProtocolSlug =
  | 'aave-v3'
  | 'aave-v2'
  | 'compound-v3'
  | 'compound-v2'
  | 'morpho-blue'
  | 'spark'
  | 'maker'
  | 'venus'
  | 'radiant';

export type RiskTier = 'Safe' | 'Caution' | 'Elevated' | 'Critical' | 'Imminent';

// --------------------------------------------------------------
// Market & protocol parameters
// --------------------------------------------------------------

export interface ProtocolParams {
  slug: ProtocolSlug;
  name: string;
  chain: Chain;
  /** % of collateral counted towards borrow power (e.g. 0.80) */
  ltv: number;
  /** % at which position becomes liquidatable (e.g. 0.825) */
  liquidationThreshold: number;
  /** % bonus that liquidator earns from collateral (e.g. 0.05) */
  liquidationBonus: number;
  /** % of debt the liquidator can repay in a single call (e.g. 0.50) */
  closeFactor: number;
  /** TVL in USD across the protocol (for context). */
  tvlUsd: number;
  /** Borrow APY for this asset, last snapshot (e.g. 0.052 = 5.2%). */
  borrowApy?: number;
  /** Supply APY for this asset, last snapshot. */
  supplyApy?: number;
  /** Asset symbol this row describes (e.g. USDC). */
  asset: string;
  /** Whether the protocol uses an isolation mode for this asset. */
  isolated?: boolean;
  /** Number of audits / age in years etc — used for maturity scoring. */
  maturity: 'Mature' | 'Established' | 'Emerging' | 'Experimental';
}

// --------------------------------------------------------------
// User-defined lending positions
// --------------------------------------------------------------

export interface PositionLeg {
  asset: string;
  amount: number;
  priceUsd: number;
  /** Volatility estimate σ (annualised, e.g. 0.6 = 60%). */
  volatility: number;
}

export interface LendingPosition {
  id: string;
  label: string;
  protocol: ProtocolSlug;
  chain: Chain;
  collateral: PositionLeg[];
  debt: PositionLeg[];
  /** Last update timestamp (ms). */
  updatedAt: number;
}

// --------------------------------------------------------------
// Risk math output
// --------------------------------------------------------------

export interface HealthSnapshot {
  positionId: string;
  collateralUsd: number;
  debtUsd: number;
  borrowPower: number;
  liquidationPower: number;
  ltv: number;
  weightedLiquidationThreshold: number;
  /** HF = liquidationPower / debtUsd. < 1 ⇒ liquidatable. */
  healthFactor: number;
  /** Maximum % drop in collateral value before HF < 1. */
  liquidationBuffer: number;
  /** Price of a single dominant collateral at which HF = 1. */
  liquidationPriceUsd: number | null;
  tier: RiskTier;
}

// --------------------------------------------------------------
// Monte Carlo liquidation simulation
// --------------------------------------------------------------

export interface MonteCarloInput {
  position: LendingPosition;
  /** Number of price paths to simulate. */
  paths: number;
  /** Time horizon in days. */
  horizonDays: number;
  /** Optional drift override (annualised log-return). */
  drift?: number;
  /** Optional volatility override (annualised). */
  volatility?: number;
}

export interface MonteCarloResult {
  /** Probability of HF dropping below 1.0 within horizon. */
  liquidationProbability: number;
  /** Probability of HF dropping below 0.95 within horizon. */
  insolvencyProbability: number;
  /** Estimated loss as fraction of collateral if liquidated. */
  expectedLossFraction: number;
  /** Mean final collateral price across paths (USD). */
  meanFinalCollateralUsd: number;
  /** Value-at-risk (5th percentile loss as fraction). */
  var95: number;
  /** Conditional VaR (mean loss in worst 5%). */
  cvar95: number;
  /** Median price path for charting (length = horizonDays + 1). */
  medianPath: number[];
  /** 5th percentile path. */
  p5Path: number[];
  /** 95th percentile path. */
  p95Path: number[];
  /** Histogram of final-day price (50 bins). */
  histogram: { x: number; count: number }[];
  /** Distribution of "days until liquidation" for paths that liquidated. */
  daysToLiquidation: number[];
}

// --------------------------------------------------------------
// Stress test scenarios
// --------------------------------------------------------------

export interface StressScenario {
  id: string;
  name: string;
  description: string;
  /** Per-asset price shock multipliers (e.g. {'ETH': 0.45} ⇒ -55%). */
  shocks: Record<string, number>;
  category: 'Historical' | 'Hypothetical' | 'Black Swan';
  /** Approximate event date for historical scenarios. */
  occurred?: string;
}

export interface StressResult {
  scenarioId: string;
  before: HealthSnapshot;
  after: HealthSnapshot;
  /** Collateral value lost in USD. */
  collateralLossUsd: number;
  /** Whether the position would be liquidated under this scenario. */
  liquidated: boolean;
  /** Liquidator profit captured (USD), if liquidated. */
  liquidatorProfitUsd: number;
}

// --------------------------------------------------------------
// Recommendation engine
// --------------------------------------------------------------

export interface Recommendation {
  id: string;
  positionId: string;
  kind: 'repay' | 'add-collateral' | 'migrate' | 'reduce-leverage' | 'hedge';
  title: string;
  body: string;
  /** Estimated improvement in HF if applied. */
  hfDelta: number;
  /** Confidence 0-1. */
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  /** Optional USD amount the user should act on (e.g. amount to repay or add). */
  amountUsd?: number;
  /** Optional target HF the action is sized for. */
  targetHf?: number;
  /** Optional protocol slug the user should migrate to. */
  toProtocol?: ProtocolSlug;
}

// --------------------------------------------------------------
// Oracle divergence
// --------------------------------------------------------------

export interface OracleQuote {
  asset: string;
  source: string;
  priceUsd: number;
  updatedAt: number;
}

export interface OracleDivergence {
  asset: string;
  median: number;
  maxSpreadBps: number;
  quotes: OracleQuote[];
  /** Risk tier derived from spread. */
  tier: RiskTier;
}

// --------------------------------------------------------------
// Liquidation history events
// --------------------------------------------------------------

export interface LiquidationEvent {
  id: string;
  protocol: ProtocolSlug;
  chain: Chain;
  timestamp: number;
  borrower: string;
  collateralAsset: string;
  debtAsset: string;
  collateralLiquidatedUsd: number;
  debtRepaidUsd: number;
  liquidatorBonusUsd: number;
}
