import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  change_percent: number;
  volume: number;
}

export const StockCard = ({ stock }: { stock: Stock }) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkWatchlist();
  }, [stock.id]);

  const checkWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("watchlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("stock_id", stock.id)
      .single();

    setIsInWatchlist(!!data);
  };

  const toggleWatchlist = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from("watchlists")
          .delete()
          .eq("user_id", user.id)
          .eq("stock_id", stock.id);

        if (error) throw error;
        
        setIsInWatchlist(false);
        toast({
          title: "Removed from watchlist",
          description: `${stock.symbol} removed from your watchlist`,
        });
      } else {
        const { error } = await supabase
          .from("watchlists")
          .insert({
            user_id: user.id,
            stock_id: stock.id,
          });

        if (error) throw error;

        setIsInWatchlist(true);
        toast({
          title: "Added to watchlist",
          description: `${stock.symbol} added to your watchlist`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isPositive = stock.change_percent >= 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">{stock.symbol}</CardTitle>
          <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleWatchlist}
          disabled={loading}
          className="h-8 w-8"
        >
          <Star
            className={`h-4 w-4 ${
              isInWatchlist ? "fill-yellow-400 text-yellow-400" : ""
            }`}
          />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              ₹{stock.current_price?.toFixed(2) || "N/A"}
            </span>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {stock.change_percent?.toFixed(2)}%
            </div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{stock.exchange}</span>
            <span>Vol: {stock.volume?.toLocaleString() || "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};