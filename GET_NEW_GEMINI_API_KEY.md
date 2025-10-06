# 🔑 Get a New Gemini API Key

## ⚠️ Current Issue

Your current API key may be:
- Expired or invalid
- Not have access to the required models
- From an old API version

## ✅ Solution: Get a Fresh API Key

### Step 1: Visit Google AI Studio
Go to: **https://makersuite.google.com/app/apikey**

Or: **https://aistudio.google.com/app/apikey**

### Step 2: Sign In
- Use your Google account
- Accept terms if prompted

### Step 3: Create API Key

1. Click **"Create API Key"** button
2. Select **"Create API key in new project"** (recommended)
3. Or select an existing project
4. Copy the new API key (starts with `AIza...`)

### Step 4: Update Your .env File

Open `.env` file and replace the old key:

```bash
# Replace this line:
VITE_GEMINI_API_KEY=AIzaSyDtWSB86HKfDHnOAO0LJGv6Qlp0nTRpazA

# With your new key:
VITE_GEMINI_API_KEY=AIza...your-new-key-here
```

### Step 5: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

### Step 6: Test

1. Go to Dashboard
2. Search for any stock (e.g., "RELIANCE")
3. Click "AI Analysis" button
4. Should work now! ✅

## 🔍 Why This Happens

### Common Reasons:
1. **Old API Key**: Created before new models were available
2. **Expired Key**: Keys can expire or be revoked
3. **Wrong Project**: Key from project without Gemini access
4. **API Changes**: Google updates their API versions

## 🎯 What the New Code Does

I've updated the code to:
1. **Try multiple models** automatically
2. **Better error messages** with direct links
3. **Model caching** for faster subsequent calls
4. **Fallback logic** if primary models fail

### Models Tried (in order):
1. `gemini-1.5-flash-latest` (fastest, newest)
2. `gemini-1.5-flash` (fast)
3. `gemini-1.5-pro-latest` (best quality, newest)
4. `gemini-1.5-pro` (best quality)
5. `gemini-pro` (fallback, most compatible)

## 📋 Quick Checklist

- [ ] Visit https://makersuite.google.com/app/apikey
- [ ] Create new API key
- [ ] Copy the key (starts with AIza...)
- [ ] Update .env file
- [ ] Save the file
- [ ] Restart dev server (`npm run dev`)
- [ ] Test AI Analysis on dashboard
- [ ] Check console for success message

## 🐛 Troubleshooting

### Issue: "Can't access the website"
**Try alternative URL**: https://aistudio.google.com/app/apikey

### Issue: "No Create API Key button"
**Solution**: 
1. Make sure you're signed in with Google
2. Try a different Google account
3. Check if Gemini API is available in your region

### Issue: "API key created but still not working"
**Solution**:
1. Make sure you copied the FULL key
2. No extra spaces in .env file
3. Key should start with `AIza`
4. Restart server after updating .env
5. Clear browser cache

### Issue: "Quota exceeded"
**Solution**:
- Free tier: 60 requests per minute
- Wait a minute and try again
- Or upgrade to paid plan

## 💡 Pro Tips

### 1. Keep Your Key Safe
```bash
# Never commit .env to git
# It's already in .gitignore
```

### 2. Test Your Key
After getting a new key, test it immediately:
```bash
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_NEW_KEY"
```

### 3. Monitor Usage
- Check your usage at: https://makersuite.google.com/app/apikey
- Free tier limits:
  - 60 requests per minute
  - 1,500 requests per day

### 4. Multiple Keys
If you hit limits, create multiple keys for different projects

## 🎉 Expected Result

After getting a new key:

### Console Output:
```
Trying model: gemini-1.5-flash-latest
✅ Successfully using model: gemini-1.5-flash-latest
Generating analysis for: RELIANCE Type: technical
✅ Analysis generated successfully
```

### In Browser:
- AI Analysis button works
- Stock analysis appears
- No error messages
- Fast response (2-5 seconds)

## 📞 Still Need Help?

### Check These Files:
1. `FIX_GEMINI_API_ERROR.md` - Detailed troubleshooting
2. `GEMINI_QUICK_FIX.md` - Quick reference
3. `FIXES_APPLIED.md` - What was changed

### Verify Setup:
```bash
# Check if key is in .env
cat .env | grep GEMINI

# Should show:
# VITE_GEMINI_API_KEY=AIza...
```

### Test in Browser Console:
```javascript
// Open browser console (F12)
// Check if key is loaded
console.log(import.meta.env.VITE_GEMINI_API_KEY);
// Should show your key (or undefined if not loaded)
```

## 🚀 Alternative: Disable AI Features

If you can't get an API key right now, you can still use the app:

### What Works Without AI:
- ✅ Live market data (Nifty 50, Sensex, Bank Nifty)
- ✅ Live stock ticker
- ✅ Stock search and filtering
- ✅ Watchlist management
- ✅ Portfolio tracking
- ✅ Real-time price updates
- ✅ Charts and visualizations

### What Needs AI:
- ❌ AI Analysis button
- ❌ Portfolio insights
- ❌ AI-powered recommendations

The app will show "AI Disabled" badge but everything else works perfectly!

## 📚 Official Resources

- **Google AI Studio**: https://aistudio.google.com
- **API Key Management**: https://makersuite.google.com/app/apikey
- **Gemini API Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **Support**: https://ai.google.dev/support

---

## ✅ Summary

1. **Get new key**: https://makersuite.google.com/app/apikey
2. **Update .env**: Replace old key with new one
3. **Restart server**: `npm run dev`
4. **Test**: Try AI Analysis on any stock
5. **Success**: Should work without errors! 🎉

**The code is already updated to handle multiple models automatically!**
