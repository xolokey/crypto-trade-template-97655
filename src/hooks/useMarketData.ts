// React Hook for Real-Time Market Data
// Uses backend API proxies and WebSocket for live updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { marketDataService, StockQuote } from '@/services/marketDataService';

export interface UseMarketDataOptions {
  symbol?: string;
  symbols?: string[];
  pollInterval?: number; // milliseconds
  enabled?: boolean;
}

export interface UseMarketDataReturn {
  data: StockQuote | StockQuote[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

export function useMarketData(options: UseMarketDataOptions): UseMarketDataReturn {
  const {
    symbol,
    symbols,
    pollInterval = 10000, // 10 seconds default
    enabled = true
  } = options;

  const [data, setData] = useState<StockQuote | StockQuote[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let result: StockQuote | StockQuote[] | null = null;

      if (symbols && symbols.length > 0) {
        // Fetch multiple symbols
        result = await marketDataService.getMultipleQuotes(symbols);
      } else if (symbol) {
        // Fetch single symbol
        result = await marketDataService.getStockQuote(symbol);
      }

      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
        setLoading(false);
      }
    }
  }, [symbol, symbols, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled && (symbol || symbols)) {
      fetchData();
    }
  }, [symbol, symbols, enabled, fetchData]);

  // Polling
  useEffect(() => {
    if (!enabled || (!symbol && !symbols)) return;

    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchData, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, symbol, symbols, pollInterval, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    lastUpdate
  };
}

// Hook for single stock
export function useStockQuote(symbol: string, pollInterval?: number) {
  return useMarketData({ symbol, pollInterval });
}

// Hook for multiple stocks
export function useMultipleStockQuotes(symbols: string[], pollInterval?: number) {
  return useMarketData({ symbols, pollInterval });
}

// Hook with WebSocket support (for future implementation)
export function useRealtimeMarketData(options: UseMarketDataOptions) {
  const pollingData = useMarketData(options);
  
  // TODO: Add WebSocket integration here
  // For now, just return polling data
  
  return {
    ...pollingData,
    isRealtime: false, // Will be true when WebSocket is connected
    connectionState: 'POLLING' // Will show WebSocket state when implemented
  };
}
