'use client';

import { RiskReport } from '@/components/risk/RiskReport';
import { Panel } from '@/components/ui';
import { FileText, Shield } from 'lucide-react';

export function ReportPage() {
  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-md bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Risk Intelligence</div>
              <h1 className="text-xl font-semibold tracking-tight">Risk Report</h1>
            </div>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Generate a comprehensive risk report covering your worst position, stress test results,
            Crucible Risk Score, and recommended actions. Copy to clipboard for sharing.
          </p>
        </div>
      </Panel>

      <RiskReport />

      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="flex items-start gap-3">
          <Shield className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
          <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Reports are generated client-side using demo position data. PDF export coming soon.
            All computations run in your browser — no data is sent to external servers.
          </div>
        </div>
      </Panel>
    </div>
  );
}
