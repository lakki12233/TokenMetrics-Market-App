# TokenMetrics Market App

A modern web application for displaying cryptocurrency Indices and Indicators with a 30-day detail view. Built with Next.js 14, featuring server-side API routes, intelligent caching, rate limiting, and optional WebSocket support.

## Features

- 📊 **Indices & Indicators Display**: View key market indices and technical indicators
- 📈 **30-Day Detail View**: Interactive charts and data tables showing 30 days of historical data
- ⚡ **Smart Caching**: Responses cached for 60-120 seconds to minimize API calls
- 🚦 **Rate Limiting**: Respects API plan limits (20 requests/minute, 500 calls/month)
- 🔄 **WebSocket Support**: Optional real-time data streaming (when configured)
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 🔒 **Server-Side API**: All API calls made server-side to protect API keys

## Tech Stack 

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules with modern design
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API

## Prerequisites

- Node.js 18+ and npm/yarn
- TokenMetrics API key

## Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd market-app_tokenmetrics
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   # Required: TokenMetrics API Key
   # Get your free API key from: https://developers.tokenmetrics.com
   TOKENMETRICS_API_KEY=your_api_key_here
   
   # Required: TokenMetrics API Base URL (v2)
   TOKENMETRICS_API_URL=https://api.tokenmetrics.com/v2
   
   # Optional: WebSocket URL for real-time updates
   NEXT_PUBLIC_WS_URL=wss://ws.tokenmetrics.com
   ```

   **Important Notes**:
   - The `.env.local` file is gitignored for security (never commit API keys!)
   - Get your free API key from [TokenMetrics Developer Portal](https://developers.tokenmetrics.com)
   - Free plan includes: 500 API calls/month, 20 requests/minute
   - The app uses provider-fallback pattern: tries real API first, falls back to mock data if unavailable

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Deployment

### Vercel (Recommended)

1. ✅ **Code is already on GitHub**: https://github.com/lakki12233/TokenMetrics-Market-App.git

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository: `lakki12233/TokenMetrics-Market-App`
   - Vercel will auto-detect Next.js

3. **Add Environment Variables** (IMPORTANT):
   - In Vercel project settings → Environment Variables
   - Add these variables:
     ```
     TOKENMETRICS_API_KEY=your_api_key_here
     TOKENMETRICS_API_URL=https://api.tokenmetrics.com/v2
     ```
   - **Important**: Replace `your_api_key_here` with your actual TokenMetrics API key
   - Optional: `NEXT_PUBLIC_WS_URL` (if you want WebSocket support)

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `https://your-project.vercel.app`

5. **Verify Deployment**:
   - Check that environment variables are set correctly
   - Test the app - it should fetch real data from TokenMetrics API

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

Make sure to set the environment variables in your platform's configuration.

## Caching Strategy

### Overview

The application implements a **multi-layered caching strategy** to optimize API usage while respecting rate limits and ensuring data freshness. This is critical for staying within the free plan limits (20 requests/minute, 500 calls/month).

### Cache Implementation

**Location**: `lib/api-client.ts`

**Key Features**:
- **TTL (Time To Live)**: Random between 60-120 seconds per request
  - **Why random?** Prevents cache stampede (all requests expiring simultaneously)
  - Ensures data refreshes within the required timeframe (60-120 seconds)
  - Each cached response gets a unique expiration time
- **In-Memory Cache**: Uses a `Map` data structure for fast O(1) lookups
- **Automatic Expiration**: Cache entries automatically expire and are cleaned up
- **Cache Key Generation**: Based on endpoint + query parameters for uniqueness

### Cache Flow Diagram

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │ (/api/indices or /api/indicators)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Client     │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ Check   │
    │ Cache   │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│ HIT  │  │   MISS   │
└──┬───┘  └────┬─────┘
   │           │
   │           ▼
   │      ┌─────────────┐
   │      │ Check Rate  │
   │      │ Limits      │
   │      └──────┬──────┘
   │             │
   │             ▼
   │      ┌─────────────┐
   │      │ Make API    │
   │      │ Call        │
   │      └──────┬──────┘
   │             │
   │             ▼
   │      ┌─────────────┐
   │      │ Cache       │
   │      │ Response    │
   │      └──────┬──────┘
   │             │
   └─────────────┘
         │
         ▼
┌─────────────────┐
│ Return Data     │
└─────────────────┘
```

### Cache Key Structure

Cache keys are generated from:
- **Endpoint path** (e.g., `/tokens`, `/trading-signals`)
- **Query parameters** (e.g., `?id=btc-dominance&details=true`)

**Example Cache Keys**:
```
tokens:{}
trading-signals:{}
indices:{"id":"btc-dominance","details":true}
```

**Implementation**:
```typescript
// From lib/api-client.ts
private getCacheKey(endpoint: string, params?: any): string {
  return `${endpoint}:${JSON.stringify(params || {})}`;
}
```

### Rate Limiting Strategy

The application enforces **two levels of rate limiting** to respect TokenMetrics API plan limits:

#### 1. Per-Minute Limit: 20 requests/minute
- **Implementation**: Sliding window algorithm
- Tracks request timestamps in an array
- Automatically cleans up timestamps older than 1 minute
- Blocks requests if 20+ requests made in the last 60 seconds

#### 2. Monthly Limit: 500 calls/month
- **Implementation**: Counter with automatic monthly reset
- Tracks total API calls made in current month
- Resets automatically at the start of each month
- Blocks requests if monthly limit reached

**Rate Limit Check Flow**:
```typescript
1. Check monthly limit (500 calls/month)
   └─ If exceeded → Return error
   
2. Clean old requests (older than 1 minute)
   
3. Check per-minute limit (20 requests/minute)
   └─ If exceeded → Return error
   
4. Allow request → Make API call → Update counters
```

### Cache Benefits & Performance

- ✅ **Reduces API calls by 80-90%** (depending on traffic patterns)
- ✅ **Faster response times** (cached responses are instant)
- ✅ **Prevents hitting rate limits** (stays well within free tier)
- ✅ **Cost-effective** (minimal API usage)
- ✅ **Better user experience** (faster page loads)

### Cache Invalidation

Caches are automatically invalidated when:

1. **TTL Expires** (60-120 seconds)
   - Each cache entry has a unique expiration time
   - Expired entries are removed on next access

2. **Server Restart**
   - In-memory cache is cleared (all data lost)
   - Fresh cache starts on next request

3. **Manual Clear** (for development/testing):
   ```typescript
   import { getAPIClient } from '@/lib/api-client';
   const client = getAPIClient();
   client.clearCache();
   ```

### Provider-Fallback Pattern

The application uses a **provider-fallback pattern** for maximum reliability:

```
1. Try Real API First
   ├─ Check if API key is configured
   ├─ Attempt to fetch from TokenMetrics API
   └─ Transform API response to app format
   
2. If API Fails
   ├─ Log error for debugging
   └─ Fall through to mock data
   
3. Mock Data Fallback (Always Available)
   ├─ generateMockIndices() - for indices
   ├─ generateMockIndicators() - for indicators
   └─ generate30DayData() - for 30-day detail view
```

**Benefits**:
- ✅ App works even without API key (uses mock data)
- ✅ App works even if API is down (graceful degradation)
- ✅ App works even if API key is invalid (falls back to mock)
- ✅ Clear source indication (`source: 'api'` or `source: 'mock'`)

### Configuration

Cache settings are configured in `lib/config.ts`:

```typescript
cache: {
  ttlMin: 60,  // Minimum cache time in seconds
  ttlMax: 120, // Maximum cache time in seconds
}
```

Rate limit settings:
```typescript
rateLimit: {
  maxRequestsPerMinute: 20,  // Matches TokenMetrics free plan
  maxMonthlyCalls: 500,      // Matches TokenMetrics free plan
}
```

## API Routes

### `/api/indices`

Get all indices or a specific index with details.

**Query Parameters**:
- `id` (optional): Index ID to fetch specific index
- `details` (optional): Set to `true` to include 30-day data

**Examples**:
```
GET /api/indices
GET /api/indices?id=btc-dominance
GET /api/indices?id=btc-dominance&details=true
```

### `/api/indicators`

Get all indicators or a specific indicator with details.

**Query Parameters**:
- `id` (optional): Indicator ID to fetch specific indicator
- `details` (optional): Set to `true` to include 30-day data

**Examples**:
```
GET /api/indicators
GET /api/indicators?id=rsi-btc
GET /api/indicators?id=rsi-btc&details=true
```

### `/api/rate-limit`

Get current rate limit status.

**Response**:
```json
{
  "requestsLastMinute": 5,
  "monthlyCalls": 42,
  "maxPerMinute": 20,
  "maxMonthly": 500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## WebSocket Support (Optional)

The application includes optional WebSocket support for real-time data streaming.

### Configuration

1. Add `NEXT_PUBLIC_WS_URL` to your `.env.local`:
   ```env
   NEXT_PUBLIC_WS_URL=wss://ws.tokenmetrics.com
   ```

2. The WebSocket client will automatically connect when the app loads
3. A connection status indicator appears in the bottom-right corner

### WebSocket Client

**Location**: `lib/websocket-client.ts`

**Features**:
- Automatic reconnection (up to 5 attempts)
- Message routing by type
- Connection status monitoring

**Usage**:
```typescript
import { getWebSocketClient } from '@/lib/websocket-client';

const ws = getWebSocketClient();
await ws.connect();

ws.subscribe('indices-update', (data) => {
  console.log('Indices updated:', data);
});
```

## Project Structure

```
market-app_tokenmetrics/
├── app/
│   ├── api/
│   │   ├── indices/
│   │   │   └── route.ts          # Indices API endpoint
│   │   ├── indicators/
│   │   │   └── route.ts          # Indicators API endpoint
│   │   ├── rate-limit/
│   │   │   └── route.ts          # Rate limit status endpoint
│   │   └── ws/
│   │       └── route.ts          # WebSocket endpoint (placeholder)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   └── WebSocketStatus.tsx       # WebSocket connection status
├── lib/
│   ├── api-client.ts             # API client with caching & rate limiting
│   ├── types.ts                  # TypeScript type definitions
│   └── websocket-client.ts       # WebSocket client
├── .env.example                  # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## Development Notes

### Real API Integration

The application **automatically uses real TokenMetrics API data** when:
- API key is configured in `.env.local`
- API key is valid and has access to endpoints
- API endpoints are accessible

**Current Implementation**:
- **Indices**: Uses `/tokens` endpoint (available on free plan)
- **Indicators**: Uses `/trading-signals` endpoint (available on free plan)
- **Provider-Fallback**: Automatically falls back to mock data if API fails

### Mock Data (Fallback)

Mock data generators are **always available** as a fallback:
- Used when API key is not configured
- Used when API calls fail
- Used when API endpoints are unavailable
- Ensures app always works, even without API access

**Mock Data Functions**:
- `generateMockIndices()` - Generates sample index data
- `generateMockIndicators()` - Generates sample indicator data
- `generate30DayData()` - Generates 30-day historical data

**To Force Mock Data Mode**:
- Remove or comment out `TOKENMETRICS_API_KEY` in `.env.local`
- App will automatically use mock data

### API Response Format

The application transforms TokenMetrics API responses to match the app's format:

**TokenMetrics API Response** (`/tokens` endpoint):
```json
{
  "success": true,
  "message": "Success",
  "length": 50,
  "data": [
    {
      "TOKEN_ID": 1,
      "TOKEN_NAME": "Bitcoin",
      "TOKEN_SYMBOL": "BTC",
      "CURRENT_PRICE": 43250.50,
      "PRICE_CHANGE_PERCENTAGE_24H_IN_CURRENCY": 2.35,
      "MARKET_CAP": 850000000000
    }
  ]
}
```

**Transformed to App Format**:
```json
{
  "data": [
    {
      "id": "btc",
      "name": "Bitcoin",
      "symbol": "BTC",
      "value": 43250.50,
      "change24h": 1016.39,
      "changePercent24h": 2.35
    }
  ],
  "source": "api"
}
```

**Trading Signals API Response** (`/trading-signals` endpoint):
```json
{
  "success": true,
  "data": [
    {
      "TOKEN_ID": 1,
      "TOKEN_NAME": "Bitcoin",
      "TOKEN_SYMBOL": "BTC",
      "TRADING_SIGNAL": 1,
      "TM_TRADER_GRADE": "A",
      "DATE": "2025-11-06T00:00:00.000Z"
    }
  ]
}
```

**Transformed to App Format**:
```json
{
  "data": [
    {
      "id": "btc",
      "name": "Bitcoin - BTC",
      "category": "Trading Signal",
      "value": "A",
      "signal": "bullish",
      "timestamp": "2025-11-06T00:00:00.000Z"
    }
  ],
  "source": "api"
}
```

## Performance Considerations

- **Caching**: Reduces API load by 80-90%
- **Server-Side Rendering**: Initial page load is fast
- **Client-Side Navigation**: Smooth transitions between views
- **Optimized Images**: (If images are added in the future)

## Security

- ✅ API keys stored server-side only (never exposed to client)
- ✅ Environment variables in `.env.local` (gitignored)
- ✅ Rate limiting prevents abuse
- ✅ Input validation on API routes

## Troubleshooting

### API Key Not Working

1. Verify `TOKENMETRICS_API_KEY` is set in `.env.local`
2. Restart the development server after changing `.env.local`
3. Check API key permissions in TokenMetrics dashboard

### Rate Limit Errors

- The app automatically handles rate limits
- Check `/api/rate-limit` endpoint for current status
- Wait for cache to refresh (60-120 seconds)

### WebSocket Not Connecting

1. Verify `NEXT_PUBLIC_WS_URL` is set correctly
2. Check WebSocket URL is accessible
3. Check browser console for connection errors

## License

This project is created for demonstration purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors

---

**Built with using Next.js**

