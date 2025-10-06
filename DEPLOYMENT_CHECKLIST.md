# 📋 Production Deployment Checklist

Print this or keep it open while deploying!

## 🎯 Pre-Deployment

- [ ] GitHub repository is up to date
- [ ] All code is committed and pushed
- [ ] Local build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Created accounts:
  - [ ] Vercel account
  - [ ] Railway account
  - [ ] Upstash account

---

## 1️⃣ Redis Deployment (Upstash)

- [ ] Signed up at upstash.com
- [ ] Created new Redis database
- [ ] Named: `stock-tracker-redis`
- [ ] Region selected (closest to you)
- [ ] TLS enabled
- [ ] Copied connection details:
  - [ ] Host
  - [ ] Port
  - [ ] Password
  - [ ] Connection string
- [ ] Tested connection (optional)

**Time:** 10 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 2️⃣ Backend API Deployment (Railway)

- [ ] Signed up at railway.app
- [ ] Created new project
- [ ] Added service from GitHub
- [ ] Set root directory: `backend/StockTracker.API`
- [ ] Added environment variables:
  - [ ] ConnectionStrings__Redis
  - [ ] AlphaVantage__ApiKey
  - [ ] TwelveData__ApiKey
  - [ ] Cors__AllowedOrigins__0
  - [ ] Redis__ChannelUpdates
  - [ ] Redis__ChannelSubscriptions
  - [ ] ASPNETCORE_ENVIRONMENT
- [ ] Deployed successfully
- [ ] Generated domain
- [ ] Copied API URL: `_______________________`
- [ ] Tested health endpoint
- [ ] Health check returns "Healthy"

**Time:** 20 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 3️⃣ WebSocket Server Deployment (Railway)

- [ ] Added new service to Railway project
- [ ] Selected same GitHub repo
- [ ] Set root directory: `backend-ws`
- [ ] Set build command: `npm install`
- [ ] Set start command: `node server.js`
- [ ] Added environment variables:
  - [ ] WS_PORT=8081
  - [ ] NODE_ENV=production
  - [ ] API_BASE (from step 2)
  - [ ] REDIS_HOST (from step 1)
  - [ ] REDIS_PORT (from step 1)
  - [ ] REDIS_PASSWORD (from step 1)
  - [ ] REDIS_TLS=true
  - [ ] REDIS_CHANNEL_UPDATES
  - [ ] ALLOWED_ORIGINS
- [ ] Deployed successfully
- [ ] Generated domain
- [ ] Copied WebSocket URL: `_______________________`
- [ ] Tested health endpoint (port 8082)
- [ ] Health check returns connection stats

**Time:** 15 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 4️⃣ Frontend Deployment (Vercel)

- [ ] Signed up at vercel.com
- [ ] Imported GitHub repository
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Added environment variables:
  - [ ] VITE_SUPABASE_PROJECT_ID
  - [ ] VITE_SUPABASE_PUBLISHABLE_KEY
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_GEMINI_API_KEY
  - [ ] VITE_ALPHA_VANTAGE_API_KEY
  - [ ] VITE_TWELVE_DATA_API_KEY
  - [ ] VITE_API_BASE_URL (from step 2)
  - [ ] VITE_WS_URL (from step 3, use wss://)
  - [ ] VITE_ENABLE_WEBSOCKET=true
  - [ ] VITE_FALLBACK_TO_POLLING=true
  - [ ] VITE_APP_ENV=production
- [ ] Deployed successfully
- [ ] Copied Vercel URL: `_______________________`
- [ ] Opened app in browser
- [ ] App loads without errors

**Time:** 15 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 5️⃣ CORS Configuration

- [ ] Updated Backend API CORS:
  - [ ] Added Vercel URL to Cors__AllowedOrigins__1
  - [ ] Redeployed backend API
  - [ ] Verified deployment successful
- [ ] Updated WebSocket CORS:
  - [ ] Added Vercel URL to ALLOWED_ORIGINS
  - [ ] Redeployed WebSocket server
  - [ ] Verified deployment successful
- [ ] Tested from frontend
- [ ] No CORS errors in browser console

**Time:** 10 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 6️⃣ End-to-End Testing

### Basic Functionality
- [ ] Opened Vercel URL in browser
- [ ] Opened browser DevTools (F12)
- [ ] Checked Console tab
- [ ] No errors in console
- [ ] Homepage loads correctly
- [ ] Navigation works

### Authentication
- [ ] Signup works
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes work

### Real-Time Features
- [ ] Navigated to Live Market page
- [ ] WebSocket connection established
- [ ] Saw "Connected to Stock Tracker WebSocket" message
- [ ] Connection indicator shows "Connected"
- [ ] Real-time prices updating
- [ ] Latency metrics showing
- [ ] Stock ticker scrolling with live data

### Core Features
- [ ] Dashboard displays stocks
- [ ] Portfolio management works
- [ ] Watchlist works
- [ ] Stock search works
- [ ] AI analysis works (if API key provided)
- [ ] Price alerts work

### Error Recovery
- [ ] Temporarily stopped WebSocket in Railway
- [ ] Frontend showed "Reconnecting..."
- [ ] Restarted WebSocket service
- [ ] Frontend reconnected automatically
- [ ] Real-time updates resumed

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No lag or stuttering
- [ ] Smooth animations
- [ ] Responsive on mobile

**Time:** 15 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 7️⃣ Monitoring Setup

- [ ] Checked Railway metrics:
  - [ ] Backend API CPU/Memory
  - [ ] WebSocket CPU/Memory
  - [ ] No errors in logs
- [ ] Checked Upstash dashboard:
  - [ ] Redis memory usage
  - [ ] Command count
  - [ ] Connection status
- [ ] Checked Vercel analytics:
  - [ ] Deployment status
  - [ ] Build logs
  - [ ] No errors
- [ ] Set up alerts (optional):
  - [ ] Railway health check alerts
  - [ ] Upstash usage alerts
  - [ ] Vercel deployment alerts

**Time:** 10 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 8️⃣ Documentation

- [ ] Documented deployment URLs:
  - Frontend: `_______________________`
  - Backend API: `_______________________`
  - WebSocket: `_______________________`
  - Redis: `_______________________`
- [ ] Saved environment variables securely
- [ ] Created backup of configuration
- [ ] Documented any issues encountered
- [ ] Noted any customizations made

**Time:** 5 minutes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ✅ Final Verification

- [ ] All services show "healthy" status
- [ ] Frontend loads in < 3 seconds
- [ ] WebSocket connects automatically
- [ ] Real-time updates working
- [ ] No CORS errors
- [ ] No console errors
- [ ] All features tested
- [ ] Mobile responsive
- [ ] Error recovery works
- [ ] Monitoring active

---

## 🎉 Deployment Complete!

**Total Time:** ~1-2 hours  
**Total Cost:** $0/month (free tiers)

### Your Live URLs

- **Frontend:** `_______________________`
- **Backend API:** `_______________________`
- **WebSocket:** `_______________________`

### Share Your App!

Your Stock Tracker is now live with full real-time capabilities! 🚀

---

## 📝 Notes & Issues

Use this space to note any issues or customizations:

```
_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________
```

---

## 🔄 Next Steps

After deployment:
- [ ] Add custom domain (optional)
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Optimize performance
- [ ] Add more features
- [ ] Share with users!

---

**Need help?** Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions.
