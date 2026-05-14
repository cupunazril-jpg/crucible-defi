'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui';
import { cn } from '@/utils';
import type { AlertRule } from '@/types/risk';

const STORAGE_KEY = 'crucible-alert-rules';

function loadRules(): AlertRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRules(rules: AlertRule[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {}
}

type ConditionType = AlertRule['condition'];

const CONDITION_LABELS: Record<ConditionType, string> = {
  hf_below: 'Health Factor below',
  risk_above: 'Risk Score above',
  oracle_above: 'Oracle spread above (bps)',
  drawdown_above: 'Collateral drawdown above (%)',
};

export function AlertRulesPanel() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCondition, setNewCondition] = useState<ConditionType>('hf_below');
  const [newThreshold, setNewThreshold] = useState('1.30');

  useEffect(() => {
    setRules(loadRules());
    setMounted(true);
  }, []);

  const addRule = useCallback(() => {
    if (!newName.trim()) return;
    const threshold = parseFloat(newThreshold);
    if (isNaN(threshold)) return;
    const rule: AlertRule = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: newName.trim(),
      condition: newCondition,
      threshold,
      enabled: true,
      createdAt: Date.now(),
    };
    const next = [...rules, rule];
    setRules(next);
    saveRules(next);
    setNewName('');
    setNewThreshold('1.30');
    setShowAdd(false);
  }, [rules, newName, newCondition, newThreshold]);

  const deleteRule = useCallback((id: string) => {
    const next = rules.filter((r) => r.id !== id);
    setRules(next);
    saveRules(next);
  }, [rules]);

  const toggleRule = useCallback((id: string) => {
    const next = rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(next);
    saveRules(next);
  }, [rules]);

  if (!mounted) return null;

  return (
    <Panel>
      <PanelHeader
        title="Alert Rules"
        subtitle="Local-only alerts. Simulated in-browser — no external notifications."
        right={
          <button onClick={() => setShowAdd((v) => !v)} className="btn h-8 text-[12px]">
            <Plus className="h-3.5 w-3.5" /> Add Rule
          </button>
        }
      />

      {showAdd && (
        <div className="panel p-4 mb-4 border-l-2 border-l-[var(--accent)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase text-[var(--text-muted)] mb-1 block">Rule Name</label>
              <input
                className="input text-[12px]"
                placeholder="e.g. HF Critical Alert"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-[var(--text-muted)] mb-1 block">Condition</label>
              <select
                className="input text-[12px]"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as ConditionType)}
              >
                {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-[var(--text-muted)] mb-1 block">Threshold</label>
              <input
                className="input text-[12px] mono"
                type="number"
                step="any"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addRule} className="btn btn-primary h-8 text-[12px]">Save Rule</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost h-8 text-[12px]">Cancel</button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-[12px]">
          <Bell className="h-4 w-4" />
          No alert rules yet. Add rules to monitor risk thresholds.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors",
                rule.enabled
                  ? 'border-[var(--border)] bg-[var(--bg-card)]'
                  : 'border-[var(--border)]/40 bg-[var(--bg-card)]/50 opacity-60'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => toggleRule(rule.id)} className="shrink-0">
                  {rule.enabled ? (
                    <ToggleRight className="h-5 w-5 text-[var(--accent)]" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium truncate">{rule.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mono">
                    {CONDITION_LABELS[rule.condition]} {rule.threshold}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="btn btn-ghost h-7 w-7 p-0 text-[var(--text-muted)] hover:text-[var(--red)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
