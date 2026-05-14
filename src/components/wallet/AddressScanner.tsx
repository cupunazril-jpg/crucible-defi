'use client';

import { useState, useCallback } from 'react';
import { isAddress } from 'viem';
import { Search, X, Eye } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { shortAddress, cn } from '@/utils';

export function AddressScanner() {
  const { state, selectAddress, clearAddress, setMode, setDataSource } = useWallet();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleScan = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Enter an address');
      return;
    }
    if (!isAddress(trimmed)) {
      setError('Invalid address');
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

  // If already scanning — show compact pill
  if (state.mode === 'scanned' && state.selectedAddress) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 pl-2.5 pr-3 h-8 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-[11px]">
          <Eye className="h-3 w-3 text-[var(--accent)]" />
          <span className="mono text-[var(--accent)]">{shortAddress(state.selectedAddress)}</span>
        </div>
        <button onClick={handleClear} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/[0.06] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" aria-label="Clear address">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Don't show if wallet connected
  if (state.mode === 'connected') return null;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex items-center h-8 rounded-full border transition-all duration-200',
          focused
            ? 'border-[var(--accent)]/40 bg-[var(--bg-card)] shadow-[0_0_0_2px_rgba(56,189,248,0.08)]'
            : 'border-[var(--border)] bg-[var(--bg-secondary)]/60',
          error && 'border-[var(--red)]/40',
        )}
      >
        <Search className="h-3.5 w-3.5 text-[var(--text-muted)] ml-2.5 shrink-0" />
        <input
          className="flex-1 bg-transparent border-none outline-none px-2 h-full text-[11px] mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          placeholder="0x… paste address"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {input && (
          <button onClick={() => { setInput(''); setError(''); }} className="p-1 mr-0.5 hover:text-[var(--text-secondary)] text-[var(--text-muted)] transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={handleScan}
          className="h-6 px-2.5 mr-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[10px] font-medium hover:bg-[var(--accent)]/25 transition-colors"
        >
          Scan
        </button>
      </div>
      {error && <div className="text-[10px] text-[var(--red)] pl-2">{error}</div>}
    </div>
  );
}
