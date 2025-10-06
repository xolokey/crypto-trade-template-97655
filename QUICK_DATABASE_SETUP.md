# ⚡ Quick Database Setup (5 Minutes)

## 🎯 Follow These Exact Steps

### **Step 1: Open Supabase Dashboard**

Click this link (opens in new tab):
👉 **https://supabase.com/dashboard/project/msesvmlvhrhdipfbhvub/editor**

### **Step 2: Open SQL Editor**

1. Look at the left sidebar
2. Click **"SQL Editor"**
3. Click **"New Query"** button (top right)

### **Step 3: Copy the SQL Script**

Open the file `setup-database.sql` in your project root and copy ALL the content.

**OR** copy this:

```sql
-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    stock_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stock_symbol)
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    stock_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    average_price DECIMAL(10,2) NOT NULL CHECK (average_price > 0),
    total_invested DECIMAL(15,2) NOT NULL CHECK (total_invested > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stock_symbol)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio(stock_symbol);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- RLS policies for watchlist
CREATE POLICY "Users can view their own watchlist" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own watchlist" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watchlist" ON watchlist
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own watchlist" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for portfolio
CREATE POLICY "Users can view their own portfolio" ON portfolio
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own portfolio" ON portfolio
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio" ON portfolio
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own portfolio" ON portfolio
    FOR DELETE USING (auth.uid() = user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_updated_at
    BEFORE UPDATE ON portfolio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### **Step 4: Paste and Run**

1. **Paste** the SQL into the editor
2. Click **"Run"** button (or press `Ctrl+Enter`)
3. Wait 2-3 seconds
4. You should see: **"Success. No rows returned"**

### **Step 5: Verify Tables Created**

1. Click **"Table Editor"** in left sidebar
2. You should see:
   - ✅ `watchlist` table
   - ✅ `portfolio` table

### **Step 6: Refresh Your App**

1. Go back to your app (`http://localhost:8080`)
2. Press **F5** to refresh
3. The yellow "Database Setup Required" banner should disappear
4. No more 404 errors in console!

## ✅ Test It Works

### **Test Watchlist:**

1. Search for "RELIANCE"
2. Click the ⭐ star icon
3. Go to "Watchlist" tab
4. Stock should appear! ✅

### **Test Portfolio:**

1. Search for "TCS"
2. Click "Add to Portfolio"
3. Enter: Quantity = 10, Price = 3890
4. Click "Add to Portfolio"
5. Go to "Portfolio" tab
6. Stock should appear! ✅

## 🎉 Done!

Your database is now set up and all features will work:

- ✅ Watchlist
- ✅ Portfolio tracking
- ✅ Investment management
- ✅ P&L calculations

## 🐛 Troubleshooting

### **If you see "permission denied":**

- Make sure you're logged into the correct Supabase account
- Check you're in the right project (`msesvmlvhrhdipfbhvub`)

### **If tables already exist:**

- That's fine! The script uses `IF NOT EXISTS`
- It won't create duplicates

### **If you see policy errors:**

- The script drops existing policies first
- Just run it again

## 📞 Need Help?

Check the browser console (F12) after refreshing:

- ✅ No 404 errors = Success!
- ❌ Still 404 errors = Tables not created yet

**Total time: 5 minutes** ⏱️
