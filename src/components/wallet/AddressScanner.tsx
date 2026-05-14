'use client';

import { useState, useCallback } from 'react';
import { isAddress } from 'viem';
import { Search, X, Eye } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { shortAddress } from '@/utils';

export function AddressScanner() {
  const { state, selectAddress, clearAddress, setMode, setDataSource } = useWallet();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleScan = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Enter an Ethereum address');
      return;
    }
    if (!isAddress(trimmed)) {
      setError('Invalid address format');
      return;
    }
    setError('');
    selectAddress(trimmed);
    setMode('scanned');
    setDataSource('LIVE');
  }, [input, selectAddress, setMode, setDataSource]);

  const handleClear = useCallback(() => {
    setInput('');
    setError('');
    clearAddress();
  }, [clearAddress]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleScan();
  };

  // If already scanning an address (not connected), show the current scan
  if (state.mode === 'scanned' && state.selectedAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[12px]">
          <Eye className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span className="mono">{shortAddress(state.selectedAddress)}</span>
          <span className="text-[10px] text-[var(--text-muted)] ml-1">read-only</span>
        </div>
        <button onClick={handleClear} className="btn btn-ghost h-9 w-9 p-0" aria-label="Clear address">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Don't show scanner input if wallet is connected
  if (state.mode === 'connected') return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            className="input pl-7 h-9 text-[12px] mono"
            placeholder="Paste wallet address (0x…)"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button onClick={handleScan} className="btn h-9 text-[12px]">
          <Eye className="h-3.5 w-3.5" />
          Scan
        </button>
      </div>
      {error && <div className="text-[11px] text-[var(--red)]">{error}</div>}
      <div className="text-[10px] text-[var(--text-muted)]">
        Connect wallet for live read-only scan · No transactions will be requested
      </div>
    </div>
  );
}
