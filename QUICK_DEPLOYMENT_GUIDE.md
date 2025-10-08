# 🚀 Quick Deployment Guide - Frontend First Approach

## Option 1: Deploy Frontend Only (Immediate Deployment)

This approach deploys the frontend immediately using the existing Vercel serverless functions for data, with WebSocket disabled initially.

### Step 1: Deploy to Vercel Now

```bash
# Deploy with current configuration (WebSocket disabled)
vercel --prod
```

### Step 2: Set Environment Variables in Vercel

**Via Vercel Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables for **Production**:

```
VITE_SUPABASE_PROJECT_ID=msesvmlvhrhdipfbhvub
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXN2bWx2aHJoZGlwZmJodnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjI3MTgsImV4cCI6MjA3NDk5ODcxOH0.zKI8WiWI_cXr-VLNI0D_0MV-6cCzdwyLDtljn2Y6BTg
VITE_SUPABASE_URL=https://msesvmlvhrhdipfbhvub.supabase.co
VITE_GEMINI_API_KEY=AIzaSyAHyobQ2yx31m2CmSKM12wnRzC8midqaTM
VITE_ALPHA_VANTAGE_API_KEY=9CEB9GT75EIDBGRE
VITE_TWELVE_DATA_API_KEY=fe075c59fc2946d5b04940fa20e9be57
VITE_API_BASE_URL=
VITE_WS_URL=ws://localhost:8081
VITE_ENABLE_WEBSOCKET=false
VITE_FALLBACK_TO_POLLING=true
VITE_WS_RECONNECT_INTERVAL=5000
```

### Step 3: Redeploy
```bash
vercel --prod
```

**✅ Your app is now live with:**
- Full stock market data via Vercel serverless functions
- AI-powered insights
- Portfolio and watchlist management
- Polling-based updates (30-second intervals)

---

## Option 2: Full Deployment with Real-Time Features

### Step 1: Deploy WebSocket Server to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to WebSocket server
cd backend-ws

# Create new project
railway init

# Deploy
railway up
```

**Get your Railway WebSocket URL** (something like: `your-app-name.railway.app`)

### Step 2: Deploy .NET Backend (Optional)

**For Azure:**
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name stock-tracker-rg --location eastus

# Create app service plan
az appservice plan create --name stock-tracker-plan --resource-group stock-tracker-rg --sku B1

# Create web app
az webapp create --name your-stock-tracker-api --resource-group stock-tracker-rg --plan stock-tracker-plan --runtime "DOTNET|8.0"

# Deploy
cd backend/StockTracker.API
dotnet publish -c Release -o ./publish
az webapp deployment source config-zip --resource-group stock-tracker-rg --name your-stock-tracker-api --src publish.zip
```

### Step 3: Update Environment Variables

Update your `.env` file:
```bash
VITE_API_BASE_URL=https://your-stock-tracker-api.azurewebsites.net
VITE_WS_URL=wss://your-app-name.railway.app
VITE_ENABLE_WEBSOCKET=true
```

### Step 4: Deploy to Vercel

```bash
vercel --prod
```

---

## Option 3: Serverless-Only Deployment (Recommended for MVP)

Keep everything on Vercel using serverless functions:

### Current Setup (Already Working):
- ✅ Market data via `api/nse-live-data.ts`
- ✅ Alpha Vantage via `api/alpha-vantage.ts` 
- ✅ Twelve Data via `api/twelve-data.ts`
- ✅ Database via Supabase
- ✅ AI via Google Gemini

### Benefits:
- 🚀 **Instant deployment** - no backend servers to manage
- 💰 **Cost-effective** - Vercel free tier covers most usage
- 🔧 **Zero maintenance** - serverless auto-scales
- 🛡️ **Secure** - no exposed servers

### Deploy Now:
```bash
vercel --prod
```

---

## 🎯 Recommended Approach: Start with Option 1

1. **Deploy frontend immediately** with Option 1
2. **Test everything works** with polling-based updates
3. **Later upgrade** to real-time WebSocket when needed

### Why This Approach?

- ✅ **Get to market faster** - deploy in minutes
- ✅ **Validate user demand** before investing in infrastructure
- ✅ **30-second updates** are sufficient for most users
- ✅ **Easy to upgrade** to real-time later

---

## 🚀 Deploy Commands (Copy & Paste)

### Immediate Deployment:
```bash
# Deploy to Vercel now
vercel --prod

# Set environment variables (via dashboard or CLI)
# Then redeploy
vercel --prod
```

### With WebSocket Server:
```bash
# Deploy WebSocket server
cd backend-ws
railway login
railway init
railway up

# Update .env with Railway URL
# Deploy frontend
cd ..
vercel --prod
```

---

## 📞 Need Help?

If you encounter any issues:

1. **Check Vercel deployment logs** in dashboard
2. **Verify environment variables** are set correctly
3. **Test API endpoints** work in browser
4. **Check browser console** for errors

Your app is ready to deploy! Choose the option that best fits your timeline and requirements. 🚀