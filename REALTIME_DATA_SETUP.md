# 📊 Real-Time Market Data Setup Guide

## 🎯 Overview

Your Indian Stock Tracker now supports **real-time price data** and **candlestick charts** for all NSE stocks with multiple timeframes. The system intelligently falls back to mock data if API keys are not configured.

## 🔑 API Options & Setup

### **Option 1: Alpha Vantage (Recommended for Starting)**

#### Features:
- ✅ Free tier: 25 API calls/day
- ✅ Supports Indian stocks (.NS suffix)
- ✅ Historical and real-time data
- ✅ Multiple timeframes (1min to monthly)
- ✅ No credit card required

#### Setup Steps:
1. **Get API Key**:
   - Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - Enter your email
   - Get instant free API key

2. **Add to Environment**:
   ```env
   VITE_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

3. **Rate Limits**:
   - 25 requests per day (free tier)
   - 5 requests per minute
   - Upgrade to premium for more calls

---

### **Option 2: Twelve Data (Best for Active Trading)**

#### Features:
- ✅ Free tier: 800 API calls/day
- ✅ Excellent Indian market coverage
- ✅ WebSocket support for real-time
- ✅ Multiple timeframes
- ✅ Better rate limits than Alpha Vantage

#### Setup Steps:
1. **Get API Key**:
   - Visit [Twelve Data](https://twelvedata.com/)
   - Sign up for free account
   - Get API key from dashboard

2. **Add to Environment**:
   ```env
   VITE_TWELVE_DATA_API_KEY=your_api_key_here
   ```

3. **Rate Limits**:
   - 800 requests per day (free tier)
   - 8 requests per minute
   - Upgrade for unlimited calls

---

### **Option 3: Yahoo Finance via RapidAPI**

#### Features:
- ✅ Good NSE coverage
- ✅ Historical data
- ✅ Free tier available
- ✅ Easy integration

#### Setup Steps:
1. Visit [RapidAPI Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1)
2. Subscribe to free tier
3. Get API key
4. Requires custom integration (not yet implemented)

---

## 🚀 Quick Start

### 1. **Choose Your API Provider**

For beginners, we recommend starting with **Twelve Data** (800 calls/day):

```bash
# Add to your .env file
VITE_TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
```

### 2. **Restart Development Server**

```bash
npm run dev
```

### 3. **Verify Real-Time Data**

- Open any stock detail page
- Look for "Real-time Data" badge (not "Mock Data")
- Charts will show actual market data

---

## 📈 Features Available

### **Real-Time Price Data**
- Current price
- Day change (₹ and %)
- Volume
- High/Low
- Open/Previous Close
- Last updated timestamp

### **Candlestick Charts**
- **Timeframes**: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M
- **Chart Types**: Candlestick, Line, Volume
- **Data Points**: Up to 100 candles per request
- **Auto-refresh**: Manual refresh button
- **Caching**: 1-minute cache to save API calls

### **Batch Price Fetching**
- Fetch multiple stock prices simultaneously
- Intelligent rate limiting
- Parallel processing with delays

---

## 🎨 Using the Charts

### **Candlestick Chart Component**

```tsx
import CandlestickChart from '@/components/charts/CandlestickChart';

<CandlestickChart 
  symbol="RELIANCE" 
  stockName="Reliance Industries Limited" 
/>
```

### **Timeframe Selection**
- Click any timeframe button (1m, 5m, 15m, etc.)
- Chart automatically updates
- Data is cached for 1 minute

### **Chart Types**
- **Candlestick**: Traditional OHLC visualization
- **Line Chart**: Close price trend
- **Volume**: Trading volume bars

---

## 💡 Smart Fallback System

The application intelligently handles API availability:

### **Priority Order**:
1. **Twelve Data API** (if configured)
2. **Alpha Vantage API** (if configured)
3. **Mock Data** (always available)

### **Indicators**:
- 🟢 **"Real-time Data"** badge = Using live API
- 🟡 **"Mock Data"** badge = Using simulated data

---

## 📊 API Usage Optimization

### **Built-in Optimizations**:

1. **Caching System**:
   - Prices cached for 1 minute
   - Historical data cached for 1 minute
   - Reduces API calls significantly

2. **Batch Processing**:
   - Fetches 5 stocks at a time
   - 1-second delay between batches
   - Respects rate limits

3. **Smart Refresh**:
   - Manual refresh button
   - No auto-refresh to save calls
   - Clear cache option available

### **Best Practices**:

```typescript
// Good: Fetch once and cache
const price = await fetchRealTimePrice('RELIANCE');

// Good: Batch fetch for multiple stocks
const prices = await fetchBatchPrices(['RELIANCE', 'TCS', 'INFY']);

// Avoid: Fetching same stock repeatedly
// The cache handles this automatically
```

---

## 🔧 Advanced Configuration

### **Custom Timeframes**

```typescript
import { fetchHistoricalDataMultiSource } from '@/lib/marketData';

// Fetch 1-hour candles
const data = await fetchHistoricalDataMultiSource('RELIANCE', '1h', 100);

// Fetch daily candles
const data = await fetchHistoricalDataMultiSource('RELIANCE', '1d', 365);
```

### **Clear Cache**

```typescript
import { clearCache } from '@/lib/marketData';

// Force refresh all data
clearCache();
```

### **Check API Availability**

```typescript
import { isRealTimeDataAvailable } from '@/lib/marketData';

if (isRealTimeDataAvailable()) {
  console.log('Real-time data is available!');
} else {
  console.log('Using mock data');
}
```

---

## 📱 Production Deployment

### **Vercel Environment Variables**

Add these in your Vercel dashboard:

```env
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
VITE_TWELVE_DATA_API_KEY=your_twelve_data_key
```

### **Rate Limit Monitoring**

Monitor your API usage:
- **Alpha Vantage**: Check dashboard at alphavantage.co
- **Twelve Data**: Check dashboard at twelvedata.com

### **Upgrade Plans**

When you need more calls:
- **Alpha Vantage Premium**: $49.99/month (unlimited)
- **Twelve Data Pro**: $79/month (unlimited)

---

## 🎯 Supported Stock Symbols

### **NSE Stocks**
All NSE stocks are supported with `.NS` suffix:
- RELIANCE.NS
- TCS.NS
- HDFCBANK.NS
- etc.

The system automatically adds the `.NS` suffix for you!

---

## 🐛 Troubleshooting

### **Issue: "Mock Data" badge showing**

**Solution**:
1. Check if API keys are set in `.env`
2. Restart development server
3. Check browser console for errors
4. Verify API key is valid

### **Issue: "Rate limit exceeded"**

**Solution**:
1. Wait for rate limit to reset
2. Use caching (already implemented)
3. Upgrade to paid plan
4. Use multiple API providers

### **Issue: "No data available"**

**Solution**:
1. Check if stock symbol is correct
2. Verify API key has permissions
3. Check network connection
4. Try different timeframe

---

## 📚 API Documentation

### **Alpha Vantage**
- [Documentation](https://www.alphavantage.co/documentation/)
- [API Key](https://www.alphavantage.co/support/#api-key)
- [Support](https://www.alphavantage.co/support/)

### **Twelve Data**
- [Documentation](https://twelvedata.com/docs)
- [Dashboard](https://twelvedata.com/account)
- [Support](https://twelvedata.com/support)

---

## 🎉 Summary

Your Indian Stock Tracker now supports:
- ✅ Real-time price data for 150+ NSE stocks
- ✅ Candlestick charts with 9 timeframes
- ✅ Multiple chart types (Candlestick, Line, Volume)
- ✅ Smart caching and rate limiting
- ✅ Automatic fallback to mock data
- ✅ Production-ready with Vercel deployment

**Get started**: Add your API key and run `npm run dev`! 🚀