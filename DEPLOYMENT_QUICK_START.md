# 🚀 Quick Start Deployment

**Get your Stock Tracker live in 1 hour!**

## 📋 What You'll Deploy

```
Frontend (Vercel) ──→ Backend API (Railway) ──→ Redis (Upstash)
                 └──→ WebSocket (Railway) ──┘
```

## ⚡ Quick Steps

### 1. Redis (10 min)
```bash
1. Go to upstash.com → Sign up
2. Create Database → Regional → us-east-1
3. Copy connection string
```

### 2. Backend API (20 min)
```bash
1. Go to railway.app → Sign up
2. New Project → Deploy from GitHub
3. Root Directory: backend/StockTracker.API
4. Add environment variables (see guide)
5. Deploy → Copy URL
```

### 3. WebSocket Server (15 min)
```bash
1. Railway → Add Service → GitHub
2. Root Directory: backend-ws
3. Add environment variables
4. Deploy → Copy URL (use wss://)
```

### 4. Frontend (15 min)
```bash
1. Go to vercel.com → Sign up
2. Import GitHub repo
3. Framework: Vite
4. Add environment variables
5. Deploy → Copy URL
```

### 5. Update CORS (10 min)
```bash
1. Railway → Backend API → Variables
   Add: Cors__AllowedOrigins__1=https://your-app.vercel.app
2. Railway → WebSocket → Variables
   Add: ALLOWED_ORIGINS=https://your-app.vercel.app
3. Redeploy both services
```

### 6. Test (10 min)
```bash
1. Open your Vercel URL
2. Check browser console
3. Verify WebSocket connected
4. Test real-time updates
```

## ✅ Success Checklist

- [ ] All 3 services deployed
- [ ] No CORS errors in console
- [ ] WebSocket shows "Connected"
- [ ] Real-time prices updating
- [ ] All features working

## 🎯 Environment Variables Quick Reference

### Vercel (Frontend)
```env
VITE_API_BASE_URL=https://your-api.railway.app
VITE_WS_URL=wss://your-ws.railway.app
VITE_SUPABASE_URL=https://msesvmlvhrhdipfbhvub.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyAHyobQ2yx31m2CmSKM12wnRzC8midqaTM
VITE_ENABLE_WEBSOCKET=true
VITE_APP_ENV=production
```

### Railway Backend API
```env
ConnectionStrings__Redis=redis://default:password@host:6379
AlphaVantage__ApiKey=9CEB9GT75EIDBGRE
TwelveData__ApiKey=fe075c59fc2946d5b04940fa20e9be57
Cors__AllowedOrigins__0=http://localhost:8080
Cors__AllowedOrigins__1=https://your-app.vercel.app
ASPNETCORE_ENVIRONMENT=Production
```

### Railway WebSocket
```env
API_BASE=https://your-api.railway.app
REDIS_HOST=your-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_TLS=true
ALLOWED_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
```

## 🔧 Quick Troubleshooting

**CORS Error?**
→ Update CORS in Railway, redeploy

**WebSocket won't connect?**
→ Check you're using `wss://` not `ws://`

**No real-time updates?**
→ Check Railway logs for Redis connection

**Build fails?**
→ Run `npm run build` locally first

## 💰 Cost

**Total: $0/month** (all free tiers)

## 📚 Full Guide

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🎉 Ready to Deploy?

Start with Step 1 (Redis) and work through each step.

**Time to production: ~1 hour**

Good luck! 🚀
