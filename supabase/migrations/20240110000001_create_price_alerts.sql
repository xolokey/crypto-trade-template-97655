-- Create price_alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol TEXT NOT NULL,
  stock_name TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below', 'change_up', 'change_down')),
  target_price DECIMAL(10, 2),
  target_percent DECIMAL(5, 2),
  current_price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_stock_symbol ON public.price_alerts(stock_symbol);
CREATE INDEX idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own alerts"
  ON public.price_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON public.price_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.price_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.price_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_price_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_price_alerts_timestamp
  BEFORE UPDATE ON public.price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_price_alerts_updated_at();

-- Create alert_history table for tracking
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.price_alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  target_price DECIMAL(10, 2),
  triggered_price DECIMAL(10, 2),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for alert_history
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert history"
  ON public.alert_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_alert_history_user_id ON public.alert_history(user_id);
CREATE INDEX idx_alert_history_triggered_at ON public.alert_history(triggered_at DESC);
