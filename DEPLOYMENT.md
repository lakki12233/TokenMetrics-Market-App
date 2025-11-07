# Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `TOKENMETRICS_API_KEY`
     - `TOKENMETRICS_API_URL`
     - `NEXT_PUBLIC_WS_URL` (optional)
   - Click "Deploy"

3. **Your app will be live** at `https://your-project.vercel.app`

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

