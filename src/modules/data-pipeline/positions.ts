// ============================================================
// Sample Position Catalog
// ============================================================
//
// Hard-coded reference positions used for the demo experience.
// Each position is realistic — sized like an actual on-chain
// position, with current prices baked in. Users can clone any
// of these and edit them in the Position Editor.
// ============================================================

import type { LendingPosition } from '@/types';

export const SAMPLE_POSITIONS: LendingPosition[] = [
  {
    id: 'demo-eth-usdc-aave',
    label: '5× ETH long on Aave V3',
    protocol: 'aave-v3',
    chain: 'ethereum',
    collateral: [
      { asset: 'WETH', amount: 50, priceUsd: 2_650, volatility: 0.65 },
    ],
    debt: [{ asset: 'USDC', amount: 95_000, priceUsd: 1.0, volatility: 0.02 }],
    updatedAt: Date.now(),
  },
  {
    id: 'demo-wsteth-eth-morpho',
    label: 'wstETH looped against ETH on Morpho Blue',
    protocol: 'morpho-blue',
    chain: 'ethereum',
    collateral: [
      { asset: 'wstETH', amount: 120, priceUsd: 3_080, volatility: 0.66 },
    ],
    debt: [{ asset: 'WETH', amount: 280, priceUsd: 2_650, volatility: 0.65 }],
    updatedAt: Date.now(),
  },
  {
    id: 'demo-mixed-collateral-spark',
    label: 'Mixed-collateral DAI loan on Spark',
    protocol: 'spark',
    chain: 'ethereum',
    collateral: [
      { asset: 'WETH', amount: 8, priceUsd: 2_650, volatility: 0.65 },
      { asset: 'WBTC', amount: 0.5, priceUsd: 61_500, volatility: 0.55 },
    ],
    debt: [{ asset: 'DAI', amount: 35_000, priceUsd: 1.0, volatility: 0.02 }],
    updatedAt: Date.now(),
  },
  {
    id: 'demo-arb-stable-aave',
    label: 'ARB-collateralised USDC short on Aave V3',
    protocol: 'aave-v3',
    chain: 'arbitrum',
    collateral: [
      { asset: 'ARB', amount: 80_000, priceUsd: 0.72, volatility: 0.95 },
    ],
    debt: [{ asset: 'USDC', amount: 25_000, priceUsd: 1.0, volatility: 0.02 }],
    updatedAt: Date.now(),
  },
  {
    id: 'demo-btc-compound',
    label: 'WBTC vs WETH on Compound V3',
    protocol: 'compound-v3',
    chain: 'ethereum',
    collateral: [
      { asset: 'WBTC', amount: 2.4, priceUsd: 61_500, volatility: 0.55 },
    ],
    debt: [{ asset: 'WETH', amount: 35, priceUsd: 2_650, volatility: 0.65 }],
    updatedAt: Date.now(),
  },
  {
    id: 'demo-maker-cdp',
    label: 'Old-school MakerDAO CDP',
    protocol: 'maker',
    chain: 'ethereum',
    collateral: [
      { asset: 'WETH', amount: 250, priceUsd: 2_650, volatility: 0.65 },
    ],
    debt: [{ asset: 'DAI', amount: 320_000, priceUsd: 1.0, volatility: 0.02 }],
    updatedAt: Date.now(),
  },
];

export function findSample(id: string): LendingPosition | undefined {
  return SAMPLE_POSITIONS.find((p) => p.id === id);
}
