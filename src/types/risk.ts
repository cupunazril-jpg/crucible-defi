export interface AlertRule {
  id: string;
  name: string;
  condition: 'hf_below' | 'risk_above' | 'oracle_above' | 'drawdown_above';
  threshold: number;
  enabled: boolean;
  createdAt: number;
}

export interface RiskReport {
  generatedAt: number;
  mode: 'demo' | 'live' | 'scanned';
  address?: string | null;
  riskScore: number;
  riskTier: string;
  worstPosition?: {
    label: string;
    healthFactor: number;
    tier: string;
    liquidationPrice: number | null;
  };
  stressTestSummary?: {
    totalScenarios: number;
    liquidatedCount: number;
  };
  recommendedActions: string[];
  dataSources: string[];
}
