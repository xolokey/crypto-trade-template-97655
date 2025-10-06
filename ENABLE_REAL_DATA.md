# 🔴 Enable Real Data - Quick Guide

## Current Status

Your app is currently showing **SIMULATED DATA** because the backend APIs are not running yet.

## Why Simulated Data?

The components try to fetch real data from:

- `/api/market-data` endpoints (Vercel functions)
- `/api/nse-live-data` endpoints

If these aren't available, they automatically fall back to simulated data.

## ✅ How to Enable Real Data

### Option 1: Use Vercel Functions (Easiest)

The Vercel serverless functions are already created in the `api/` folder.

**Start Vercel Dev Server**:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Start Vercel dev server
vercel dev

# This will start on http://localhost:3000
# The API endpoints will be available at:
# http://localhost:3000/api/market-data
# http://localhost:3000/api/nse-live-data
```

**Then update your frontend**:

```bash
# In your .env file, add:
VITE_API_BASE_URL=http://localhost:3000
```

**Restart your frontend**:

```bash
npm run dev
```

### Option 2: Use .NET Backend

If you've set up the .NET backend:

```bash
# Start .NET API
cd backend/StockTracker.API
dotnet run

# This will start on http://localhost:5000
```

**Update .env**:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

**Restart frontend**:

```bash
npm run dev
```

### Option 3: Quick Test with Mock API

For testing, you can use the existing Vercel functions:

```bash
# Just run vercel dev in your project root
vercel dev

# Then restart your app
npm run dev
```

## 🔍 How to Verify Real Data

### 1. Check the Badge

Look for the badge on the Live Market Indices:

- 🟠 **"Simulated"** = Using mock data
- 🟢 **"Real Data"** = Using actual API data

### 2. Check Browser Console

Open DevTools (F12) and look for:

```
✅ Using real NSE data
```

Or:

```
⚠️ Real API not available, using simulated data
```

### 3. Test API Directly

```bash
# Test if API is working
curl http://localhost:3000/api/market-data?symbol=RELIANCE

# Should return real data, not 404
```

## 📊 Current Data Flow

### With Simulated Data (Current)

```
Frontend → realTimeNSEData.ts → Simulated Values → UI
```

### With Real Data (After Setup)

```
Frontend → API Endpoint → External APIs → Real Values → UI
```

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Vercel Functions
vercel dev

# Terminal 2: Start Frontend
npm run dev

# Open browser
http://localhost:8080/dashboard
```

## ✅ Success Indicators

When real data is working:

1. ✅ Badge shows "Real Data" (green)
2. ✅ Console shows "Using real NSE data"
3. ✅ Prices match actual market values
4. ✅ API endpoints return 200 (not 404)

## 🐛 Troubleshooting

### Issue: Still showing "Simulated"

**Check**:

1. Is Vercel dev server running? (`vercel dev`)
2. Is the API accessible? (test with curl)
3. Did you restart the frontend after changing .env?
4. Check browser console for errors

**Fix**:

```bash
# Stop everything
# Ctrl+C in all terminals

# Start Vercel dev
vercel dev

# In new terminal, start frontend
npm run dev
```

### Issue: API returns 404

**This means**:

- Vercel functions aren't running
- Or you're not pointing to the right URL

**Fix**:

```bash
# Make sure vercel dev is running
vercel dev

# Check it's accessible
curl http://localhost:3000/api/market-data?symbol=RELIANCE
```

### Issue: CORS errors

**This shouldn't happen** with Vercel dev, but if it does:

The API files already have CORS headers:

```typescript
res.setHeader("Access-Control-Allow-Origin", "*");
```

## 📝 Summary

**Current State**: Simulated data (safe fallback)

**To Enable Real Data**:

1. Run `vercel dev` (starts API endpoints)
2. Run `npm run dev` (starts frontend)
3. Check for "Real Data" badge

**Why This Design**:

- App always works (even without backend)
- Graceful degradation
- Easy development
- Production-ready fallback

## 🎯 Next Steps

1. **Start Vercel dev**: `vercel dev`
2. **Verify APIs work**: Test with curl
3. **Restart frontend**: `npm run dev`
4. **Check badge**: Should show "Real Data"
5. **Verify prices**: Match actual market data

Your app will automatically switch to real data once the APIs are available! 🚀
