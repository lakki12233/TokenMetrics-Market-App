import { NextRequest, NextResponse } from 'next/server';
import { getAPIClient } from '@/lib/api-client';
import { Indicator, IndicatorDetail, DailyDataPoint } from '@/lib/types';

// Mock data generator for demonstration
function generateMockIndicators(): Indicator[] {
  return [
    {
      id: 'rsi-btc',
      name: 'RSI (14) - Bitcoin',
      category: 'Momentum',
      value: 58.5,
      signal: 'bullish',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'macd-btc',
      name: 'MACD - Bitcoin',
      category: 'Trend',
      value: 1250.5,
      signal: 'bullish',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'bollinger-btc',
      name: 'Bollinger Bands - Bitcoin',
      category: 'Volatility',
      value: 0.85,
      signal: 'neutral',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'volume-profile',
      name: 'Volume Profile',
      category: 'Volume',
      value: 0.72,
      signal: 'bullish',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'support-resistance',
      name: 'Support/Resistance Levels',
      category: 'Technical',
      value: 42000,
      signal: 'neutral',
      timestamp: new Date().toISOString(),
    },
  ];
}

function generate30DayData(baseValue: number, signal: 'bullish' | 'bearish' | 'neutral'): DailyDataPoint[] {
  const data: DailyDataPoint[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate variation based on signal
    let variation = (Math.random() - 0.5) * 0.1;
    if (signal === 'bullish') variation = Math.abs(variation) * 0.5;
    if (signal === 'bearish') variation = -Math.abs(variation) * 0.5;
    
    const value = baseValue * (1 + variation);
    const change = baseValue * variation;
    const changePercent = (change / (value - change)) * 100;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Number(value.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
    });
  }
  
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const indicatorId = searchParams.get('id');
    const includeDetails = searchParams.get('details') === 'true';

    // Try to get API client and make real API call
    let apiClient;
    let useRealAPI = false;
    
    try {
      apiClient = getAPIClient();
      useRealAPI = true;
    } catch (error) {
      console.log('API client not available, using mock data');
    }

    // Try to fetch from real API if available
    if (useRealAPI && apiClient) {
      try {
        if (indicatorId) {
          // Try to get specific indicator from API
          console.log(`[API] Attempting to fetch indicator: ${indicatorId}`);
          const response: any = await apiClient.request(`/indicators/${indicatorId}${includeDetails ? '?details=true' : ''}`);
          console.log(`[API] Response received for indicator ${indicatorId}:`, response ? 'Success' : 'No data');
          
          if (response && response.data) {
            let result = response.data;
            
            // If details requested, ensure we have daily data
            if (includeDetails && !result.dailyData) {
              // Generate 30-day data if API doesn't provide it
              result.dailyData = generate30DayData(result.value || 0, result.signal || 'neutral');
            }
            
            console.log(`[API] Returning real API data for indicator ${indicatorId}`);
            return NextResponse.json({
              data: result,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          // Get all indicators from API - try common endpoint patterns
          console.log('[API] Attempting to fetch all indicators from TokenMetrics API');
          
          // Use /trading-signals endpoint (available on free plan)
          // This provides trading signals that we can use as "indicators"
          const endpoint = '/trading-signals';
          console.log(`[API] Fetching from endpoint: ${endpoint}`);
          const response = await apiClient.request(endpoint);
          
          // TokenMetrics API returns: { success: true, message: "...", length: N, data: [...] }
          // API fields: TOKEN_ID, TOKEN_NAME, TOKEN_SYMBOL, DATE, TRADING_SIGNAL, TOKEN_TREND, TM_TRADER_GRADE, TM_INVESTOR_GRADE
          if (response && response.success && response.data && Array.isArray(response.data)) {
            // Transform trading signals data to match our Indicator format
            const signals = response.data;
            const indicators = signals.slice(0, 10).map((signal: any, index: number) => {
              // TRADING_SIGNAL: 1 = Buy, 0 = Hold, -1 = Sell
              const signalValue = signal.TRADING_SIGNAL || signal.trading_signal || 0;
              let signalType = 'neutral';
              if (signalValue === 1) signalType = 'bullish';
              if (signalValue === -1) signalType = 'bearish';
              
              return {
                id: (signal.TOKEN_SYMBOL || signal.token_symbol || `signal-${index}`).toLowerCase(),
                name: `${signal.TOKEN_NAME || signal.token_name || 'Trading Signal'} - ${signal.TOKEN_SYMBOL || ''}`,
                category: 'Trading Signal',
                value: signal.TM_TRADER_GRADE || signal.tm_trader_grade || signalValue,
                signal: signalType,
                timestamp: signal.DATE || signal.date || new Date().toISOString(),
              };
            });
            
            console.log(`[API] Returning real API data: ${indicators.length} trading signals as indicators`);
            return NextResponse.json({
              data: indicators,
              timestamp: new Date().toISOString(),
              source: 'api', // Flag to indicate real API data
            });
          } else {
            throw new Error('Invalid API response format');
          }
        }
      } catch (apiError: any) {
        console.log('[API] Real API call failed, falling back to mock data:', apiError.message);
        console.log('[API] Error details:', apiError);
        // Fall through to mock data
      }
    } else {
      console.log('[API] Using mock data - API client not available');
    }

    // Fallback to mock data
    if (indicatorId) {
      const indicators = generateMockIndicators();
      const indicator = indicators.find(i => i.id === indicatorId);
      
      if (!indicator) {
        return NextResponse.json(
          { error: 'Indicator not found' },
          { status: 404 }
        );
      }

      if (includeDetails) {
        const dailyData = generate30DayData(indicator.value, indicator.signal);
        const detail: IndicatorDetail = {
          ...indicator,
          dailyData,
        };
        
        return NextResponse.json({
          data: detail,
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        data: indicator,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all indicators (mock)
    const indicators = generateMockIndicators();
    
    return NextResponse.json({
      data: indicators,
      timestamp: new Date().toISOString(),
      source: 'mock', // Flag to indicate mock data
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

