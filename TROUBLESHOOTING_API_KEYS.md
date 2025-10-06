# 🔧 Troubleshooting API Keys

## Issue: API Keys Not Working

If you've added API keys to `.env` but they're still showing as unavailable, follow these steps:

### ✅ Step 1: Verify .env File Format

Your `.env` file should look exactly like this (no quotes needed for Vite):

```env
VITE_SUPABASE_PROJECT_ID=msesvmlvhrhdipfbhvub
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://msesvmlvhrhdipfbhvub.supabase.co
VITE_GEMINI_API_KEY=AIzaSyDtWSB86HKfDHnOAO0LJGv6Qlp0nTRpazA
VITE_ALPHA_VANTAGE_API_KEY=9CEB9GT75EIDBGRE
VITE_TWELVE_DATA_API_KEY=fe075c59fc2946d5b04940fa20e9be57
```

**Important**: 
- ❌ Don't use quotes: `VITE_GEMINI_API_KEY="your_key"` 
- ✅ Use without quotes: `VITE_GEMINI_API_KEY=your_key`
- ❌ No spaces around `=`: `VITE_GEMINI_API_KEY = your_key`
- ✅ No spaces: `VITE_GEMINI_API_KEY=your_key`

### ✅ Step 2: Restart Development Server

**CRITICAL**: Vite only loads `.env` on startup!

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### ✅ Step 3: Clear Browser Cache

```bash
# In your browser:
# 1. Open DevTools (F12)
# 2. Right-click refresh button
# 3. Select "Empty Cache and Hard Reload"
```

### ✅ Step 4: Check Console for Debug Info

After restarting, check your browser console (F12). You should see:

```
🔍 Environment Variables Debug
  Supabase URL: ✅ Set
  Supabase Key: ✅ Set
  Gemini API Key: ✅ Set
  Alpha Vantage Key: ✅ Set
  Twelve Data Key: ✅ Set
  Gemini Key Preview: AIzaSyDtWS...
  Alpha Vantage Key Preview: 9CEB9GT75E...
  Twelve Data Key Preview: fe075c59fc...

🧪 Testing API Availability
  Gemini AI: ✅ Initialized
  Alpha Vantage: ✅ Working
  Twelve Data: ✅ Working
```

### ✅ Step 5: Check API Status Indicator

In the dashboard, you should see an "API Status" card showing:
- ✅ Gemini AI: Active
- ✅ Twelve Data: Active
- ✅ Alpha Vantage: Active

### ✅ Step 6: Verify API Keys Are Valid

#### Test Gemini API Key:
```bash
curl -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_KEY"
```

#### Test Alpha Vantage:
```bash
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=YOUR_ALPHA_KEY"
```

#### Test Twelve Data:
```bash
curl "https://api.twelvedata.com/quote?symbol=AAPL&apikey=YOUR_TWELVE_KEY"
```

### ✅ Step 7: Check for Common Issues

#### Issue: "Rate limit exceeded"
**Solution**: You've used up your daily API calls
- Alpha Vantage: 25 calls/day (free)
- Twelve Data: 800 calls/day (free)
- Wait 24 hours or upgrade to paid plan

#### Issue: "Invalid API key"
**Solution**: 
- Double-check the key in your API provider dashboard
- Make sure you copied the entire key
- No extra spaces or characters

#### Issue: "CORS error"
**Solution**: 
- This is normal for browser requests
- The app handles this automatically
- APIs work from the server side

### ✅ Step 8: Manual Test in Code

Add this to your Dashboard component temporarily:

```typescript
useEffect(() => {
  console.log('Gemini Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Set' : 'Not Set');
  console.log('Alpha Key:', import.meta.env.VITE_ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not Set');
  console.log('Twelve Key:', import.meta.env.VITE_TWELVE_DATA_API_KEY ? 'Set' : 'Not Set');
}, []);
```

### ✅ Step 9: Check .gitignore

Make sure `.env` is in `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore .env
# Should output: .env
```

### ✅ Step 10: Nuclear Option - Fresh Start

If nothing works:

```bash
# 1. Stop the server
# 2. Delete node_modules and cache
rm -rf node_modules .vite dist

# 3. Reinstall
npm install

# 4. Verify .env file
cat .env

# 5. Restart
npm run dev
```

## 🎯 Expected Behavior After Fix

### In Browser Console:
- ✅ All API keys show as "Set"
- ✅ API tests show "Working" or "Initialized"
- ✅ No "Missing API key" warnings

### In Dashboard:
- ✅ "AI Enabled" badge (green)
- ✅ "Real-time Data" badge on charts
- ✅ API Status card shows all Active

### When Using Features:
- ✅ AI Analysis generates real insights
- ✅ Stock prices update with real data
- ✅ Charts show actual market data

## 🐛 Still Not Working?

### Check These Files:

1. **src/config/env.ts** - Environment configuration
2. **src/lib/gemini.ts** - Gemini AI integration
3. **src/lib/marketData.ts** - Market data integration
4. **src/main.tsx** - Debug logging

### Enable Verbose Logging:

Add to `src/lib/marketData.ts`:

```typescript
console.log('Fetching price for:', symbol);
console.log('Using API key:', TWELVE_DATA_API_KEY ? 'Available' : 'Missing');
```

### Check Network Tab:

1. Open DevTools (F12)
2. Go to Network tab
3. Try to fetch stock data
4. Look for API requests
5. Check response status and data

## 📞 Need More Help?

If you're still having issues:

1. Check browser console for errors
2. Check network tab for failed requests
3. Verify API keys in provider dashboards
4. Make sure you restarted the dev server
5. Try a different browser

## ✅ Success Checklist

- [ ] `.env` file has all keys (no quotes)
- [ ] Development server restarted
- [ ] Browser cache cleared
- [ ] Console shows "✅ Set" for all keys
- [ ] API Status card shows "Active"
- [ ] AI features work
- [ ] Real-time data loads

Once all checkboxes are ✅, your APIs should be working!