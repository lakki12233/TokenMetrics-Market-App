/**
 * Configuration file for API keys and environment variables
 * 
 * This file centralizes all environment variable access,
 * making it easy to see what configuration is needed.
 * 
 * IMPORTANT: Never commit actual API keys to git!
 * Always use .env.local file for actual values.
 */

export const config = {
  // TokenMetrics API Configuration
  // Base URL: https://api.tokenmetrics.com/v2/
  // Authentication: x-api-key header
  api: {
    key: process.env.TOKENMETRICS_API_KEY || '',
    url: process.env.TOKENMETRICS_API_URL || 'https://api.tokenmetrics.com/v2',
  },

  // WebSocket Configuration (optional)
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || '',
  },

  // Rate Limiting Configuration
  rateLimit: {
    maxRequestsPerMinute: 20,
    maxMonthlyCalls: 500,
  },

  // Cache Configuration
  cache: {
    ttlMin: 60, // Minimum cache time in seconds
    ttlMax: 120, // Maximum cache time in seconds
  },
};

/**
 * Check if API key is configured
 */
export function isAPIConfigured(): boolean {
  return !!config.api.key;
}

/**
 * Get API key (throws error if not configured)
 */
export function getAPIKey(): string {
  if (!config.api.key) {
    throw new Error('TOKENMETRICS_API_KEY is not set in environment variables');
  }
  return config.api.key;
}

