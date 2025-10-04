import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StockCard } from "./StockCard";
import { Loader2 } from "lucide-react";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  change_percent: number;
  volume: number;
}

export const Watchlist = ({ userId }: { userId: string }) => {
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();

    // Subscribe to watchlist changes
    const channel = supabase
      .channel("watchlist-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watchlists",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchWatchlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("watchlists")
        .select(
          `
          stock_id,
          stocks (
            id,
            symbol,
            name,
            exchange,
            current_price,
            change_percent,
            volume
          )
        `
        )
        .eq("user_id", userId);

      if (error) throw error;

      const stocks = data
        ?.map((item: any) => item.stocks)
        .filter(Boolean) as Stock[];
      
      setWatchlistStocks(stocks || []);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (watchlistStocks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">Your watchlist is empty</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add stocks to your watchlist by clicking the star icon
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Watchlist ({watchlistStocks.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlistStocks.map((stock) => (
          <StockCard key={stock.id} stock={stock} />
        ))}
      </div>
    </div>
  );
};