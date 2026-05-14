'use client';

import { useEffect, useState, useMemo } from 'react';
import { formatUnits } from 'viem';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { Panel, PanelHeader, StatCard } from '@/components/ui';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { RiskScoreBadge, RiskScoreBar } from '@/components/risk/RiskScoreBadge';
import { useWallet } from '@/context/WalletContext';
import { computeRiskScore } from '@/lib/risk/risk-score';
import { CHAIN_NAMES, CHAIN_NATIVE_SYMBOL, isSupportedChain } from '@/lib/wallet/chains';
import { shortAddress, formatUsd, cn } from '@/utils';

export function WalletRiskSnapshot() {
  const { state } = useWallet();
  const { address: connectedAddr } = useAccount();
  const chainId = useChainId();
  const activeAddress = state.selectedAddress;

  const { data: balance, isLoading: balanceLoading, error: balanceError, refetch } = useBalance({
    address: activeAddress as `0x${string}` | undefined,
  });

  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (!activeAddress) return;
    let cancelled = false;
    (async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        if (!res.ok) throw new Error('Price fetch failed');
        const data = await res.json();
        if (!cancelled) setEthPrice(data.ethereum?.usd ?? null);
      } catch {
        if (!cancelled) setEthPrice(null);
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeAddress]);

  const balanceUsd = useMemo(() => {
    if (!balance || !ethPrice) return null;
    const val = parseFloat(formatUnits(balance.value, balance.decimals));
    return val * ethPrice;
  }, [balance, ethPrice]);

  const riskResult = useMemo(() => computeRiskScore({}), []);

  if (!activeAddress) {
    return (
      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Wallet className="h-4 w-4" />
          <div className="text-[12px]">
            Connect wallet or paste address to see wallet risk snapshot.
          </div>
        </div>
      </Panel>
    );
  }

  const chainName = CHAIN_NAMES[chainId] ?? 'Unknown';
  const nativeSymbol = CHAIN_NATIVE_SYMBOL[chainId] ?? 'ETH';
  const now = new Date().toLocaleTimeString('en-GB', { hour12: false });

  return (
    <Panel>
      <PanelHeader
        title="Wallet Risk Snapshot"
        subtitle={
          <div className="flex items-center gap-2">
            <DataSourceBadge source={state.dataSource} />
            <span className="text-[11px] text-[var(--text-muted)]">
              {state.mode === 'scanned' ? 'Read-only wallet scan' : 'Connected wallet'}
            </span>
          </div>
        }
        right={
          <button onClick={() => refetch()} className="btn btn-ghost h-8 w-8 p-0" title="Refresh balance">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Address"
          value={shortAddress(activeAddress)}
          hint={activeAddress}
        />
        <StatCard
          label="Chain"
          value={chainName}
          hint={isSupportedChain(chainId) ? 'Supported' : 'Unsupported'}
          tone={isSupportedChain(chainId) ? 'positive' : 'warning'}
        />
        <StatCard
          label={`Balance (${nativeSymbol})`}
          value={
            balanceLoading
              ? 'Loading…'
              : balance
                ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)
                : '—'
          }
          hint={
            balanceUsd ? formatUsd(balanceUsd) :
            priceLoading ? 'Loading price…' :
            ethPrice === null ? 'Price unavailable' : ''
          }
          tone={balanceError ? 'warning' : 'neutral'}
        />
        <StatCard
          label="Last Updated"
          value={now}
          hint="UTC time"
        />
      </div>

      {balanceError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--amber-dim)] text-[var(--amber)] text-[12px] mb-4">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Could not fetch native balance. RPC may be rate-limited. App continues to work with demo data.
        </div>
      )}

      <RiskScoreBar result={riskResult} />
      <div className="text-[10px] text-[var(--text-muted)] mt-2">
        Risk score uses demo position data. Connect and load real positions for accurate scoring.
      </div>
    </Panel>
  );
}
