'use client';

import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { SUPPORTED_CHAINS } from './chains';

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [injected()],
  transports: {
    1: http('https://eth.llamarpc.com'),
    42161: http('https://arb1.arbitrum.io/rpc'),
    10: http('https://mainnet.optimism.io'),
    8453: http('https://mainnet.base.org'),
    137: http('https://polygon-rpc.com'),
  },
});
