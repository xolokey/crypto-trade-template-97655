-- Add historical price data and enhanced stock information
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS open_price numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS high_price numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS low_price numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS close_price numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS prev_close numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS week_52_high numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS week_52_low numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS pe_ratio numeric;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS market_cap_category text;

-- Create table for stock news and events
CREATE TABLE IF NOT EXISTS stock_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid REFERENCES stocks(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  source text,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  published_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock news"
  ON stock_news FOR SELECT
  USING (true);

-- Create table for AI predictions
CREATE TABLE IF NOT EXISTS stock_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid REFERENCES stocks(id) ON DELETE CASCADE,
  prediction_type text NOT NULL,
  prediction_data jsonb NOT NULL,
  confidence_score numeric,
  created_at timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone
);

ALTER TABLE stock_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock predictions"
  ON stock_predictions FOR SELECT
  USING (true);

-- Create table for candlestick data
CREATE TABLE IF NOT EXISTS stock_candles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid REFERENCES stocks(id) ON DELETE CASCADE,
  interval text NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(stock_id, interval, timestamp)
);

ALTER TABLE stock_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock candles"
  ON stock_candles FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_candles_stock_interval ON stock_candles(stock_id, interval, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stock_news_stock_published ON stock_news(stock_id, published_at DESC);