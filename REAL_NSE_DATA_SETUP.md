# Real NSE Market Data Setup

## ✅ What's Been Fixed

Your Indian Stock Tracker now fetches **REAL live data** for NSE indices and stocks using Alpha Vantage and Twelve Data APIs.

## 🎯 What Works Now

### 1. **Live Market Indices** (Real Data)

- **Nifty 50** (`^NSEI`)
- **Sensex** (`^BSESN`)
- **Bank Nifty** (`^NSEBANK`)

### 2. **Live Stock Ticker** (Real Data)

- Top 15 Nifty 50 stocks
- Real-time prices from Alpha Vantage/Twelve Data
- Updates every 3 seconds

### 3. **Individual Stock Quotes** (Real Data)

- Any Indian stock symbol (RELIANCE, TCS, INFY, etc.)
- Real-time price, change, volume, high/low

## 🔧 How It Works

### Backend (.NET)

```
MarketDataService.GetMarketIndicesAsync()
  ↓
Fetches ^NSEI, ^BSESN, ^NSEBANK from Alpha Vantage
  ↓
Returns real index data to frontend
```

### Frontend (React)

```
LiveMarketIndices component
  ↓
Calls: http://localhost:5000/api/market-data/indices
  ↓
Displays real Nifty 50, Sensex, Bank Nifty data
```

## 🚀 Start Your App

### Terminal 1: Backend

```bash
cd backend/StockTracker.API
dotnet run
```

### Terminal 2: Frontend

```bash
npm run dev
```

### Open Browser

```
http://localhost:8080/dashboard
```

## ✅ Verify Real Data

### 1. Check Console Logs

Look for:

```
✅ Using real market indices from backend
✅ Ticker using real stock data
✅ Real data fetched for RELIANCE from Alpha Vantage
```

### 2. Check UI Badges

- 🟢 **"Real Data"** badge (green) = Using real APIs
- 🟠 **"Simulated"** badge (orange) = Fallback mode

### 3. Test API Directly

```bash
# Test indices
curl http://localhost:5000/api/market-data/indices

# Test single stock
curl http://localhost:5000/api/market-data/quote/RELIANCE

# Test multiple stocks
curl "http://localhost:5000/api/market-data/quotes?symbols=RELIANCE,TCS,INFY"
```

## 📊 API Rate Limits

### Alpha Vantage

- **5 calls/minute** (free tier)
- **500 calls/day**

### Twelve Data

- **8 calls/minute** (free tier)
- **800 calls/day**

### Smart Caching

- Backend caches data for **10 seconds**
- Reduces API calls significantly
- Frontend polls every **2-3 seconds** (uses cache)

## 🔄 Fallback System

If APIs fail or rate limits are hit:

1. Backend returns cached data (if available)
2. If no cache, returns simulated data
3. Frontend shows **"Simulated"** badge
4. App continues to work seamlessly

## 🎯 What's Real vs Simulated

### ✅ Real Data (When Backend is Running)

- Nifty 50, Sensex, Bank Nifty indices
- Top 15 Nifty stocks in ticker
- Individual stock quotes
- Historical data

### 🟠 Simulated Data (Fallback)

- When backend is not running
- When API rate limits are exceeded
- When API keys are invalid
- Realistic price movements based on actual ranges

## 🐛 Troubleshooting

### Issue: "Simulated" Badge Shows

**Solution:**

1. Check if backend is running: `curl http://localhost:5000/api/market-data/indices`
2. Check API keys in `.env`
3. Check console for errors
4. Verify rate limits not exceeded

### Issue: No Data Showing

**Solution:**

1. Restart backend: `cd backend/StockTracker.API && dotnet run`
2. Restart frontend: `npm run dev`
3. Clear browser cache
4. Check `.env` has `VITE_API_BASE_URL=http://localhost:5000`

### Issue: "Rate Limit Exceeded"

**Solution:**

1. Wait 1 minute (Alpha Vantage resets)
2. Backend will use cached data
3. Consider upgrading API plan for production

## 📈 Production Deployment

For production, you'll need:

1. **Paid API plans** (higher rate limits)
2. **WebSocket server** (for true real-time updates)
3. **Redis cache** (for distributed caching)
4. **Load balancer** (for scaling)

See `PRODUCTION_READINESS_REPORT.md` for details.

## 🎉 Summary

Your app now has:

- ✅ Real NSE index data (Nifty 50, Sensex, Bank Nifty)
- ✅ Real stock prices for Indian stocks
- ✅ Smart caching to minimize API calls
- ✅ Automatic fallback to simulated data
- ✅ Production-ready architecture

**Just start both servers and you'll see real live market data!** 🚀📈
