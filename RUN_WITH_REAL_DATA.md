# 🚀 Run with Real Data - Final Guide

## ✅ Configuration Complete!

Your API keys have been configured in the .NET backend. You're ready to get real live data!

## 🎯 Quick Start (2 Terminals)

### Terminal 1: Start .NET Backend

```bash
cd backend
dotnet restore
dotnet build
cd StockTracker.API
dotnet run
```

**Wait for**:

```
✅ WebSocket server running on ws://localhost:5000
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
```

### Terminal 2: Start Frontend

```bash
# Make sure .env has:
# VITE_API_BASE_URL=http://localhost:5000

npm run dev
```

**Open**: http://localhost:8080/dashboard

## ✅ Verify Real Data

### 1. Check the Badge

Look for **"Real Data"** badge (green) on Live Market Indices

### 2. Check Browser Console

Should see:

```
✅ Real data fetched for RELIANCE from Alpha Vantage
```

### 3. Check Backend Logs

Should see:

```
info: StockTracker.Infrastructure.Services.AlphaVantageService[0]
      Successfully fetched RELIANCE from Alpha Vantage
```

### 4. Test API Directly

```bash
curl http://localhost:5000/api/market-data/quote/RELIANCE
```

Should return real data with `"source": "Alpha Vantage"`

## 📊 Your API Keys (Configured)

✅ **Alpha Vantage**: `9CEB9GT75EIDBGRE`
✅ **Twelve Data**: `fe075c59fc2946d5b04940fa20e9be57`
✅ **Gemini AI**: `AIzaSyAHyobQ2yx31m2CmSKM12wnRzC8midqaTM`
✅ **Supabase**: Configured

## 🔄 Data Flow

```
Frontend (localhost:8080)
    ↓ HTTP Request
.NET Backend (localhost:5000)
    ↓ API Call
Alpha Vantage API
    ↓ Real Market Data
Backend → Frontend → UI
```

## 🎯 What You'll See

### Live Market Indices

- Real Nifty 50 values
- Real Sensex values
- Real Bank Nifty values
- Updates every 2 seconds
- Green "Real Data" badge

### Stock Cards

- Real prices from Alpha Vantage
- Real-time updates
- Actual market data
- No more simulated values!

## 🧪 Test Commands

```bash
# Test health
curl http://localhost:5000/health

# Test single stock
curl http://localhost:5000/api/market-data/quote/RELIANCE

# Test multiple stocks
curl "http://localhost:5000/api/market-data/quotes?symbols=RELIANCE,TCS,HDFCBANK"

# Test indices
curl http://localhost:5000/api/market-data/indices

# View Swagger UI
open http://localhost:5000/swagger
```

## 📈 Expected Response

```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE",
    "price": 2456.75,
    "change": 23.45,
    "changePercent": 0.96,
    "volume": 1234567,
    "high": 2500.0,
    "low": 2400.0,
    "open": 2433.3,
    "previousClose": 2433.3,
    "source": "Alpha Vantage"
  },
  "source": "Alpha Vantage",
  "timestamp": "2025-06-10T10:30:00.000Z"
}
```

## 🐛 Troubleshooting

### Issue: Still showing "Simulated"

**Check**:

1. Is .NET backend running? (Terminal 1)
2. Is frontend pointing to backend? (Check .env: `VITE_API_BASE_URL=http://localhost:5000`)
3. Did you restart frontend after changing .env?

**Fix**:

```bash
# Stop frontend (Ctrl+C)
# Restart
npm run dev
```

### Issue: Backend won't start

**Check**:

```bash
# Make sure you're in the right directory
cd backend/StockTracker.API

# Try clean build
dotnet clean
dotnet restore
dotnet build
dotnet run
```

### Issue: API returns errors

**Check backend logs** for:

- API key errors
- Rate limit errors
- Network errors

**Note**: Even if APIs fail, backend will use mock data as fallback!

## 🎉 Success Indicators

When everything is working:

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 8080
3. ✅ Green "Real Data" badge visible
4. ✅ Console shows "Real data fetched..."
5. ✅ Prices match actual market values
6. ✅ No "Simulated" badge

## 📊 API Rate Limits

### Alpha Vantage (Free Tier)

- 5 API calls per minute
- 500 calls per day

### Twelve Data (Free Tier)

- 8 API calls per minute
- 800 calls per day

**Don't worry**: Backend caches responses for 10 seconds to minimize API calls!

## 🚀 Production Deployment

Once tested locally, deploy:

### Backend

```bash
# Azure
az webapp create --name stocktracker-api --runtime "DOTNETCORE:8.0"

# Or Docker
docker build -t stocktracker-api .
docker run -p 5000:80 stocktracker-api
```

### Frontend

```bash
# Update .env.production
VITE_API_BASE_URL=https://your-api.azurewebsites.net

# Deploy to Vercel
vercel --prod
```

## 🎯 Summary

You now have:

- ✅ .NET backend configured with real API keys
- ✅ Alpha Vantage integration (5 calls/min)
- ✅ Twelve Data integration (8 calls/min)
- ✅ Smart caching (10s TTL)
- ✅ Automatic fallback to mock data
- ✅ Production-ready setup

## 🎊 You're Ready!

**Just run these two commands**:

```bash
# Terminal 1
cd backend/StockTracker.API && dotnet run

# Terminal 2
npm run dev
```

**Then open**: http://localhost:8080/dashboard

**Look for the green "Real Data" badge!** 🟢

---

**Your Indian Stock Tracker now has REAL LIVE DATA!** 🚀📈💹
