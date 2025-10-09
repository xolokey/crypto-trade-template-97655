// Enhanced Real-Time Stock Data Hook with WebSocket
// Provides automatic fallback to polling and comprehensive state management

import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebSocketService, ConnectionState } from '@/services/websocketService';
import { marketDataService, StockQuote } from '@/services/marketDataService';

interface UseRealTimeStockOptions {
  symbol: string;
  enableWebSocket?: boolean;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
  onUpdate?: (data: StockQuote) => void;
  onError?: (error: Error) => void;
}

interface UseRealTimeStockReturn {
  data: StockQuote | null;
  loading: boolean;
  error: Error | null;
  isRealTime: boolean;
  isConnected: boolean;
  connectionState: ConnectionState;
  lastUpdate: Date | null;
  latency: number;
  performanceMetrics: {
    messagesPerSecond: number;
    averageLatency: number;
    connectionUptime: number;
    reconnectCount: number;
  };
  refetch: () => Promise<void>;
}

export function useRealTimeStock({
  symbol,
  enableWebSocket = true,
  fallbackToPolling = true,
  pollingInterval = 30000,
  onUpdate,
  onError
}: UseRealTimeStockOptions): UseRealTimeStockReturn {
  const [data, setData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('CLOSED');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    messagesPerSecond: 0,
    averageLatency: 0,
    connectionUptime: 0,
    reconnectCount: 0
  });
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const wsServiceRef = useRef<ReturnType<typeof getWebSocketService> | null>(null);

  // Fetch data from API (used for polling fallback and initial load)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const quote = await marketDataService.getStockQuote(symbol);

      if (isMountedRef.current && quote) {
        setData(quote);
        setLastUpdate(new Date());
        setLoading(false);
        
        if (onUpdate) {
          onUpdate(quote);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error('Failed to fetch stock data');
        setError(errorObj);
        setLoading(false);
        
        if (onError) {
          onError(errorObj);
        }
      }
    }
  }, [symbol, onUpdate, onError]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log(`⏱️  Starting polling for ${symbol} (${pollingInterval}ms interval)`);
    setIsRealTime(false);
    
    // Initial fetch
    fetchData();
    
    // Set up interval
    pollingIntervalRef.current = setInterval(fetchData, pollingInterval);
  }, [symbol, pollingInterval, fetchData]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log(`⏹️  Stopping polling for ${symbol}`);
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [symbol]);

  // WebSocket setup
  useEffect(() => {
    // If WebSocket is disabled, use polling only
    if (!enableWebSocket) {
      startPolling();
      return () => {
        stopPolling();
      };
    }

    // Get WebSocket URL from environment
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';
    
    try {
      // Initialize WebSocket service
      wsServiceRef.current = getWebSocketService(wsUrl);
      const wsService = wsServiceRef.current;

      // Set up message handler
      const unsubscribeMessage = wsService.onMessage((message: any) => {
        if (message.type === 'price_update' && message.symbol === symbol) {
          if (isMountedRef.current) {
            setData(message.data as StockQuote);
            setLastUpdate(new Date(message.timestamp));
            setLoading(false);
            
            // Calculate latency
            if (message.timestamp) {
              const msgLatency = Date.now() - new Date(message.timestamp).getTime();
              setLatency(msgLatency);
            }
            
            if (onUpdate) {
              onUpdate(message.data as StockQuote);
            }
          }
        }
      });

      // Set up error handler
      const unsubscribeError = wsService.onError((err) => {
        console.error(`WebSocket error for ${symbol}:`, err);
        if (isMountedRef.current) {
          setError(err);
          
          if (onError) {
            onError(err);
          }
        }
      });

      // Set up connection state handler
      const unsubscribeConnection = wsService.onConnectionChange((state) => {
        if (isMountedRef.current) {
          setConnectionState(state);
          setIsConnected(state === 'OPEN');
          
          if (state === 'OPEN') {
            console.log(`✅ WebSocket connected for ${symbol}`);
            setIsRealTime(true);
            stopPolling();
          } else if (state === 'CLOSED' || state === 'RECONNECTING') {
            console.log(`🔌 WebSocket ${state.toLowerCase()} for ${symbol}`);
            setIsRealTime(false);
            
            // Fall back to polling if enabled
            if (fallbackToPolling && state === 'CLOSED') {
              startPolling();
            }
          }
        }
      });

      // Connect to WebSocket
      wsService.connect();

      // Subscribe to symbol
      wsService.subscribe(symbol);

      // Initial fetch while connecting
      fetchData();

      // Cleanup
      return () => {
        unsubscribeMessage();
        unsubscribeError();
        unsubscribeConnection();
        wsService.unsubscribe(symbol);
        stopPolling();
      };
    } catch (err) {
      console.error(`Failed to initialize WebSocket for ${symbol}:`, err);
      
      // Fall back to polling
      if (fallbackToPolling) {
        startPolling();
      }
      
      return () => {
        stopPolling();
      };
    }
  }, [symbol, enableWebSocket, fallbackToPolling, pollingInterval, fetchData, startPolling, stopPolling, onUpdate, onError]);

  // Update latency and performance metrics from WebSocket service
  useEffect(() => {
    if (wsServiceRef.current && isConnected) {
      const interval = setInterval(() => {
        const avgLatency = wsServiceRef.current?.getLatency() || 0;
        setLatency(avgLatency);
        
        // Update performance metrics
        if (wsServiceRef.current?.getPerformanceMetrics) {
          const metrics = wsServiceRef.current.getPerformanceMetrics();
          setPerformanceMetrics(metrics);
        }
      }, 2000); // Update every 2 seconds for better responsiveness

      return () => clearInterval(interval);
    }
  }, [isConnected]);

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
    connectionState,
    lastUpdate,
    latency,
    performanceMetrics,
    refetch: fetchData
  };
}

// Convenience hook for single stock with default options
export function useRealTimePrice(symbol: string) {
  return useRealTimeStock({ symbol });
}

// Hook for multiple stocks (uses polling, not WebSocket for now)
export function useMultipleRealTimeStocks(symbols: string[], interval = 30000) {
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
