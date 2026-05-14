'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Panel,
  PanelHeader,
  RiskChip,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { OracleSpread } from '@/components/charts/OracleSpread';
import { syntheticDivergence } from '@/modules/oracle';
import { formatUsd, formatRelativeTime, cn } from '@/utils';
import type { OracleDivergence } from '@/types';

const ASSETS = ['WETH', 'WBTC', 'wstETH', 'cbETH', 'ARB', 'LINK', 'AAVE', 'USDC', 'USDT', 'DAI'];

export function OraclePage() {
  const [seed, setSeed] = useState(1);
  const [divs, setDivs] = useState<OracleDivergence[]>(() =>
    ASSETS.map((a, i) => syntheticDivergence(a, i + 1)),
  );
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const newSeed = seed + 1;
    setSeed(newSeed);
    try {
      const res = await fetch(`/api/oracle?assets=${ASSETS.join(',')}&seed=${newSeed}`);
      if (res.ok) {
        const data = await res.json();
        setDivs(data.divergences);
      } else {
        setDivs(ASSETS.map((a, i) => syntheticDivergence(a, i + newSeed)));
      }
    } catch {
      setDivs(ASSETS.map((a, i) => syntheticDivergence(a, i + newSeed)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    let safe = 0,
      cautioned = 0,
      elevated = 0,
      criticalOrWorse = 0;
    let maxSpread = 0;
    let maxAsset = '';
    for (const d of divs) {
      switch (d.tier) {
        case 'Safe':
          safe++;
          break;
        case 'Caution':
          cautioned++;
          break;
        case 'Elevated':
          elevated++;
          break;
        default:
          criticalOrWorse++;
      }
      if (d.maxSpreadBps > maxSpread) {
        maxSpread = d.maxSpreadBps;
        maxAsset = d.asset;
      }
    }
    return { safe, cautioned, elevated, criticalOrWorse, maxSpread, maxAsset };
  }, [divs]);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Oracle Divergence Monitor"
          subtitle="Synthetic spread across four reference feeds (Chainlink, Pyth, Uniswap V3 TWAP, CoinGecko). Wide spreads precede liquidation glitches."
          right={
            <button onClick={refresh} disabled={loading} className="btn h-9 text-[12px]">
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              refresh
            </button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Safe feeds" value={summary.safe.toString()} tone="positive" />
          <StatCard label="Cautioned" value={summary.cautioned.toString()} tone="accent" />
          <StatCard label="Elevated" value={summary.elevated.toString()} tone="warning" />
          <StatCard
            label="Critical / Imminent"
            value={summary.criticalOrWorse.toString()}
            tone={summary.criticalOrWorse > 0 ? 'negative' : 'positive'}
          />
        </div>

        <div className="mt-4 text-[12px] text-[var(--text-secondary)]">
          Highest spread: <span className="mono">{summary.maxAsset}</span> at{' '}
          <span className="mono">{summary.maxSpread.toFixed(0)} bps</span>.
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Spread chart" subtitle="Max spread (basis points) across feeds." />
        <OracleSpread divergences={divs} />
      </Panel>

      <Panel>
        <PanelHeader title="Feed detail" subtitle="Per-asset breakdown across reference sources." />
        <Table>
          <thead>
            <tr>
              <Th>Asset</Th>
              <Th>Tier</Th>
              <Th align="right">Median</Th>
              <Th align="right">Max Spread (bps)</Th>
              <Th align="right">Chainlink</Th>
              <Th align="right">Pyth</Th>
              <Th align="right">Uniswap TWAP</Th>
              <Th align="right">CoinGecko</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {divs.map((d) => {
              const lookup = Object.fromEntries(d.quotes.map((q) => [q.source, q.priceUsd]));
              return (
                <tr key={d.asset}>
                  <Td>{d.asset}</Td>
                  <Td>
                    <RiskChip tier={d.tier} />
                  </Td>
                  <Td align="right">{formatUsd(d.median)}</Td>
                  <Td
                    align="right"
                    className={cn(
                      d.maxSpreadBps > 80
                        ? 'text-[var(--red)]'
                        : d.maxSpreadBps > 40
                        ? 'text-[var(--amber)]'
                        : 'text-[var(--green)]',
                    )}
                  >
                    {d.maxSpreadBps.toFixed(1)}
                  </Td>
                  <Td align="right">{lookup.Chainlink != null ? formatUsd(lookup.Chainlink) : '—'}</Td>
                  <Td align="right">{lookup.Pyth != null ? formatUsd(lookup.Pyth) : '—'}</Td>
                  <Td align="right">
                    {lookup['Uniswap TWAP'] != null ? formatUsd(lookup['Uniswap TWAP']) : '—'}
                  </Td>
                  <Td align="right">
                    {lookup.CoinGecko != null ? formatUsd(lookup.CoinGecko) : '—'}
                  </Td>
                  <Td className="mono text-[11px] text-[var(--text-muted)]">
                    {formatRelativeTime(Math.max(...d.quotes.map((q) => q.updatedAt)))}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>

      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          <strong>How to read:</strong> max-spread in basis points (1 bps = 0.01%). Cautions begin
          at 40 bps, elevated at 80 bps, critical past 120 bps, imminent past 200 bps. These
          thresholds approximate when discrepancies between liquidation oracles, TWAPs and CEX
          spot have historically preceded mis-priced liquidations on Aave V2/V3 and Compound V2.
        </div>
      </Panel>
    </div>
  );
}
