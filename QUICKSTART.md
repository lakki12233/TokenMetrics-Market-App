# Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
TOKENMETRICS_API_KEY=your_api_key_here
TOKENMETRICS_API_URL=https://api.tokenmetrics.com
```

**Note**: For now, the app uses mock data, so you can use any placeholder value for the API key. When connecting to the real API, replace with your actual key.

## Step 3: Run the Development Server

```bash
npm run dev
```

## Step 4: Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## That's It! 🎉

You should now see:
- A beautiful gradient background
- Two tabs: "Indices" and "Indicators"
- Cards showing market data
- Click any card to see the 30-day detail view

## Optional: Enable WebSocket

Add this to your `.env.local`:

```env
NEXT_PUBLIC_WS_URL=wss://ws.tokenmetrics.com
```

A connection status indicator will appear in the bottom-right corner.

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy your app
- Review [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for an overview

## Troubleshooting

**Port 3000 already in use?**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Module not found errors?**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not working?**
- Make sure the file is named `.env.local` (not `.env`)
- Restart the dev server after changing `.env.local`

