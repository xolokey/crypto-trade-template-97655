import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Star } from "lucide-react";
import { StockChart } from "@/components/stocks/StockChart";
import { AIInsights } from "@/components/stocks/AIInsights";
import AdvancedTradingChart from "@/components/charts/AdvancedTradingChart";
import { useToast } from "@/hooks/use-toast";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  change_percent: number;
  volume: number;
  open_price: number;
  high_price: number;
  low_price: number;
  prev_close: number;
  week_52_high: number;
  week_52_low: number;
  market_cap: number;
  pe_ratio: number;
}

// Generate sample OHLCV data for the chart
const generateSampleData = (symbol: string, currentPrice: number) => {
  const data = [];
  const basePrice = currentPrice;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const price = basePrice * (1 + change * (i / 30));
    
    data.push({
      timestamp: date,
      open: price * (1 + (Math.random() - 0.5) * 0.01),
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: Math.floor(Math.random() * 10000000)
    });
  }
  
  return data;
};

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stock, setStock] = useState<Stock | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockDetails();
    checkWatchlist();
  }, [id]);

  const fetchStockDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stocks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setStock(data);
    } catch (error) {
      console.error("Error fetching stock:", error);
      toast({
        title: "Error",
        description: "Failed to load stock details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("watchlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("stock_id", id)
      .single();

    setIsInWatchlist(!!data);
  };

  const toggleWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (isInWatchlist) {
        await supabase
          .from("watchlists")
          .delete()
          .eq("user_id", user.id)
          .eq("stock_id", id);
        setIsInWatchlist(false);
        toast({ title: "Removed from watchlist" });
      } else {
        await supabase
          .from("watchlists")
          .insert({ user_id: user.id, stock_id: id });
        setIsInWatchlist(true);
        toast({ title: "Added to watchlist" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !stock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isPositive = stock.change_percent >= 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            variant={isInWatchlist ? "default" : "outline"}
            size="sm"
            onClick={toggleWatchlist}
          >
            <Star className={`mr-2 h-4 w-4 ${isInWatchlist ? "fill-current" : ""}`} />
            {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </Button>
        </div>
      </header>

      <div className="container py-8 px-4">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">{stock.symbol}</h1>
              <p className="text-lg text-muted-foreground">{stock.name}</p>
              <p className="text-sm text-muted-foreground">{stock.exchange}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">₹{stock.current_price?.toFixed(2)}</p>
              <div className={`flex items-center gap-2 justify-end text-lg font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {stock.change_percent?.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Open</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{stock.open_price?.toFixed(2) || stock.current_price?.toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Day High</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-500">₹{stock.high_price?.toFixed(2) || (stock.current_price * 1.02).toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Day Low</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-500">₹{stock.low_price?.toFixed(2) || (stock.current_price * 0.98).toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>52W High</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{stock.week_52_high?.toFixed(2) || (stock.current_price * 1.5).toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>52W Low</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{stock.week_52_low?.toFixed(2) || (stock.current_price * 0.7).toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Volume</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stock.volume?.toLocaleString()}</p></CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <AdvancedTradingChart 
            symbol={stock.symbol}
            data={generateSampleData(stock.symbol, stock.current_price)}
            realTimePrice={stock.current_price}
            height={600}
            showVolume={true}
            showIndicators={true}
          />
        </div>

        <AIInsights 
          stockId={stock.id}
          symbol={stock.symbol}
          name={stock.name}
          currentPrice={stock.current_price}
          changePercent={stock.change_percent}
        />
      </div>
    </div>
  );
}