import { NextRequest, NextResponse } from 'next/server';
import { getAPIClient } from '@/lib/api-client';
import { getCoinGeckoClient } from '@/lib/coingecko-client';
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

    // Try CoinGecko API first (free, no API key required)
    try {
      const coingeckoClient = getCoinGeckoClient();
      
      if (indexId) {
        // Get specific coin data
        console.log(`[CoinGecko] Fetching coin: ${indexId}`);
        
        // Map common IDs to CoinGecko IDs
        const coinIdMap: Record<string, string> = {
          'btc-dominance': 'bitcoin',
          'eth-dominance': 'ethereum',
          'crypto-market-cap': 'bitcoin', // Use BTC as proxy for market cap
        };
        
        const coinId = coinIdMap[indexId.toLowerCase()] || indexId.toLowerCase();
        
        // Get coin market data - fetch top coins and find the one we need
        const marketResponse = await coingeckoClient.request('/coins/markets', {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          price_change_percentage: '24h',
        });
        
        // Find the specific coin
        const coin = Array.isArray(marketResponse.data) 
          ? marketResponse.data.find((c: any) => 
              c.id === coinId || 
              c.symbol?.toLowerCase() === coinId.toLowerCase() ||
              c.name?.toLowerCase().includes(coinId.toLowerCase())
            )
          : undefined;
        
        if (coin) {
          const price = coin.current_price || 0;
          const changePercent = coin.price_change_percentage_24h || 0;
          const change24h = price * (changePercent / 100);
          
          let result: IndexDetail = {
            id: coin.id || indexId,
            name: coin.name || indexId,
            symbol: coin.symbol?.toUpperCase() || 'N/A',
            value: price,
            change24h: change24h,
            changePercent24h: changePercent,
            dailyData: [],
          };
          
          // Get historical data if details requested
          if (includeDetails) {
            try {
              const historyResponse = await coingeckoClient.request(`/coins/${coinId}/history`, {
                date: new Date().toISOString().split('T')[0],
              });
              
              // Generate 30-day data from current price and change
              result.dailyData = generate30DayData(price, change24h);
            } catch (histError) {
              // Fallback to generated data
              result.dailyData = generate30DayData(price, change24h);
            }
          }
          
          console.log(`[CoinGecko] Returning data for ${indexId}`);
          return NextResponse.json({
            data: result,
            timestamp: new Date().toISOString(),
            source: 'coingecko',
            cacheStatus: marketResponse.cacheStatus || 'MISS',
          });
        }
      } else {
        // Get top coins as indices
        console.log('[CoinGecko] Fetching top coins');
        const marketResponse = await coingeckoClient.request('/coins/markets', {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          price_change_percentage: '24h',
        });
        
        if (marketResponse.data && Array.isArray(marketResponse.data)) {
          const indices: Index[] = marketResponse.data.map((coin: any) => {
            const price = coin.current_price || 0;
            const changePercent = coin.price_change_percentage_24h || 0;
            const change24h = price * (changePercent / 100);
            
            return {
              id: coin.id || coin.symbol?.toLowerCase() || 'unknown',
              name: coin.name || 'Unknown',
              symbol: coin.symbol?.toUpperCase() || 'N/A',
              value: price,
              change24h: change24h,
              changePercent24h: changePercent,
            };
          });
          
          console.log(`[CoinGecko] Returning ${indices.length} coins as indices`);
          return NextResponse.json({
            data: indices,
            timestamp: new Date().toISOString(),
            source: 'coingecko',
            cacheStatus: marketResponse.cacheStatus || 'MISS',
          });
        }
      }
    } catch (coingeckoError: any) {
      console.log('[CoinGecko] API call failed, trying TokenMetrics:', coingeckoError.message);
      // Fall through to TokenMetrics or mock data
    }

    // Try TokenMetrics API if configured
    let apiClient;
    let useRealAPI = false;
    
    try {
      apiClient = getAPIClient();
      useRealAPI = true;
    } catch (error) {
      console.log('TokenMetrics API client not available');
    }

    // Try to fetch from real API if available
    if (useRealAPI && apiClient) {
      try {
        if (indexId) {
          // Try to get specific index from API
          console.log(`[API] Attempting to fetch index: ${indexId}`);
          const response: any = await apiClient.request(`/indices/${indexId}${includeDetails ? '?details=true' : ''}`);
          console.log(`[API] Response received for index ${indexId}:`, response ? 'Success' : 'No data', `Cache: ${response?.cacheStatus || 'N/A'}`);
          
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
              cacheStatus: response.cacheStatus || 'MISS',
            });
          }
        } else {
          // Get all indices from API - try common endpoint patterns
          console.log('[API] Attempting to fetch all indices from TokenMetrics API');
          
          // Use /tokens endpoint (available on free plan)
          // This provides token data that we can use as "indices"
          const endpoint = '/tokens';
          console.log(`[API] Fetching from endpoint: ${endpoint}`);
          const apiResponse: any = await apiClient.request(endpoint);
          console.log(`[API] Cache status: ${apiResponse?.cacheStatus || 'N/A'}`);
          
          // TokenMetrics API returns: { success: true, message: "...", length: N, data: [...] }
          // API fields: TOKEN_ID, TOKEN_NAME, TOKEN_SYMBOL, CURRENT_PRICE, MARKET_CAP, PRICE_CHANGE_PERCENTAGE_24H_IN_CURRENCY
          const response = apiResponse.data;
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
              cacheStatus: apiResponse.cacheStatus || 'MISS',
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
        cacheStatus: 'N/A', // Mock data doesn't use cache
      });
      }

      return NextResponse.json({
        data: index,
        timestamp: new Date().toISOString(),
        cacheStatus: 'N/A', // Mock data doesn't use cache
      });
    }

    // Get all indices (mock)
    const indices = generateMockIndices();
    
    return NextResponse.json({
      data: indices,
      timestamp: new Date().toISOString(),
      source: 'mock', // Flag to indicate mock data
      cacheStatus: 'N/A', // Mock data doesn't use cache
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

