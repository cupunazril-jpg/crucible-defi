'use client';

import { AlertRulesPanel } from '@/components/alerts/AlertRulesPanel';
import { Panel, PanelHeader } from '@/components/ui';
import { Bell, Shield } from 'lucide-react';

export function AlertsPage() {
  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-md bg-[var(--amber-dim)] text-[var(--amber)] flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Local Alert System</div>
              <h1 className="text-xl font-semibold tracking-tight">Alert Rules</h1>
            </div>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Create rules to monitor your risk thresholds. Alerts are simulated locally in your browser —
            no external notifications are sent. Rules persist in localStorage.
          </p>
        </div>
      </Panel>

      <AlertRulesPanel />

      <Panel className="bg-[var(--bg-secondary)]/30">
        <div className="flex items-start gap-3">
          <Shield className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
          <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            <strong>Coming soon:</strong> Email, Telegram, Discord, and webhook notifications.
            Currently all alerts are browser-local only. Your rules are saved locally and
            never leave your device.
          </div>
        </div>
      </Panel>
    </div>
  );
}
