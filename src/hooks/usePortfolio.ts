import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NSEStock } from '@/data/nseStocks';

export interface PortfolioItem {
  id: string;
  user_id: string;
  stock_symbol: string;
  stock_name: string;
  sector: string;
  quantity: number;
  average_price: number;
  total_invested: number;
  added_at: string;
  updated_at: string;
}

export interface AddToPortfolioData {
  stock: NSEStock;
  quantity: number;
  price: number;
}

export const usePortfolio = (userId?: string) => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch portfolio
  const fetchPortfolio = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('Portfolio table not found. Please run database migrations.');
          setPortfolio([]);
          return;
        }
        throw error;
      }
      setPortfolio(data || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      // Don't show toast for missing table - it's expected on first run
      if (!(error instanceof Error && error.message.includes('does not exist'))) {
        toast({
          title: 'Error',
          description: 'Failed to fetch portfolio. Please check database setup.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Add to portfolio
  const addToPortfolio = async ({ stock, quantity, price }: AddToPortfolioData) => {
    if (!userId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add stocks to your portfolio',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if stock already exists in portfolio
      const existing = portfolio.find(item => item.stock_symbol === stock.symbol);
      
      if (existing) {
        // Update existing holding
        const newQuantity = existing.quantity + quantity;
        const newTotalInvested = existing.total_invested + (quantity * price);
        const newAveragePrice = newTotalInvested / newQuantity;

        const { data, error } = await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity,
            average_price: newAveragePrice,
            total_invested: newTotalInvested,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        setPortfolio(prev => prev.map(item => 
          item.id === existing.id ? data : item
        ));

        toast({
          title: 'Portfolio Updated',
          description: `Added ${quantity} more shares of ${stock.symbol}`
        });
      } else {
        // Add new holding
        const { data, error } = await supabase
          .from('portfolio')
          .insert({
            user_id: userId,
            stock_symbol: stock.symbol,
            stock_name: stock.name,
            sector: stock.sector,
            quantity,
            average_price: price,
            total_invested: quantity * price
          })
          .select()
          .single();

        if (error) throw error;

        setPortfolio(prev => [data, ...prev]);
        toast({
          title: 'Added to Portfolio',
          description: `${stock.symbol} has been added to your portfolio`
        });
      }
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to add stock to portfolio',
        variant: 'destructive'
      });
    }
  };

  // Update portfolio item
  const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('portfolio')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      setPortfolio(prev => prev.map(item => 
        item.id === id ? data : item
      ));

      toast({
        title: 'Portfolio Updated',
        description: 'Portfolio item has been updated'
      });
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to update portfolio item',
        variant: 'destructive'
      });
    }
  };

  // Remove from portfolio
  const removeFromPortfolio = async (id: string, stockSymbol: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('portfolio')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setPortfolio(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Removed from Portfolio',
        description: `${stockSymbol} has been removed from your portfolio`
      });
    } catch (error) {
      console.error('Error removing from portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove stock from portfolio',
        variant: 'destructive'
      });
    }
  };

  // Calculate portfolio metrics
  const getPortfolioMetrics = () => {
    const totalInvested = portfolio.reduce((sum, item) => sum + item.total_invested, 0);
    const totalStocks = portfolio.length;
    const totalQuantity = portfolio.reduce((sum, item) => sum + item.quantity, 0);
    
    // Mock current values (in real app, you'd fetch current prices)
    const currentValue = portfolio.reduce((sum, item) => {
      const mockCurrentPrice = item.average_price * (1 + (Math.random() - 0.5) * 0.2);
      return sum + (item.quantity * mockCurrentPrice);
    }, 0);
    
    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      totalGainLoss,
      totalGainLossPercent,
      totalStocks,
      totalQuantity
    };
  };

  // Check if stock is in portfolio
  const isInPortfolio = (stockSymbol: string) => {
    return portfolio.some(item => item.stock_symbol === stockSymbol);
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  return {
    portfolio,
    loading,
    addToPortfolio,
    updatePortfolioItem,
    removeFromPortfolio,
    getPortfolioMetrics,
    isInPortfolio,
    refetch: fetchPortfolio
  };
};