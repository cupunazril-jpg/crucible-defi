'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { Wallet, LogOut, AlertTriangle, ChevronDown, Link2 } from 'lucide-react';
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

  useEffect(() => {
    if (isConnected && address) {
      selectAddress(address);
      setMode('connected');
      setDataSource('LIVE');
    } else if (!isConnected && state.mode === 'connected') {
      clearAddress();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (!showMenu && !showConnectors) return;
    const handler = () => { setShowMenu(false); setShowConnectors(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu, showConnectors]);

  const unsupported = isConnected && !isSupportedChain(chainId);

  // ── Connected state ──
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          className={cn(
            'flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-full border transition-all duration-200 text-[11px]',
            unsupported
              ? 'border-[var(--amber)]/40 bg-[var(--amber-dim)]'
              : 'border-[var(--green)]/30 bg-[var(--green-dim)] hover:border-[var(--green)]/50',
          )}
        >
          {/* Wallet icon with green dot */}
          <div className="relative">
            <div className={cn(
              'h-5 w-5 rounded-full flex items-center justify-center',
              unsupported ? 'bg-[var(--amber)]/20' : 'bg-[var(--green)]/20',
            )}>
              {unsupported ? (
                <AlertTriangle className="h-3 w-3 text-[var(--amber)]" />
              ) : (
                <Wallet className="h-3 w-3 text-[var(--green)]" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--green)] ring-1 ring-[var(--bg-primary)]" />
          </div>

          {/* Address + balance */}
          <span className="mono text-[var(--text-primary)] font-medium">{shortAddress(address)}</span>
          {balance && (
            <span className="text-[var(--text-muted)] hidden md:inline">
              {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} {balance.symbol}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 min-w-[220px] py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-50">
            <div className="px-3 py-2 border-b border-[var(--border)]/40">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-5 rounded-full bg-[var(--green)]/20 flex items-center justify-center">
                  <Wallet className="h-3 w-3 text-[var(--green)]" />
                </div>
                <span className="text-[12px] font-medium">Connected</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mono break-all">{address}</div>
            </div>
            {unsupported && (
              <div className="px-3 py-2 text-[11px] text-[var(--amber)] flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Unsupported chain. Switch to Ethereum, Arbitrum, Optimism, Base, or Polygon.
              </div>
            )}
            <div className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
              <Link2 className="h-3 w-3 text-[var(--text-muted)]" />
              Chain: {CHAIN_NAMES[chainId] ?? `Unknown (${chainId})`}
            </div>
            {balance && (
              <div className="px-3 py-1.5 text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                <Wallet className="h-3 w-3 text-[var(--text-muted)]" />
                Balance: {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)} {balance.symbol}
              </div>
            )}
            <div className="border-t border-[var(--border)]/40 mt-1 pt-1">
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--red)] hover:bg-white/[0.04] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Disconnected state ──
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setShowConnectors((v) => !v); }}
        disabled={connectPending}
        className="flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-[var(--accent)] text-[11px] font-medium hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/20 transition-all duration-200"
      >
        <Wallet className="h-3.5 w-3.5" />
        {connectPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {showConnectors && (
        <div className="absolute right-0 top-full mt-1 min-w-[200px] py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-50">
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
