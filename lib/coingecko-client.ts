import axios, { AxiosInstance } from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * CoinGecko API Client
 * Free tier: 10-50 calls/minute (no API key required)
 * Documentation: https://www.coingecko.com/en/api
 */
class CoinGeckoClient {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MIN = 60; // 60 seconds
  private readonly CACHE_TTL_MAX = 120; // 120 seconds
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';

  constructor() {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log('[CoinGecko Client] Initialized (free tier, no API key required)');
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `coingecko:${endpoint}:${JSON.stringify(params || {})}`;
  }

  private getCacheTTL(): number {
    // Random TTL between 60-120 seconds
    return (Math.random() * (this.CACHE_TTL_MAX - this.CACHE_TTL_MIN) + this.CACHE_TTL_MIN) * 1000;
  }

  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any): void {
    const ttl = this.getCacheTTL();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  async request<T>(endpoint: string, params?: any): Promise<{ data: T; cacheStatus: 'HIT' | 'MISS' }> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached !== null) {
      return { data: cached as T, cacheStatus: 'HIT' };
    }

    try {
      // Make API request
      const response = await this.client.get(endpoint, { params });
      
      // Cache the response
      this.setCache(cacheKey, response.data);

      return { data: response.data as T, cacheStatus: 'MISS' };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinGecko API Error: ${error.response?.status} - ${error.message}`);
      }
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let coingeckoClientInstance: CoinGeckoClient | null = null;

export function getCoinGeckoClient(): CoinGeckoClient {
  if (!coingeckoClientInstance) {
    coingeckoClientInstance = new CoinGeckoClient();
  }
  return coingeckoClientInstance;
}

