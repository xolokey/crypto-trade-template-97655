# 🚀 Start on Localhost - Complete Guide

## ✅ Setup Complete!

Your .NET backend builds successfully and is ready to run with real API keys!

---

## 🎯 Quick Start (2 Terminals)

### Terminal 1: Start .NET Backend

```bash
cd backend/StockTracker.API
dotnet run
```

**Wait for this message**:
```
✅ Now listening on: http://localhost:5000
✅ Now listening on: https://localhost:5001
```

### Terminal 2: Start Frontend

```bash
npm run dev
```

**Wait for**:
```
✅ Local: http://localhost:8080/
```

### Open Browser

```
http://localhost:8080/dashboard
```

**Look for the green "Real Data" badge!** 🟢

---

## 📊 What You'll See

### Backend Terminal (Terminal 1)
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### Frontend Terminal (Terminal 2)
```
VITE v5.4.10  ready in 1234 ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Browser
- 🟢 Green "Real Data" badge on Live Market Indices
- ✅ Real stock prices from Alpha Vantage
- ✅ Live updates every 2 seconds
- ✅ No "Simulated" badge

---

## 🧪 Test the APIs

### Test Backend Health

```bash
curl http://localhost:5000/health
```

**Expected**:
```json
{
  "status": "Healthy"
}
```

### Test Stock Quote

```bash
curl http://localhost:5000/api/market-data/quote/RELIANCE
```

**Expected**:
```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE",
    "price": 2456.75,
    "change": 23.45,
    "changePercent": 0.96,
    "source": "Alpha Vantage"
  },
  "timestamp": "2025-06-10T..."
}
```

### Test Multiple Quotes

```bash
curl "http://localhost:5000/api/market-data/quotes?symbols=RELIANCE,TCS,HDFCBANK"
```

### View Swagger UI

```
http://localhost:5000/swagger
```

---

## ✅ Verification Checklist

### Backend
- [ ] Backend running on port 5000
- [ ] Health check returns "Healthy"
- [ ] API endpoints return real data
- [ ] Swagger UI accessible
- [ ] No errors in terminal

### Frontend
- [ ] Frontend running on port 8080
- [ ] Dashboard loads successfully
- [ ] Green "Real Data" badge visible
- [ ] Prices updating every 2 seconds
- [ ] Console shows "Real data fetched..."

### Integration
- [ ] Frontend connects to backend
- [ ] Real data displayed (not simulated)
- [ ] No CORS errors
- [ ] API calls successful

---

## 🐛 Troubleshooting

### Issue: Backend won't start

```bash
# Clean and rebuild
dotnet clean backend/StockTracker.sln
dotnet restore backend/StockTracker.sln
dotnet build backend/StockTracker.sln
```

### Issue: Port 5000 already in use

**Find and kill the process**:
```bash
lsof -ti:5000 | xargs kill -9
```

Or change the port in `backend/StockTracker.API/Properties/launchSettings.json`

### Issue: Frontend shows "Simulated"

**Check**:
1. Is backend running? (Terminal 1)
2. Is `.env` configured? (`VITE_API_BASE_URL=http://localhost:5000`)
3. Did you restart frontend after changing `.env`?

**Fix**:
```bash
# Stop frontend (Ctrl+C)
# Restart
npm run dev
```

### Issue: CORS errors

The backend is already configured to allow:
- `http://localhost:8080`
- `http://localhost:5173`
- `http://localhost:3000`

If you're using a different port, add it to `appsettings.json`

---

## 📈 API Rate Limits

### Alpha Vantage (Your Key)
- **5 calls per minute**
- **500 calls per day**

### Twelve Data (Your Key)
- **8 calls per minute**
- **800 calls per day**

**Don't worry**: Backend caches responses for 10 seconds!

---

## 🎯 Data Sources

Your backend will try in this order:

1. ✅ **Cache** (10-second TTL) - Instant
2. ✅ **Alpha Vantage** - Real data
3. ✅ **Twelve Data** - Backup
4. ✅ **Mock Data** - Safety net

This ensures your app **always works**!

---

## 📊 Expected Behavior

### First Request
```
Frontend → Backend → Alpha Vantage → Real Data → Cache → Frontend
```

### Subsequent Requests (within 10s)
```
Frontend → Backend → Cache → Frontend (instant!)
```

### If API Fails
```
Frontend → Backend → Try Twelve Data → Real Data → Frontend
```

### If All APIs Fail
```
Frontend → Backend → Mock Data → Frontend (still works!)
```

---

## 🎉 Success!

When everything is working:

1. ✅ Backend terminal shows "Application started"
2. ✅ Frontend terminal shows "Local: http://localhost:8080"
3. ✅ Browser shows green "Real Data" badge
4. ✅ Prices match actual market values
5. ✅ Console shows "Real data fetched from Alpha Vantage"

---

## 🚀 You're Ready!

**Run these commands in separate terminals**:

```bash
# Terminal 1
cd backend/StockTracker.API && dotnet run

# Terminal 2
npm run dev
```

**Then open**: http://localhost:8080/dashboard

---

## 📚 Documentation

- **START_LOCALHOST.md** - This guide
- **RUN_WITH_REAL_DATA.md** - Detailed guide
- **FINAL_SETUP_COMPLETE.md** - Configuration summary
- **DOTNET_QUICK_START.md** - Backend guide

---

**Your Indian Stock Tracker is ready with REAL LIVE DATA!** 🚀📈💹

**Look for the green "Real Data" badge!** 🟢
