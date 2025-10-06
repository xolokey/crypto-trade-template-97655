import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NSEStock } from '@/data/nseStocks';

export interface WatchlistItem {
  id: string;
  user_id: string;
  stock_symbol: string;
  stock_name: string;
  sector: string;
  added_at: string;
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
        .from('watchlist')
        .select('*')
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
      const existing = watchlist.find(item => item.stock_symbol === stock.symbol);
      if (existing) {
        toast({
          title: 'Already in Watchlist',
          description: `${stock.symbol} is already in your watchlist`,
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: userId,
          stock_symbol: stock.symbol,
          stock_name: stock.name,
          sector: stock.sector
        })
        .select()
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
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('stock_symbol', stockSymbol);

      if (error) throw error;

      setWatchlist(prev => prev.filter(item => item.stock_symbol !== stockSymbol));
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
    const existing = watchlist.find(item => item.stock_symbol === stock.symbol);
    if (existing) {
      await removeFromWatchlist(stock.symbol);
    } else {
      await addToWatchlist(stock);
    }
  };

  // Check if stock is in watchlist
  const isInWatchlist = (stockSymbol: string) => {
    return watchlist.some(item => item.stock_symbol === stockSymbol);
  };

  // Get watchlisted stock symbols
  const getWatchlistedSymbols = () => {
    return watchlist.map(item => item.stock_symbol);
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