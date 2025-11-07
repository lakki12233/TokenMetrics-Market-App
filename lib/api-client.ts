import axios, { AxiosInstance } from 'axios';
import { config } from './config';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface RateLimitState {
  requests: number[];
  monthlyCalls: number;
  lastReset: number;
}

class APIClient {
  private client: AxiosInstance | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimitState: RateLimitState = {
    requests: [],
    monthlyCalls: 0,
    lastReset: Date.now(),
  };
  
  // Rate limits from config
  private readonly MAX_REQUESTS_PER_MINUTE = config.rateLimit.maxRequestsPerMinute;
  private readonly MAX_MONTHLY_CALLS = config.rateLimit.maxMonthlyCalls;
  private readonly CACHE_TTL_MIN = config.cache.ttlMin; // Minimum 60 seconds
  private readonly CACHE_TTL_MAX = config.cache.ttlMax; // Maximum 120 seconds

  constructor() {
    // Get API configuration from config file
    const apiKey = config.api.key;
    const apiUrl = config.api.url;

    // Allow initialization without API key for mock data mode
    // The client will only be created if API key is provided
    // TokenMetrics API uses x-api-key header (not Authorization Bearer)
    if (apiKey) {
      this.client = axios.create({
        baseURL: apiUrl,
        headers: {
          'x-api-key': apiKey, // TokenMetrics uses x-api-key header
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      console.log('[API Client] Initialized with API key');
    } else {
      console.log('[API Client] No API key provided - mock data mode');
    }

    // Reset monthly counter if it's a new month
    this.checkMonthlyReset();
  }

  private checkMonthlyReset(): void {
    const now = new Date();
    const lastReset = new Date(this.rateLimitState.lastReset);
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      this.rateLimitState.monthlyCalls = 0;
      this.rateLimitState.lastReset = Date.now();
    }
  }

  private canMakeRequest(): { allowed: boolean; reason?: string } {
    this.checkMonthlyReset();

    // Check monthly limit
    if (this.rateLimitState.monthlyCalls >= this.MAX_MONTHLY_CALLS) {
      return { allowed: false, reason: 'Monthly API call limit reached (500 calls/month)' };
    }

    // Clean old requests (older than 1 minute)
    const oneMinuteAgo = Date.now() - 60000;
    this.rateLimitState.requests = this.rateLimitState.requests.filter(
      timestamp => timestamp > oneMinuteAgo
    );

    // Check per-minute limit
    if (this.rateLimitState.requests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return { allowed: false, reason: 'Rate limit exceeded (20 requests/minute)' };
    }

    return { allowed: true };
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
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

  async request<T>(endpoint: string, params?: any): Promise<T> {
    if (!this.client) {
      throw new Error('API client not initialized. TOKENMETRICS_API_KEY is required for real API calls.');
    }

    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached !== null) {
      return cached as T;
    }

    // Check rate limits
    const { allowed, reason } = this.canMakeRequest();
    if (!allowed) {
      throw new Error(reason || 'Rate limit exceeded');
    }

    try {
      // Make API request
      const response = await this.client.get(endpoint, { params });
      
      // Update rate limit state
      this.rateLimitState.requests.push(Date.now());
      this.rateLimitState.monthlyCalls++;

      // Cache the response
      this.setCache(cacheKey, response.data);

      return response.data as T;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
      }
      throw error;
    }
  }

  getRateLimitInfo(): { 
    requestsLastMinute: number; 
    monthlyCalls: number; 
    maxPerMinute: number; 
    maxMonthly: number;
  } {
    this.checkMonthlyReset();
    
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.rateLimitState.requests.filter(
      timestamp => timestamp > oneMinuteAgo
    );

    return {
      requestsLastMinute: recentRequests.length,
      monthlyCalls: this.rateLimitState.monthlyCalls,
      maxPerMinute: this.MAX_REQUESTS_PER_MINUTE,
      maxMonthly: this.MAX_MONTHLY_CALLS,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let apiClientInstance: APIClient | null = null;

export function getAPIClient(): APIClient {
  if (!apiClientInstance) {
    apiClientInstance = new APIClient();
  }
  return apiClientInstance;
}

