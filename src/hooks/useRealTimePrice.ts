import { useState, useEffect, useCallback } from 'react';
import { fetchRealTimePrice, StockPrice } from '@/lib/marketData';

interface UseRealTimePriceOptions {
  symbol: string;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

export const useRealTimePrice = ({
  symbol,
  refreshInterval = 30000, // 30 seconds default
  enabled = true
}: UseRealTimePriceOptions) => {
  const [price, setPrice] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const priceData = await fetchRealTimePrice(symbol);
      setPrice(priceData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
      console.error('Error fetching price:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Set up interval for updates
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchPrice();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval, enabled]);

  return {
    price,
    loading,
    error,
    lastUpdate,
    refetch: fetchPrice
  };
};

// Hook for multiple stocks
export const useRealTimePrices = (symbols: string[], refreshInterval = 30000) => {
  const [prices, setPrices] = useState<Map<string, StockPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) return;

    try {
      setLoading(true);
      const pricePromises = symbols.map(symbol => fetchRealTimePrice(symbol));
      const priceResults = await Promise.all(pricePromises);
      
      const priceMap = new Map<string, StockPrice>();
      priceResults.forEach((price, index) => {
        priceMap.set(symbols[index], price);
      });
      
      setPrices(priceMap);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      fetchPrices();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    loading,
    lastUpdate,
    refetch: fetchPrices
  };
};