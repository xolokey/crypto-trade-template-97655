import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NSEStock } from '@/data/nseStocks';

export interface WatchlistItem {
  id: string;
  user_id: string;
  stock_id: string;
  added_at: string;
  stocks?: {
    symbol: string;
    name: string;
    sector: string;
  };
}

export const useWatchlist = (userId?: string) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch watchlist
  const fetchWatchlist = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select(`
          *,
          stocks (
            symbol,
            name,
            sector
          )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Watchlist table not found. Please run database migrations.');
          setWatchlist([]);
          return;
        }
        throw error;
      }
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      // Don't show toast for missing table - it's expected on first run
      if (!(error instanceof Error && error.message.includes('does not exist'))) {
        toast({
          title: 'Error',
          description: 'Failed to fetch watchlist. Please check database setup.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Add to watchlist
  const addToWatchlist = async (stock: NSEStock) => {
    if (!userId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add stocks to your watchlist',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if already in watchlist
      const existing = watchlist.find(item => 
        item.stocks?.symbol === stock.symbol
      );
      if (existing) {
        toast({
          title: 'Already in Watchlist',
          description: `${stock.symbol} is already in your watchlist`,
          variant: 'destructive'
        });
        return;
      }

      // Find stock ID from stocks table
      const { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('id')
        .eq('symbol', stock.symbol)
        .single();

      if (stockError || !stockData) {
        toast({
          title: 'Error',
          description: 'Stock not found in database',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase
        .from('watchlists')
        .insert({
          user_id: userId,
          stock_id: stockData.id
        })
        .select(`
          *,
          stocks (
            symbol,
            name,
            sector
          )
        `)
        .single();

      if (error) throw error;

      setWatchlist(prev => [data, ...prev]);
      toast({
        title: 'Added to Watchlist',
        description: `${stock.symbol} has been added to your watchlist`
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add stock to watchlist',
        variant: 'destructive'
      });
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (stockSymbol: string) => {
    if (!userId) return;

    try {
      // Find the watchlist item by stock symbol
      const item = watchlist.find(w => w.stocks?.symbol === stockSymbol);
      if (!item) return;

      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', item.id)
        .eq('user_id', userId);

      if (error) throw error;

      setWatchlist(prev => prev.filter(w => w.id !== item.id));
      toast({
        title: 'Removed from Watchlist',
        description: `${stockSymbol} has been removed from your watchlist`
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove stock from watchlist',
        variant: 'destructive'
      });
    }
  };

  // Toggle watchlist
  const toggleWatchlist = async (stock: NSEStock) => {
    const existing = watchlist.find(item => item.stocks?.symbol === stock.symbol);
    if (existing) {
      await removeFromWatchlist(stock.symbol);
    } else {
      await addToWatchlist(stock);
    }
  };

  // Check if stock is in watchlist
  const isInWatchlist = (stockSymbol: string) => {
    return watchlist.some(item => item.stocks?.symbol === stockSymbol);
  };

  // Get watchlisted stock symbols
  const getWatchlistedSymbols = () => {
    return watchlist
      .map(item => item.stocks?.symbol)
      .filter((symbol): symbol is string => symbol !== undefined);
  };

  useEffect(() => {
    fetchWatchlist();
  }, [userId]);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    getWatchlistedSymbols,
    refetch: fetchWatchlist
  };
};