# 🗄️ Database Setup Instructions

## Issue: Watchlist and Portfolio Tables Missing

You're seeing 404 errors because the database tables haven't been created yet.

## ✅ Solution: Create Tables in Supabase

### **Option 1: Using Supabase Dashboard (Recommended)**

1. **Go to Supabase Dashboard**:

   - Visit: https://supabase.com/dashboard
   - Select your project: `msesvmlvhrhdipfbhvub`

2. **Open SQL Editor**:

   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste This SQL**:

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

-- Create RLS policies for watchlist
CREATE POLICY "Users can view their own watchlist" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watchlist" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist" ON watchlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for portfolio
CREATE POLICY "Users can view their own portfolio" ON portfolio
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own portfolio" ON portfolio
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio" ON portfolio
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own portfolio" ON portfolio
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for portfolio updated_at
DROP TRIGGER IF EXISTS update_portfolio_updated_at ON portfolio;
CREATE TRIGGER update_portfolio_updated_at
    BEFORE UPDATE ON portfolio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

4. **Click "Run"** (or press Ctrl+Enter)

5. **Verify Tables Created**:
   - Click "Table Editor" in left sidebar
   - You should see `watchlist` and `portfolio` tables

### **Option 2: Using Supabase CLI**

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref msesvmlvhrhdipfbhvub

# Run the migration
supabase db push
```

### **Option 3: Manual Table Creation**

1. Go to Supabase Dashboard → Table Editor
2. Click "New Table"
3. Create tables manually with the schema above

## ✅ After Creating Tables

1. **Refresh your app** (F5)
2. **Check console** - 404 errors should be gone
3. **Try adding to watchlist** - Should work now
4. **Try adding to portfolio** - Should work now

## 🔍 Verify It's Working

### Test Watchlist:

1. Search for a stock (e.g., "RELIANCE")
2. Click the star icon
3. Go to "Watchlist" tab
4. Stock should appear there

### Test Portfolio:

1. Search for a stock
2. Click "Add to Portfolio"
3. Enter quantity and price
4. Go to "Portfolio" tab
5. Stock should appear there

## 🐛 If Still Not Working

### Check Supabase Connection:

```typescript
// In browser console:
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "Supabase Key:",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Set" : "Not Set"
);
```

### Check User Authentication:

```typescript
// In browser console:
const { data } = await supabase.auth.getUser();
console.log("Current user:", data.user);
```

### Check Table Permissions:

1. Go to Supabase Dashboard
2. Click "Authentication" → "Policies"
3. Verify RLS policies are enabled
4. Check policies for `watchlist` and `portfolio`

## 📝 Summary

The 404 errors are because:

- ❌ Tables don't exist in database
- ✅ Solution: Run the SQL script above
- ✅ Takes 30 seconds to fix
- ✅ Then everything will work!

**Run the SQL script in Supabase Dashboard and you're done!** 🚀
