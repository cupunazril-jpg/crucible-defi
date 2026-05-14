'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Lang = 'en' | 'id' | 'zh' | 'ja';

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Sidebar
    'nav.overview': 'Overview',
    'nav.positions': 'Positions',
    'nav.portfolio': 'Portfolio',
    'nav.simulator': 'Monte Carlo',
    'nav.stress': 'Stress Lab',
    'nav.compare': 'Protocol Compare',
    'nav.oracle': 'Oracle Spread',
    'nav.strategy': 'Strategy',
    'nav.liquidations': 'Liquidations',
    'nav.watchlist': 'Watchlist',
    'nav.methodology': 'Methodology',
    'nav.alerts': 'Alerts',
    'nav.report': 'Risk Report',
    // Header
    'header.engines': 'engines: idle',
    // Overview
    'overview.title': 'Overview',
    'overview.subtitle': 'Real-time DeFi lending risk intelligence',
    // Positions
    'positions.title': 'Positions',
    'positions.subtitle': 'Track and analyze your DeFi lending positions',
    // Portfolio
    'portfolio.title': 'Portfolio',
    'portfolio.subtitle': 'Aggregate portfolio health & exposure',
    // Simulator
    'simulator.title': 'Monte Carlo Liquidation Simulator',
    'simulator.subtitle': 'Forward-simulate health factor paths using GBM',
    // Stress
    'stress.title': 'Stress Lab',
    'stress.subtitle': 'Multi-factor stress testing for lending positions',
    // Compare
    'compare.title': 'Cross-Protocol Compare',
    'compare.subtitle': 'Side-by-side protocol parameter comparison',
    // Oracle
    'oracle.title': 'Oracle Divergence Monitor',
    'oracle.subtitle': 'Track price feed spreads across oracles',
    // Strategy
    'strategy.title': 'Strategy Recommender',
    'strategy.subtitle': 'AI-driven rebalancing suggestions',
    // Liquidations
    'liquidations.title': 'Liquidation Feed',
    'liquidations.subtitle': 'Real-time liquidation events across protocols',
    // Watchlist
    'watchlist.title': 'Watchlist',
    'watchlist.subtitle': 'Your tracked positions and alerts',
    // About
    'about.title': 'Methodology & Formulas',
    'about.subtitle': 'How Crucible computes risk metrics',
    // Theme & Lang
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'lang.label': 'Language',
    // Footer
    'footer.text': 'crucible · liquidation engines run client-side · data: defillama + coingecko (no keys)',
    // Common
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.riskLevel': 'Risk Level',
    'common.healthFactor': 'Health Factor',
    'common.collateral': 'Collateral',
    'common.debt': 'Debt',
    'common.protocol': 'Protocol',
    'common.value': 'Value',
    'common.change': 'Change',
  },
  id: {
    'nav.overview': 'Ringkasan',
    'nav.positions': 'Posisi',
    'nav.portfolio': 'Portofolio',
    'nav.simulator': 'Monte Carlo',
    'nav.stress': 'Lab Stress',
    'nav.compare': 'Perbandingan Protokol',
    'nav.oracle': 'Spread Oracle',
    'nav.strategy': 'Strategi',
    'nav.liquidations': 'Likuidasi',
    'nav.watchlist': 'Pantauan',
    'nav.methodology': 'Metodologi',
    'nav.alerts': 'Peringatan',
    'nav.report': 'Laporan Risiko',
    'header.engines': 'mesin: idle',
    'overview.title': 'Ringkasan',
    'overview.subtitle': 'Intelligence risiko pinjaman DeFi real-time',
    'positions.title': 'Posisi',
    'positions.subtitle': 'Lacak dan analisis posisi pinjaman DeFi Anda',
    'portfolio.title': 'Portofolio',
    'portfolio.subtitle': 'Kesehatan & eksposur portofolio agregat',
    'simulator.title': 'Simulator Likuidasi Monte Carlo',
    'simulator.subtitle': 'Simulasi jalur health factor menggunakan GBM',
    'stress.title': 'Lab Stress',
    'stress.subtitle': 'Pengujian stres multi-faktor untuk posisi pinjaman',
    'compare.title': 'Perbandingan Protokol',
    'compare.subtitle': 'Perbandingan parameter protokol berdampingan',
    'oracle.title': 'Monitor Divergensi Oracle',
    'oracle.subtitle': 'Lacak spread harga lintas oracle',
    'strategy.title': 'Rekomendasi Strategi',
    'strategy.subtitle': 'Saran rebalancing berbasis AI',
    'liquidations.title': 'Feed Likuidasi',
    'liquidations.subtitle': 'Event likuidasi real-time lintas protokol',
    'watchlist.title': 'Pantauan',
    'watchlist.subtitle': 'Posisi dan peringatan yang Anda lacak',
    'about.title': 'Metodologi & Rumus',
    'about.subtitle': 'Bagaimana Crucible menghitung metrik risiko',
    'theme.dark': 'Gelap',
    'theme.light': 'Terang',
    'lang.label': 'Bahasa',
    'footer.text': 'crucible · mesin likuidasi berjalan di sisi klien · data: defillama + coingecko (tanpa kunci)',
    'common.loading': 'Memuat...',
    'common.noData': 'Tidak ada data',
    'common.riskLevel': 'Tingkat Risiko',
    'common.healthFactor': 'Faktor Kesehatan',
    'common.collateral': 'Kolateral',
    'common.debt': 'Utang',
    'common.protocol': 'Protokol',
    'common.value': 'Nilai',
    'common.change': 'Perubahan',
  },
  zh: {
    'nav.overview': '概览',
    'nav.positions': '仓位',
    'nav.portfolio': '投资组合',
    'nav.simulator': '蒙特卡洛',
    'nav.stress': '压力测试',
    'nav.compare': '协议对比',
    'nav.oracle': '预言机价差',
    'nav.strategy': '策略',
    'nav.liquidations': '清算',
    'nav.watchlist': '关注列表',
    'nav.methodology': '方法论',
    'nav.alerts': '警报',
    'nav.report': '风险报告',
    'header.engines': '引擎: 空闲',
    'overview.title': '概览',
    'overview.subtitle': '实时DeFi借贷风险智能',
    'positions.title': '仓位',
    'positions.subtitle': '跟踪和分析您的DeFi借贷仓位',
    'portfolio.title': '投资组合',
    'portfolio.subtitle': '投资组合总健康度与风险敞口',
    'simulator.title': '蒙特卡洛清算模拟器',
    'simulator.subtitle': '使用GBM模拟健康因子路径',
    'stress.title': '压力测试实验室',
    'stress.subtitle': '借贷仓位多因素压力测试',
    'compare.title': '跨协议对比',
    'compare.subtitle': '协议参数并排对比',
    'oracle.title': '预言机价差监控',
    'oracle.subtitle': '跟踪跨预言机的价格偏差',
    'strategy.title': '策略推荐',
    'strategy.subtitle': 'AI驱动的再平衡建议',
    'liquidations.title': '清算动态',
    'liquidations.subtitle': '跨协议实时清算事件',
    'watchlist.title': '关注列表',
    'watchlist.subtitle': '您跟踪的仓位和警报',
    'about.title': '方法论与公式',
    'about.subtitle': 'Crucible如何计算风险指标',
    'theme.dark': '深色',
    'theme.light': '浅色',
    'lang.label': '语言',
    'footer.text': 'crucible · 清算引擎在客户端运行 · 数据: defillama + coingecko (无需密钥)',
    'common.loading': '加载中...',
    'common.noData': '暂无数据',
    'common.riskLevel': '风险等级',
    'common.healthFactor': '健康因子',
    'common.collateral': '抵押品',
    'common.debt': '债务',
    'common.protocol': '协议',
    'common.value': '价值',
    'common.change': '变化',
  },
  ja: {
    'nav.overview': '概要',
    'nav.positions': 'ポジション',
    'nav.portfolio': 'ポートフォリオ',
    'nav.simulator': 'モンテカルロ',
    'nav.stress': 'ストレステスト',
    'nav.compare': 'プロトコル比較',
    'nav.oracle': 'オラクルスプレッド',
    'nav.strategy': 'ストラテジー',
    'nav.liquidations': '清算',
    'nav.watchlist': 'ウォッチリスト',
    'nav.methodology': '方法論',
    'nav.alerts': 'アラート',
    'nav.report': 'リスクレポート',
    'header.engines': 'エンジン: アイドル',
    'overview.title': '概要',
    'overview.subtitle': 'リアルタイムDeFiレンディングリスク分析',
    'positions.title': 'ポジション',
    'positions.subtitle': 'DeFiレンディングポジションの追跡と分析',
    'portfolio.title': 'ポートフォリオ',
    'portfolio.subtitle': 'ポートフォリオ全体のヘルス＆エクスポージャー',
    'simulator.title': 'モンテカルロ清算シミュレーター',
    'simulator.subtitle': 'GBMによるヘルスファクターパスのシミュレーション',
    'stress.title': 'ストレステストラボ',
    'stress.subtitle': 'レンディングポジションの多要因ストレステスト',
    'compare.title': 'プロトコル比較',
    'compare.subtitle': 'プロトコルパラメータの並列比較',
    'oracle.title': 'オラクル乖離モニター',
    'oracle.subtitle': 'オラクル間の価格フィードスプレッドを追跡',
    'strategy.title': 'ストラテジー推奨',
    'strategy.subtitle': 'AI駆動のリバランス提案',
    'liquidations.title': '清算フィード',
    'liquidations.subtitle': 'プロトコル横断リアルタイム清算イベント',
    'watchlist.title': 'ウォッチリスト',
    'watchlist.subtitle': '追跡中のポジションとアラート',
    'about.title': '方法論と数式',
    'about.subtitle': 'Crucibleのリスク指標計算方法',
    'theme.dark': 'ダーク',
    'theme.light': 'ライト',
    'lang.label': '言語',
    'footer.text': 'crucible · 清算エンジンはクライアントサイドで実行 · データ: defillama + coingecko (キー不要)',
    'common.loading': '読み込み中...',
    'common.noData': 'データなし',
    'common.riskLevel': 'リスクレベル',
    'common.healthFactor': 'ヘルスファクター',
    'common.collateral': '担保',
    'common.debt': '負債',
    'common.protocol': 'プロトコル',
    'common.value': '値',
    'common.change': '変更',
  },
};

const LangCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  langs: typeof LANGS;
}>({ lang: 'en', setLang: () => {}, t: (k) => k, langs: LANGS });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crucible-lang') as Lang | null;
    if (stored && LANGS.some((l) => l.code === stored)) {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('crucible-lang', l);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  };

  return (
    <LangCtx.Provider value={{ lang, setLang, t, langs: LANGS }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
