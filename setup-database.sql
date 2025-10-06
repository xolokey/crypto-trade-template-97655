-- ============================================
-- Indian Stock Tracker - Database Setup
-- ============================================
-- Run this script in Supabase SQL Editor
-- ============================================

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio(stock_symbol);

-- Enable Row Level Security (RLS)
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can insert into their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can delete from their own watchlist" ON watchlist;

DROP POLICY IF EXISTS "Users can view their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can insert into their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can delete from their own portfolio" ON portfolio;

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

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify tables were created:

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('watchlist', 'portfolio');

-- Check watchlist structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlist';

-- Check portfolio structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio';

-- ============================================
-- Setup Complete! ✅
-- ============================================