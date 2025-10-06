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
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio(stock_symbol);

-- Enable Row Level Security
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolio
CREATE POLICY "Users can view their own portfolio" ON portfolio
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own portfolio" ON portfolio
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio" ON portfolio
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own portfolio" ON portfolio
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for portfolio updated_at
CREATE TRIGGER update_portfolio_updated_at 
    BEFORE UPDATE ON portfolio 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();