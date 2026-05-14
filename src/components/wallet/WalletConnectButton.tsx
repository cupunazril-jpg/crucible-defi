'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { Wallet, LogOut, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn, shortAddress } from '@/utils';
import { useWallet } from '@/context/WalletContext';
import { isSupportedChain, CHAIN_NAMES, CHAIN_NATIVE_SYMBOL } from '@/lib/wallet/chains';

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { state, selectAddress, clearAddress, setMode, setDataSource } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  // Sync connected wallet to context
  useEffect(() => {
    if (isConnected && address) {
      selectAddress(address);
      setMode('connected');
      setDataSource('LIVE');
    } else if (!isConnected && state.mode === 'connected') {
      clearAddress();
    }
  }, [isConnected, address]);

  // Close menus on outside click
  useEffect(() => {
    if (!showMenu && !showConnectors) return;
    const handler = () => { setShowMenu(false); setShowConnectors(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu, showConnectors]);

  const unsupported = isConnected && !isSupportedChain(chainId);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          className={cn("btn h-9 gap-2 text-[12px]", unsupported ? 'border-[var(--amber)] text-[var(--amber)]' : '')}
        >
          {unsupported ? <AlertTriangle className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
          <span className="mono">{shortAddress(address)}</span>
          {balance && (
            <span className="text-[var(--text-muted)] hidden sm:inline">
              {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} {balance.symbol}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 min-w-[200px] py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-50">
            <div className="px-3 py-2 text-[11px] text-[var(--text-muted)] mono border-b border-[var(--border)]/40">
              {address}
            </div>
            {unsupported && (
              <div className="px-3 py-2 text-[11px] text-[var(--amber)] flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" />
                Unsupported chain. Switch to Ethereum, Arbitrum, Optimism, Base, or Polygon.
              </div>
            )}
            <div className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)]">
              Chain: {CHAIN_NAMES[chainId] ?? `Unknown (${chainId})`}
            </div>
            {balance && (
              <div className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)]">
                Balance: {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)} {balance.symbol}
              </div>
            )}
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--red)] hover:bg-white/[0.04] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setShowConnectors((v) => !v); }}
        disabled={connectPending}
        className="btn btn-primary h-9 gap-2 text-[12px]"
      >
        <Wallet className="h-3.5 w-3.5" />
        {connectPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {showConnectors && (
        <div className="absolute right-0 top-full mt-1 min-w-[180px] py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-50">
          <div className="px-3 py-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]/40">
            Read-only · No transactions
          </div>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => { connect({ connector }); setShowConnectors(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.04] transition-colors"
            >
              <Wallet className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
