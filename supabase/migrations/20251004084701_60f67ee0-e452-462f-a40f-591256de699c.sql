-- Create stocks table
CREATE TABLE public.stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol varchar(20) NOT NULL UNIQUE,
  name text NOT NULL,
  exchange varchar(10) NOT NULL, -- NSE or BSE
  sector varchar(100),
  market_cap bigint,
  current_price decimal(15,2),
  change_percent decimal(10,2),
  volume bigint,
  last_updated timestamptz DEFAULT now(),
  is_nifty_50 boolean DEFAULT false,
  is_sensex_30 boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_stocks_symbol ON public.stocks(symbol);
CREATE INDEX idx_stocks_nifty ON public.stocks(is_nifty_50) WHERE is_nifty_50 = true;
CREATE INDEX idx_stocks_sensex ON public.stocks(is_sensex_30) WHERE is_sensex_30 = true;

-- Create stock_prices table for historical data
CREATE TABLE public.stock_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  price decimal(15,2) NOT NULL,
  volume bigint,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX idx_stock_prices_stock_timestamp ON public.stock_prices(stock_id, timestamp DESC);

-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create watchlist table
CREATE TABLE public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stock_id uuid REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stocks (public read)
CREATE POLICY "Anyone can view stocks"
  ON public.stocks FOR SELECT
  USING (true);

-- RLS Policies for stock_prices (public read)
CREATE POLICY "Anyone can view stock prices"
  ON public.stock_prices FOR SELECT
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for watchlists
CREATE POLICY "Users can view their own watchlist"
  ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their watchlist"
  ON public.watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their watchlist"
  ON public.watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();