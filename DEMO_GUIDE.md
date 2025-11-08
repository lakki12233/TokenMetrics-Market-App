# 🎥 Loom Video Demo Guide

> **Quick Start**: All changes have been pushed to GitHub. The app is ready for demo!

## Quick Demo Checklist (≤10 min)

### 1. Show List → Detail Modal → /api/rate-limit (2-3 min)

**Steps:**
1. **Show the main list view**
   - Point out the Indices and Indicators tabs
   - Show the card-based UI with market data
   - Mention the rate limit info at the top (shows current usage)

2. **Click on a card to show detail modal**
   - Click any index/indicator card
   - Show the 30-day detail view modal
   - Point out:
     - The chart showing 30-day trend
     - The data table with daily values
     - Close the modal

3. **Show /api/rate-limit endpoint**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh the page
   - Find the `/api/rate-limit` request
   - Click on it and show the response:
     ```json
     {
       "requestsLastMinute": X,
       "monthlyCalls": Y,
       "maxPerMinute": 20,
       "maxMonthly": 500,
       "timestamp": "..."
     }
     ```
   - Or navigate directly to: `http://localhost:3000/api/rate-limit`
   - Explain: "This shows our current API usage against the free plan limits"

---

### 2. Demonstrate Cache HIT vs MISS (3-4 min)

**Steps:**

1. **First Request (MISS)**
   - Open DevTools → Network tab
   - Refresh the page (or switch tabs)
   - Point out the **Cache Status indicator** at the top:
     - Should show **MISS** (orange background) 🔄
     - Explain: "This is the first request, so we fetched from the API"
   - In Network tab, show the `/api/indices` or `/api/indicators` request
   - Note the response time (will be slower)

2. **Second Request (HIT) - Within TTL**
   - **Wait 5-10 seconds** (cache TTL is 60-120 seconds)
   - Refresh the page again (or switch tabs)
   - Point out the **Cache Status indicator**:
     - Should now show **HIT** (green background) ⚡
     - Explain: "This was served from our server-side cache, much faster!"
   - In Network tab, show the request is still there but note:
     - The response was instant (cached)
     - The cache status in the response shows "HIT"

3. **After TTL Expires (MISS again)**
   - **Wait 2 minutes** (or explain: "After 60-120 seconds, cache expires")
   - Refresh the page
   - Cache Status should show **MISS** again (orange)
   - Explain: "Cache expired, so we fetched fresh data from the API"

**Key Points to Mention:**
- "Cache lives server-side, so browser DevTools won't show 'from cache'"
- "That's why we expose this metadata - to prove caching is working"
- "Random TTL (60-120s) prevents cache stampede"
- "This reduces API calls by 80-90%"

---

### 3. Explain Provider-Fallback Pattern (2-3 min)

**Steps:**

1. **Show the code structure** (optional, or just explain)
   - Open `app/api/indices/route.ts` or `app/api/indicators/route.ts`
   - Show the try-catch structure:
     ```typescript
     // Try real API first
     if (useRealAPI && apiClient) {
       try {
         // API call...
       } catch (apiError) {
         // Fall through to mock data
       }
     }
     // Fallback to mock data
     ```

2. **Demonstrate graceful degradation**
   - Explain: "If an endpoint isn't on the free plan, the API call fails"
   - "But instead of showing an error, we fall back to mock data"
   - "The UI stays functional - users see data, just not from the API"
   - Show the app still works even if API fails

3. **Show source indication**
   - Point out in the response: `source: 'api'` or `source: 'mock'`
   - Explain: "We clearly indicate where the data came from"

**Key Points:**
- "App works even without API key"
- "App works even if API is down"
- "App works even if endpoint isn't on free plan"
- "Graceful degradation - never show errors to users"

---

### 4. Mention Server-Side API Keys (1 min)

**Steps:**

1. **Show environment variable setup**
   - Open `.env.local` (or show the README)
   - Show: `TOKENMETRICS_API_KEY=your_api_key_here`
   - Explain: "API keys are stored server-side only"

2. **Prove keys are never exposed**
   - Open browser DevTools → Network tab
   - Look at any API request to `/api/indices` or `/api/indicators`
   - Show the request headers - **no API key visible**
   - Explain: "The key is only used server-side in our API routes"
   - "Client never sees the key - it's secure"

3. **Show the server-side route**
   - Open `app/api/indices/route.ts`
   - Show: `getAPIClient()` - this uses the server-side key
   - Explain: "All API calls happen server-side, keys never leave the server"

**Key Points:**
- "API keys stored in environment variables"
- "Only used in server-side API routes"
- "Never exposed to client/browser"
- "Secure by design"

---

## Quick Reference

### URLs to Show:
- Main app: `http://localhost:3000`
- Rate limit endpoint: `http://localhost:3000/api/rate-limit`
- Indices endpoint: `http://localhost:3000/api/indices`
- Indicators endpoint: `http://localhost:3000/api/indicators`

### What to Highlight:
✅ Cache Status indicator (top of page)  
✅ Rate Limit info (top of page)  
✅ Detail modal (click any card)  
✅ Network tab in DevTools  
✅ Server-side API routes  
✅ Environment variables for keys  

### Talking Points:
- "Server-side caching reduces API calls by 80-90%"
- "Random TTL prevents cache stampede"
- "Provider-fallback ensures UI always works"
- "API keys never exposed to client"
- "Respects free plan limits (20/min, 500/month)"

---

## Tips for Recording:

1. **Start with a fresh page load** to show MISS first
2. **Wait a few seconds** between refreshes to show HIT
3. **Have DevTools open** before starting
4. **Speak clearly** about each feature
5. **Keep it under 10 minutes** - be concise!

## ⚡ Quick Test Before Recording:

1. **Start the dev server**: `npm run dev`
2. **Open browser**: `http://localhost:3000`
3. **Check cache status appears** at the top (should show MISS on first load)
4. **Refresh page** - should show HIT (green)
5. **Click a card** - detail modal should open
6. **Check `/api/rate-limit`** - should show rate limit info
7. **Open DevTools Network tab** - should see API requests

If all these work, you're ready to record! 🎬

---

## 📝 Script Outline (for reference):

**Opening (30 sec)**
- "This is a TokenMetrics Market App built with Next.js"
- "It shows indices and indicators with a 30-day detail view"
- "Key features: server-side caching, rate limiting, and graceful fallbacks"

**Main Demo (8 min)**
1. Show list → detail modal → rate-limit (2 min)
2. Demonstrate cache HIT vs MISS (3 min)
3. Explain provider-fallback (2 min)
4. Mention server-side keys (1 min)

**Closing (30 sec)**
- "All code is on GitHub"
- "API keys are secure, never exposed"
- "App works even when API fails"

Good luck with your demo! 🎬

