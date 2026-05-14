'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileText, Copy, Check, X } from 'lucide-react';
import { Panel, PanelHeader, RiskChip } from '@/components/ui';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { SAMPLE_POSITIONS } from '@/modules/data-pipeline/positions';
import { assessHealth } from '@/modules/health-factor';
import { applyAllScenarios } from '@/modules/stress-test';
import { computeRiskScore } from '@/lib/risk/risk-score';
import { useWallet } from '@/context/WalletContext';
import { formatUsd, formatPercent, cn } from '@/utils';

export function RiskReport() {
  const { state } = useWallet();
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    const positions = SAMPLE_POSITIONS.map((p) => ({ p, s: assessHealth(p) }));
    const worst = positions.reduce((w, r) =>
      r.s.healthFactor < w.s.healthFactor ? r : w, positions[0]);
    const stress = worst ? applyAllScenarios(worst.p) : [];
    const riskResult = computeRiskScore({
      snapshot: worst?.s,
      stressResults: stress,
    });

    const lines: string[] = [
      '═══════════════════════════════════════',
      '       CRUCIBLE RISK REPORT          ',
      '═══════════════════════════════════════',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Mode: ${state.mode.toUpperCase()}`,
      state.selectedAddress ? `Address: ${state.selectedAddress}` : 'Address: N/A (demo mode)',
      `Data: ${positions.length} demo positions analyzed`,
      '',
      '── RISK SCORE ──',
      `Score: ${riskResult.score}/100 (${riskResult.tier})`,
      '',
      '── WORST POSITION ──',
    ];

    if (worst) {
      lines.push(
        `Position: ${worst.p.label}`,
        `Protocol: ${worst.p.protocol} · ${worst.p.chain}`,
        `Health Factor: ${worst.s.healthFactor.toFixed(4)}`,
        `Risk Tier: ${worst.s.tier}`,
        `Collateral: ${formatUsd(worst.s.collateralUsd)}`,
        `Debt: ${formatUsd(worst.s.debtUsd)}`,
        `LTV: ${formatPercent(worst.s.ltv, 2)}`,
        `Liquidation Buffer: ${formatPercent(worst.s.liquidationBuffer, 2)}`,
        worst.s.liquidationPriceUsd ? `Liquidation Price: ${formatUsd(worst.s.liquidationPriceUsd)}` : 'Liquidation Price: N/A',
      );
    }

    lines.push('', '── STRESS TEST ──');
    if (stress.length > 0) {
      const liquidated = stress.filter((r) => r.liquidated).length;
      lines.push(`Scenarios tested: ${stress.length}`, `Liquidations: ${liquidated}`);
      for (const r of stress) {
        lines.push(`  ${r.scenarioId}: HF ${r.after.healthFactor.toFixed(2)} — ${r.liquidated ? 'LIQUIDATED' : 'Survives'}`);
      }
    }

    lines.push('', '── RECOMMENDED ACTIONS ──');
    if (worst && worst.s.healthFactor < 1.5) {
      lines.push(
        '• Reduce leverage by repaying debt',
        '• Add collateral to increase health factor',
        '• Monitor oracle divergence for price manipulation risk',
      );
    } else {
      lines.push('• Position is healthy — no immediate action required');
    }

    lines.push(
      '',
      '── DATA SOURCES ──',
      '• Positions: DEMO (pre-loaded sample data)',
      '• Health Factor: SYNTHETIC (client-side computation)',
      '• Monte Carlo: SYNTHETIC (simulated GBM paths)',
      '• Stress Test: SYNTHETIC (historical scenario replay)',
      '• Oracle Spread: SYNTHETIC (modeled divergence)',
      '',
      '═══════════════════════════════════════',
      '  Crucible — DeFi Lending Risk Engine  ',
      '  Analytics only. Not financial advice. ',
      '═══════════════════════════════════════',
    );

    return { text: lines.join('\n'), riskResult, worst, stress };
  }, [state]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = report.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [report.text]);

  return (
    <Panel>
      <PanelHeader
        title="Generate Risk Report"
        subtitle="Compile a summary of your risk profile, worst position, stress results, and recommended actions."
        right={
          <button onClick={() => setShowReport((v) => !v)} className="btn btn-primary h-8 text-[12px]">
            <FileText className="h-3.5 w-3.5" />
            {showReport ? 'Hide Report' : 'Generate Report'}
          </button>
        }
      />

      {showReport && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <DataSourceBadge source="SYNTHETIC" />
            <span className="text-[11px] text-[var(--text-muted)]">
              Generated {new Date().toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="panel p-3 text-center">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Risk Score</div>
              <div className={cn("text-2xl font-bold mono mt-1",
                report.riskResult.score > 75 ? 'text-[var(--red)]' :
                report.riskResult.score > 50 ? 'text-[var(--amber)]' :
                report.riskResult.score > 25 ? 'text-[var(--accent)]' : 'text-[var(--green)]'
              )}>
                {report.riskResult.score}
              </div>
            </div>
            {report.worst && (
              <>
                <div className="panel p-3 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Worst HF</div>
                  <div className="text-2xl font-bold mono mt-1 text-[var(--amber)]">
                    {report.worst.s.healthFactor.toFixed(2)}
                  </div>
                </div>
                <div className="panel p-3 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Worst Position</div>
                  <div className="text-[13px] font-medium mt-2 truncate">
                    {report.worst.p.label}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn h-8 text-[12px]">
              {copied ? <Check className="h-3.5 w-3.5 text-[var(--green)]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy report to clipboard'}
            </button>
          </div>

          <pre className="p-4 rounded-lg bg-[var(--bg-secondary)] text-[11px] mono text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-[var(--border)]/40">
            {report.text}
          </pre>
        </div>
      )}
    </Panel>
  );
}
