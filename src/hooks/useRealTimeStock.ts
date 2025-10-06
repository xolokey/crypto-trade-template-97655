// Real-Time Stock Data Hook with WebSocket
// Replaces polling with true real-time updates

import { useState, useEffect, useRef, useCallback } from 'react';
import { marketDataService, StockQuote } from '@/services/marketDataService';

interface UseRealTimeStockOptions {
  symbol: string;
  enableWebSocket?: boolean;
  fallbackInterval?: number; // Fallback to polling if WebSocket fails
}

interface UseRealTimeStockReturn {
  data: StockQuote | null;
  loading: boolean;
  error: Error | null;
  isRealTime: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
}

export function useRealTimeStock({
  symbol,
  enableWebSocket = true,
  fallbackInterval = 5000
}: UseRealTimeStockOptions): UseRealTimeStockReturn {
  const [data, setData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const quote = await marketDataService.getStockQuote(symbol);

      if (isMountedRef.current && quote) {
        setData(quote);
        setLastUpdate(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stock data'));
        setLoading(false);
      }
    }
  }, [symbol]);

  // WebSocket connection
  useEffect(() => {
    if (!enableWebSocket) {
      // Use polling fallback
      fetchData();
      intervalRef.current = setInterval(fetchData, fallbackInterval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    // Try WebSocket connection
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (import.meta.env.PROD ? 'wss://your-api.com/ws/market-data' : 'ws://localhost:8081');

    try {
      console.log(`🔌 Connecting to WebSocket for ${symbol}...`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`✅ WebSocket connected for ${symbol}`);
        setIsConnected(true);
        setIsRealTime(true);
        
        // Subscribe to symbol
        wsRef.current?.send(JSON.stringify({
          action: 'subscribe',
          symbols: [symbol]
        }));

        // Initial fetch
        fetchData();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'price_update' && message.symbol === symbol) {
            console.log(`📊 Real-time update for ${symbol}:`, message.data);
            
            if (isMountedRef.current) {
              setData(message.data);
              setLastUpdate(new Date(message.timestamp));
              setLoading(false);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`❌ WebSocket error for ${symbol}:`, error);
        setIsConnected(false);
        setIsRealTime(false);
        
        // Fallback to polling
        console.log(`⏱️ Falling back to polling for ${symbol}`);
        fetchData();
        intervalRef.current = setInterval(fetchData, fallbackInterval);
      };

      wsRef.current.onclose = () => {
        console.log(`🔌 WebSocket closed for ${symbol}`);
        setIsConnected(false);
        setIsRealTime(false);
        
        // Fallback to polling
        if (isMountedRef.current) {
          fetchData();
          intervalRef.current = setInterval(fetchData, fallbackInterval);
        }
      };

    } catch (err) {
      console.error(`Failed to create WebSocket for ${symbol}:`, err);
      // Fallback to polling
      fetchData();
      intervalRef.current = setInterval(fetchData, fallbackInterval);
    }

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          action: 'unsubscribe',
          symbols: [symbol]
        }));
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, enableWebSocket, fallbackInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isRealTime,
    isConnected,
    lastUpdate,
    refetch: fetchData
  };
}

// Convenience hook for single stock
export function useRealTimePrice(symbol: string) {
  return useRealTimeStock({ symbol });
}

// Hook for multiple stocks (uses polling, not WebSocket)
export function useMultipleRealTimeStocks(symbols: string[], interval = 5000) {
  const [data, setData] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const quotes = await marketDataService.getMultipleQuotes(symbols);
        setData(quotes);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stocks'));
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [symbols.join(','), interval]);

  return { data, loading, error, lastUpdate };
}
