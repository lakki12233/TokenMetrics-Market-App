# Deployment Guide

## Quick Deploy to Vercel

✅ **Step 1: Code is already on GitHub**
   - Repository: https://github.com/lakki12233/TokenMetrics-Market-App.git
   - All code has been pushed successfully

**Step 2: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub

2. Click **"Add New Project"** or **"Import Project"**

3. Select your repository: `lakki12233/TokenMetrics-Market-App`

4. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables** (CRITICAL):
   - Click "Environment Variables"
   - Add these variables:
     ```
     TOKENMETRICS_API_KEY = your_api_key_here
     TOKENMETRICS_API_URL = https://api.tokenmetrics.com/v2
     ```
   - **Important**: Replace `your_api_key_here` with your actual TokenMetrics API key
   - Make sure to select all environments: Production, Preview, Development
   - Click "Save"

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (usually 1-2 minutes)
   - Your app will be live at `https://token-metrics-market-app.vercel.app` (or similar)

**Step 3: Verify Deployment**

1. Visit your deployed URL
2. Check that data is loading (should show real TokenMetrics data)
3. Check browser console for any errors
4. Verify rate limit counter is working

## Environment Variables

Make sure to set these in your deployment platform:

### Required
- `TOKENMETRICS_API_KEY`: Your TokenMetrics API key

### Optional
- `TOKENMETRICS_API_URL`: API base URL (defaults to `https://api.tokenmetrics.com`)
- `NEXT_PUBLIC_WS_URL`: WebSocket URL for real-time updates

## Other Deployment Options

### Netlify

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Railway

1. Connect your GitHub repository
2. Railway will auto-detect Next.js
3. Add environment variables in Railway dashboard
4. Deploy!

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Then:
```bash
docker build -t market-app .
docker run -p 3000:3000 --env-file .env.local market-app
```

