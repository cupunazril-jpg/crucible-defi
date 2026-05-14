import { defineChain } from 'viem';

export const ethereum = defineChain({
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth', 'https://ethereum.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
});

export const arbitrum = defineChain({
  id: 42161,
  name: 'Arbitrum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum', 'https://arbitrum.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  },
});

export const optimism = defineChain({
  id: 10,
  name: 'Optimism',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism', 'https://optimism.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
  },
});

export const base = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org', 'https://rpc.ankr.com/base', 'https://base.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
});

export const polygon = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon', 'https://polygon.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://polygonscan.com' },
  },
});

export const SUPPORTED_CHAINS = [ethereum, arbitrum, optimism, base, polygon] as const;

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  137: 'Polygon',
};

export const CHAIN_NATIVE_SYMBOL: Record<number, string> = {
  1: 'ETH',
  42161: 'ETH',
  10: 'ETH',
  8453: 'ETH',
  137: 'MATIC',
};

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_NAMES;
}
