# Vercel Deployment - Quick Steps

## ✅ Code is on GitHub
Repository: https://github.com/lakki12233/TokenMetrics-Market-App.git

## 🚀 Deploy to Vercel (5 minutes)

### Step 1: Go to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign in with your GitHub account

### Step 2: Import Project
1. Click **"Add New Project"**
2. Find and select: `lakki12233/TokenMetrics-Market-App`
3. Click **"Import"**

### Step 3: Configure Environment Variables
**THIS IS CRITICAL - Without these, the app won't work!**

1. In the project configuration, scroll to **"Environment Variables"**
2. Add these two variables:

   **Variable 1:**
   - Name: `TOKENMETRICS_API_KEY`
   - Value: `your_api_key_here` (replace with your actual API key)
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - Name: `TOKENMETRICS_API_URL`
   - Value: `https://api.tokenmetrics.com/v2`
   - Environments: ✅ Production ✅ Preview ✅ Development

3. Click **"Save"** after adding each variable

### Step 4: Deploy
1. Click **"Deploy"** button
2. Wait 1-2 minutes for build to complete
3. Your app will be live! 🎉

### Step 5: Verify
1. Visit your deployment URL (e.g., `https://token-metrics-market-app.vercel.app`)
2. You should see:
   - Real cryptocurrency data (not mock data)
   - Rate limit counter showing API usage
   - Working Indices and Indicators tabs

## 🔧 Troubleshooting

**If you see mock data:**
- Check that environment variables are set correctly in Vercel
- Make sure variables are enabled for Production environment
- Redeploy after adding variables

**If build fails:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try redeploying

## 📝 Next Steps

After deployment:
1. Share your live URL
2. Monitor API usage in TokenMetrics dashboard
3. Check Vercel analytics for traffic

---

**Your app is production-ready!** 🚀

