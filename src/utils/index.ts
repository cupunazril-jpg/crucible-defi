// ============================================================
// Crucible — Shared math + formatting utilities
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// --- Numeric helpers ------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function logNormalize(value: number, min: number, max: number): number {
  if (value <= 0) return 0;
  const lo = Math.log(Math.max(min, 1));
  const hi = Math.log(Math.max(max, min + 1));
  const lv = Math.log(Math.max(value, 1));
  if (hi === lo) return 0;
  return clamp((lv - lo) / (hi - lo), 0, 1);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  let s = 0;
  for (const v of values) s += (v - m) ** 2;
  return Math.sqrt(s / (values.length - 1));
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = clamp(Math.floor(p * (sorted.length - 1)), 0, sorted.length - 1);
  return sorted[idx];
}

// --- Random number generation --------------------------------------

/**
 * Box-Muller transform — sample from N(mean, stdDev).
 */
export function randomNormal(mu = 0, sigma = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma + mu;
}

/**
 * Seeded PRNG (mulberry32) — useful for reproducible Monte Carlo runs.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededNormal(rng: () => number, mu = 0, sigma = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma + mu;
}

// --- Compound interest ---------------------------------------------

export function compoundInterest(principal: number, rate: number, days: number): number {
  const daily = rate / 365;
  return principal * Math.pow(1 + daily, days);
}

// --- Formatting ----------------------------------------------------

export function formatUsd(value: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(value)) return '—';
  if (opts.compact && Math.abs(value) >= 1_000) {
    return Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

export function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatHealthFactor(hf: number): string {
  if (!Number.isFinite(hf)) return '∞';
  if (hf >= 99) return '∞';
  return hf.toFixed(2);
}

// --- Misc ----------------------------------------------------------

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
