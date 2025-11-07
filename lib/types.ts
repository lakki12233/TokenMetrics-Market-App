export interface Index {
  id: string;
  name: string;
  symbol: string;
  value: number;
  change24h: number;
  changePercent24h: number;
}

export interface Indicator {
  id: string;
  name: string;
  category: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
}

export interface DailyDataPoint {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface IndexDetail extends Index {
  dailyData: DailyDataPoint[];
}

export interface IndicatorDetail extends Indicator {
  dailyData: DailyDataPoint[];
}

export interface APIResponse<T> {
  data: T;
  timestamp: string;
}

