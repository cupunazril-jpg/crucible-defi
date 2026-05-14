'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { isAddress } from 'viem';

export type DataSource = 'DEMO' | 'LIVE' | 'SYNTHETIC' | 'PARTIAL';

interface WalletState {
  selectedAddress: string | null;
  mode: 'connected' | 'scanned' | 'demo';
  dataSource: DataSource;
}

const WalletCtx = createContext<{
  state: WalletState;
  selectAddress: (addr: string) => void;
  clearAddress: () => void;
  setMode: (m: WalletState['mode']) => void;
  setDataSource: (d: DataSource) => void;
}>({
  state: { selectedAddress: null, mode: 'demo', dataSource: 'DEMO' },
  selectAddress: () => {},
  clearAddress: () => {},
  setMode: () => {},
  setDataSource: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    selectedAddress: null,
    mode: 'demo',
    dataSource: 'DEMO',
  });

  const selectAddress = useCallback((addr: string) => {
    if (isAddress(addr)) {
      setState((s) => ({ ...s, selectedAddress: addr }));
    }
  }, []);

  const clearAddress = useCallback(() => {
    setState({ selectedAddress: null, mode: 'demo', dataSource: 'DEMO' });
  }, []);

  const setMode = useCallback((mode: WalletState['mode']) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  const setDataSource = useCallback((dataSource: DataSource) => {
    setState((s) => ({ ...s, dataSource }));
  }, []);

  return (
    <WalletCtx.Provider value={{ state, selectAddress, clearAddress, setMode, setDataSource }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  return useContext(WalletCtx);
}
