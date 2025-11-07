import { NextRequest, NextResponse } from 'next/server';
import { getAPIClient } from '@/lib/api-client';
import { Index, IndexDetail, DailyDataPoint } from '@/lib/types';

// Mock data generator for demonstration
// In production, this would call the actual TokenMetrics API
function generateMockIndices(): Index[] {
  return [
    {
      id: 'btc-dominance',
      name: 'Bitcoin Dominance',
      symbol: 'BTC.D',
      value: 52.34,
      change24h: 1.2,
      changePercent24h: 2.35,
    },
    {
      id: 'eth-dominance',
      name: 'Ethereum Dominance',
      symbol: 'ETH.D',
      value: 18.76,
      change24h: -0.5,
      changePercent24h: -2.6,
    },
    {
      id: 'crypto-market-cap',
      name: 'Total Market Cap',
      symbol: 'TOTAL',
      value: 2450000000000,
      change24h: 50000000000,
      changePercent24h: 2.08,
    },
    {
      id: 'fear-greed',
      name: 'Fear & Greed Index',
      symbol: 'FGI',
      value: 65,
      change24h: 5,
      changePercent24h: 8.33,
    },
  ];
}

function generate30DayData(baseValue: number, baseChange: number): DailyDataPoint[] {
  const data: DailyDataPoint[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const value = baseValue * (1 + variation);
    const change = baseChange * (1 + variation);
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
    const indexId = searchParams.get('id');
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
        if (indexId) {
          // Try to get specific index from API
          console.log(`[API] Attempting to fetch index: ${indexId}`);
          const response: any = await apiClient.request(`/indices/${indexId}${includeDetails ? '?details=true' : ''}`);
          console.log(`[API] Response received for index ${indexId}:`, response ? 'Success' : 'No data');
          
          if (response && response.data) {
            let result = response.data;
            
            // If details requested, ensure we have daily data
            if (includeDetails && !result.dailyData) {
              // Generate 30-day data if API doesn't provide it
              result.dailyData = generate30DayData(result.value || 0, result.change24h || 0);
            }
            
            console.log(`[API] Returning real API data for index ${indexId}`);
            return NextResponse.json({
              data: result,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          // Get all indices from API - try common endpoint patterns
          console.log('[API] Attempting to fetch all indices from TokenMetrics API');
          
          // Use /tokens endpoint (available on free plan)
          // This provides token data that we can use as "indices"
          const endpoint = '/tokens';
          console.log(`[API] Fetching from endpoint: ${endpoint}`);
          const response = await apiClient.request(endpoint);
          
          // TokenMetrics API returns: { success: true, message: "...", length: N, data: [...] }
          // API fields: TOKEN_ID, TOKEN_NAME, TOKEN_SYMBOL, CURRENT_PRICE, MARKET_CAP, PRICE_CHANGE_PERCENTAGE_24H_IN_CURRENCY
          if (response && response.success && response.data && Array.isArray(response.data)) {
            // Transform token data to match our Index format
            const tokens = response.data;
            const indices = tokens.slice(0, 10).map((token: any, index: number) => {
              const price = token.CURRENT_PRICE || token.current_price || 0;
              const changePercent = token.PRICE_CHANGE_PERCENTAGE_24H_IN_CURRENCY || token.price_change_percentage_24h_in_currency || 0;
              const change24h = price * (changePercent / 100);
              
              return {
                id: (token.TOKEN_SYMBOL || token.token_symbol || `token-${index}`).toLowerCase(),
                name: token.TOKEN_NAME || token.token_name || token.TOKEN_SYMBOL || 'Unknown Token',
                symbol: token.TOKEN_SYMBOL || token.token_symbol || 'N/A',
                value: price,
                change24h: change24h,
                changePercent24h: changePercent,
              };
            });
            
            console.log(`[API] Returning real API data: ${indices.length} tokens as indices`);
            return NextResponse.json({
              data: indices,
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
    if (indexId) {
      const indices = generateMockIndices();
      const index = indices.find(i => i.id === indexId);
      
      if (!index) {
        return NextResponse.json(
          { error: 'Index not found' },
          { status: 404 }
        );
      }

      if (includeDetails) {
        const dailyData = generate30DayData(index.value, index.change24h);
        const detail: IndexDetail = {
          ...index,
          dailyData,
        };
        
        return NextResponse.json({
          data: detail,
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        data: index,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all indices (mock)
    const indices = generateMockIndices();
    
    return NextResponse.json({
      data: indices,
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

