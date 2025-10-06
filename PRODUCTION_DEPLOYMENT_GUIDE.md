# 🚀 Production Deployment Guide

Complete guide to deploy Stock Tracker with full real-time capabilities.

## 📋 Overview

This guide will help you deploy:
- ✅ Frontend on Vercel (React/Vite)
- ✅ Backend API on Railway (.NET)
- ✅ WebSocket Server on Railway (Node.js)
- ✅ Redis on Upstash (Managed Redis)

**Total Time:** 1-2 hours  
**Total Cost:** $0/month (free tiers)

---

## 🎯 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (sign up at vercel.com)
- [ ] Railway account (sign up at railway.app)
- [ ] Upstash account (sign up at upstash.com)
- [ ] Code pushed to GitHub repository

---

## 📝 Step-by-Step Deployment

### Step 1: Deploy Redis (Upstash) - 10 minutes

#### 1.1 Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up with GitHub
3. Verify your email

#### 1.2 Create Redis Database
1. Click "Create Database"
2. **Name:** `stock-tracker-redis`
3. **Type:** Regional
4. **Region:** Choose closest to you (e.g., us-east-1)
5. **TLS:** Enabled (default)
6. Click "Create"

#### 1.3 Get Connection Details
1. Click on your database
2. Copy these values:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
3. Also note the connection string format:
   ```
   redis://default:[password]@[host]:[port]
   ```

#### 1.4 Test Connection (Optional)
```bash
# Install redis-cli if you want to test
redis-cli -u "redis://default:[password]@[host]:[port]" --tls ping
# Should return: PONG
```

✅ **Checkpoint:** You have Redis connection details ready

---

### Step 2: Deploy Backend API (Railway) - 20 minutes

#### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories

#### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your stock-tracker repository
4. Railway will detect it's a monorepo

#### 2.3 Configure .NET Service
1. Click "Add Service" → "GitHub Repo"
2. **Root Directory:** `backend/StockTracker.API`
3. **Build Command:** Leave empty (Railway auto-detects)
4. **Start Command:** Leave empty (Railway auto-detects)

#### 2.4 Add Environment Variables
Click on your service → "Variables" → "Raw Editor" and paste:

```env
# Database (if using PostgreSQL)
ConnectionStrings__DefaultConnection=your_postgres_url_here

# Redis
ConnectionStrings__Redis=redis://default:[password]@[host]:[port]

# API Keys
AlphaVantage__ApiKey=9CEB9GT75EIDBGRE
TwelveData__ApiKey=fe075c59fc2946d5b04940fa20e9be57

# CORS - Update after Vercel deployment
Cors__AllowedOrigins__0=http://localhost:8080
Cors__AllowedOrigins__1=https://your-app.vercel.app

# Redis Channels
Redis__ChannelUpdates=market-data:updates
Redis__ChannelSubscriptions=market-data:subscriptions
Redis__ChannelControl=market-data:control

# Logging
Serilog__MinimumLevel__Default=Information
Serilog__MinimumLevel__Override__Microsoft=Warning

# Environment
ASPNETCORE_ENVIRONMENT=Production
```

#### 2.5 Deploy
1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Check logs for any errors

#### 2.6 Get API URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://stock-tracker-api.up.railway.app`)

#### 2.7 Test API
```bash
# Test health endpoint
curl https://your-api-url.railway.app/health

# Should return: {"status":"Healthy"}
```

✅ **Checkpoint:** Backend API is deployed and responding

---

### Step 3: Deploy WebSocket Server (Railway) - 15 minutes

#### 3.1 Add WebSocket Service
1. In same Railway project, click "New Service"
2. Select "GitHub Repo"
3. Choose same repository
4. **Root Directory:** `backend-ws`

#### 3.2 Configure Build Settings
1. **Build Command:** `npm install`
2. **Start Command:** `node server.js`

#### 3.3 Add Environment Variables
Click "Variables" → "Raw Editor" and paste:

```env
# Server
WS_PORT=8081
NODE_ENV=production

# Backend API
API_BASE=https://your-api-url.railway.app

# Redis (from Upstash)
REDIS_HOST=your-upstash-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
REDIS_TLS=true

# Redis Channels
REDIS_CHANNEL_UPDATES=market-data:updates
REDIS_CHANNEL_SUBSCRIPTIONS=market-data:subscriptions
REDIS_CHANNEL_CONTROL=market-data:control

# CORS - Update after Vercel deployment
ALLOWED_ORIGINS=http://localhost:8080,https://your-app.vercel.app
```

#### 3.4 Deploy
1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Check logs

#### 3.5 Get WebSocket URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy URL (e.g., `https://stock-tracker-ws.up.railway.app`)
4. **Note:** Use `wss://` for WebSocket connections

#### 3.6 Test WebSocket
```bash
# Test health endpoint
curl https://your-ws-url.railway.app:8082/health

# Should return connection stats
```

✅ **Checkpoint:** WebSocket server is deployed

---

### Step 4: Deploy Frontend (Vercel) - 15 minutes

#### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

#### 4.2 Import Project
1. Click "Add New" → "Project"
2. Import your GitHub repository
3. Vercel auto-detects Vite

#### 4.3 Configure Build Settings
- **Framework Preset:** Vite
- **Root Directory:** `./` (leave as root)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### 4.4 Add Environment Variables
Click "Environment Variables" and add:

```env
# Supabase
VITE_SUPABASE_PROJECT_ID=msesvmlvhrhdipfbhvub
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXN2bWx2aHJoZGlwZmJodnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjI3MTgsImV4cCI6MjA3NDk5ODcxOH0.zKI8WiWI_cXr-VLNI0D_0MV-6cCzdwyLDtljn2Y6BTg
VITE_SUPABASE_URL=https://msesvmlvhrhdipfbhvub.supabase.co

# AI & Market Data APIs
VITE_GEMINI_API_KEY=AIzaSyAHyobQ2yx31m2CmSKM12wnRzC8midqaTM
VITE_ALPHA_VANTAGE_API_KEY=9CEB9GT75EIDBGRE
VITE_TWELVE_DATA_API_KEY=fe075c59fc2946d5b04940fa20e9be57

# Backend Services (from Railway)
VITE_API_BASE_URL=https://your-api-url.railway.app
VITE_WS_URL=wss://your-ws-url.railway.app

# Configuration
VITE_ENABLE_WEBSOCKET=true
VITE_FALLBACK_TO_POLLING=true
VITE_WS_RECONNECT_INTERVAL=5000
VITE_APP_ENV=production
```

#### 4.5 Deploy
1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Vercel will provide a URL

#### 4.6 Get Deployment URL
1. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. You'll need this for CORS configuration

✅ **Checkpoint:** Frontend is deployed

---

### Step 5: Update CORS Configuration - 10 minutes

Now that you have the Vercel URL, update CORS settings:

#### 5.1 Update Backend API CORS
1. Go to Railway → Backend API service
2. Click "Variables"
3. Update:
   ```env
   Cors__AllowedOrigins__1=https://your-app.vercel.app
   ```
4. Redeploy service

#### 5.2 Update WebSocket Server CORS
1. Go to Railway → WebSocket service
2. Click "Variables"
3. Update:
   ```env
   ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:8080
   ```
4. Redeploy service

✅ **Checkpoint:** CORS is configured

---

### Step 6: End-to-End Testing - 15 minutes

#### 6.1 Test Complete Flow
1. Open your Vercel URL
2. Open browser DevTools (F12)
3. Go to Console tab

**Check for:**
- ✅ No CORS errors
- ✅ WebSocket connection established
- ✅ "Connected to Stock Tracker WebSocket" message
- ✅ Real-time price updates appearing

#### 6.2 Test Features
- [ ] Homepage loads
- [ ] Login/signup works
- [ ] Dashboard displays stocks
- [ ] Live Market page shows real-time updates
- [ ] Portfolio management works
- [ ] Watchlist works
- [ ] AI analysis works

#### 6.3 Test Connection Status
1. Go to Live Market page
2. Check connection indicator (top-right)
3. Should show "Connected" with green indicator
4. Should show latency metrics

#### 6.4 Test Error Recovery
1. Temporarily stop WebSocket service in Railway
2. Frontend should show "Reconnecting..."
3. Should fall back to polling
4. Restart WebSocket service
5. Should reconnect automatically

✅ **Checkpoint:** Everything works end-to-end!

---

## 🎉 Deployment Complete!

Your Stock Tracker is now live with:
- ✅ Real-time WebSocket updates
- ✅ Live market data from backend
- ✅ .NET API integration
- ✅ Redis pub/sub messaging
- ✅ Full production features

---

## 📊 Monitoring & Maintenance

### Check Service Health

**Backend API:**
```bash
curl https://your-api-url.railway.app/health
```

**WebSocket Server:**
```bash
curl https://your-ws-url.railway.app:8082/health
```

**Redis:**
- Check Upstash dashboard for metrics

### Railway Monitoring
1. Go to Railway dashboard
2. Click on each service
3. Check "Metrics" tab for:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Vercel Analytics
1. Go to Vercel dashboard
2. Click on your project
3. Check "Analytics" tab for:
   - Page views
   - Performance metrics
   - Error rates

---

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend

**Check:**
1. Backend API is running (check Railway)
2. CORS is configured correctly
3. Environment variables are set in Vercel
4. URLs don't have trailing slashes

**Fix:**
```bash
# Test backend directly
curl https://your-api-url.railway.app/api/market-data/indices
```

### Issue: WebSocket won't connect

**Check:**
1. WebSocket server is running
2. Using `wss://` (not `ws://`)
3. CORS allows your Vercel domain
4. Redis is connected

**Fix:**
```bash
# Check WebSocket health
curl https://your-ws-url.railway.app:8082/health
```

### Issue: No real-time updates

**Check:**
1. WebSocket connection established
2. Backend is publishing to Redis
3. WebSocket server is subscribed to Redis
4. Check browser console for errors

**Fix:**
1. Check Railway logs for all services
2. Verify Redis connection in both services
3. Test Redis pub/sub manually

### Issue: Build fails

**Frontend:**
- Check TypeScript errors: `npm run type-check`
- Check build locally: `npm run build`
- Verify all dependencies installed

**Backend:**
- Check .NET version (8.0)
- Verify all NuGet packages restored
- Check for compilation errors

---

## 💰 Cost Management

### Current Usage (Free Tier)

**Vercel:**
- Bandwidth: 100GB/month
- Builds: 6000 minutes/month
- **Cost:** $0

**Railway:**
- $5 credit/month
- ~$5/month usage (2 services)
- **Cost:** $0 (covered by credit)

**Upstash:**
- 10,000 commands/day
- 256MB storage
- **Cost:** $0

**Total: $0/month**

### Scaling Costs

If you exceed free tiers:
- Railway: ~$10-20/month
- Upstash: ~$5-10/month
- Vercel: $20/month (Pro plan)

**Total at scale: ~$35-50/month**

---

## 🚀 Next Steps

### Optional Enhancements

1. **Custom Domain**
   - Add custom domain in Vercel
   - Update CORS configuration
   - Configure SSL

2. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Set up alerts

3. **Performance**
   - Enable CDN caching
   - Optimize bundle size
   - Add service worker

4. **Security**
   - Implement rate limiting
   - Add API authentication
   - Enable DDoS protection

---

## 📞 Support

### Documentation
- Spec: `.kiro/specs/production-deployment/`
- Requirements: `requirements.md`
- Design: `design.md`
- Tasks: `tasks.md`

### Platform Docs
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Upstash Docs](https://docs.upstash.com)

### Need Help?
- Check Railway logs for errors
- Review browser console
- Test each service independently
- Verify environment variables

---

## ✅ Deployment Checklist

Use this to track your progress:

- [ ] Redis deployed on Upstash
- [ ] Backend API deployed on Railway
- [ ] WebSocket server deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] CORS configured correctly
- [ ] All environment variables set
- [ ] End-to-end testing complete
- [ ] Real-time updates working
- [ ] Error handling tested
- [ ] Monitoring configured
- [ ] Documentation updated

---

**🎉 Congratulations! Your Stock Tracker is live in production!**

Share your deployment URL and start tracking stocks in real-time! 📈
