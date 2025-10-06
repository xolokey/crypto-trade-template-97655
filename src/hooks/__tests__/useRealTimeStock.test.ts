import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRealTimeStock } from '../useRealTimeStock';
import * as websocketService from '@/services/websocketService';
import { marketDataService } from '@/services/marketDataService';
import type { StockQuote } from '@/services/marketDataService';

// Mock the services
vi.mock('@/services/websocketService');
vi.mock('@/services/marketDataService', () => ({
  marketDataService: {
    getStockQuote: vi.fn(),
    getMultipleQuotes: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn()
  }
}));

describe('useRealTimeStock', () => {
  let mockWebSocketService: any;
  
  const mockStockQuote: StockQuote = {
    symbol: 'AAPL',
    price: 150.25,
    change: 2.5,
    changePercent: 1.69,
    volume: 1000000,
    high: 151.0,
    low: 148.5,
    open: 149.0,
    previousClose: 147.75,
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    // Mock WebSocket service
    mockWebSocketService = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      onMessage: vi.fn(() => vi.fn()), // Returns unsubscribe function
      onError: vi.fn(() => vi.fn()),
      onConnectionChange: vi.fn(() => vi.fn()),
      isConnected: vi.fn(() => false),
      getConnectionState: vi.fn(() => 'CLOSED'),
      getLatency: vi.fn(() => 0),
      getLastMessageTime: vi.fn(() => new Date()),
      getActiveSubscriptions: vi.fn(() => new Set()),
      getMetrics: vi.fn(() => ({
        connectionState: 'CLOSED',
        connectedAt: null,
        lastMessageAt: null,
        messageCount: 0,
        errorCount: 0,
        reconnectAttempts: 0,
        averageLatency: 0,
        activeSubscriptions: 0
      }))
    };

    vi.mocked(websocketService.getWebSocketService).mockReturnValue(mockWebSocketService);

    // Mock market data service
    vi.mocked(marketDataService.getStockQuote).mockResolvedValue(mockStockQuote);
    vi.mocked(marketDataService.getMultipleQuotes).mockResolvedValue([mockStockQuote]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Automatic Subscription on Mount', () => {
    it('should subscribe to symbol when hook mounts with WebSocket enabled', async () => {
      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.connect).toHaveBeenCalled();
        expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('AAPL');
      });
    });

    it('should fetch initial data on mount', async () => {
      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL' 
      }));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalledWith('AAPL');
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toEqual(mockStockQuote);
      });
    });

    it('should not subscribe to WebSocket when disabled', async () => {
      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false 
      }));

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalled();
      });

      expect(mockWebSocketService.connect).not.toHaveBeenCalled();
      expect(mockWebSocketService.subscribe).not.toHaveBeenCalled();
    });

    it('should set up message handler on mount', async () => {
      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onMessage).toHaveBeenCalled();
      });
    });

    it('should set up error handler on mount', async () => {
      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onError).toHaveBeenCalled();
      });
    });

    it('should set up connection state handler on mount', async () => {
      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });
    });
  });

  describe('Unsubscription on Unmount', () => {
    it('should unsubscribe from symbol when hook unmounts', async () => {
      const { unmount } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('AAPL');
      });

      unmount();

      expect(mockWebSocketService.unsubscribe).toHaveBeenCalledWith('AAPL');
    });

    it('should clean up message handler on unmount', async () => {
      const unsubscribeMessage = vi.fn();
      mockWebSocketService.onMessage.mockReturnValue(unsubscribeMessage);

      const { unmount } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onMessage).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMessage).toHaveBeenCalled();
    });

    it('should clean up error handler on unmount', async () => {
      const unsubscribeError = vi.fn();
      mockWebSocketService.onError.mockReturnValue(unsubscribeError);

      const { unmount } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onError).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeError).toHaveBeenCalled();
    });

    it('should clean up connection handler on unmount', async () => {
      const unsubscribeConnection = vi.fn();
      mockWebSocketService.onConnectionChange.mockReturnValue(unsubscribeConnection);

      const { unmount } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true 
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeConnection).toHaveBeenCalled();
    });

    it('should stop polling on unmount when using polling mode', async () => {
      vi.useFakeTimers();
      
      const { unmount } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false,
        pollingInterval: 1000
      }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalled();
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Advance time to trigger polling
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalled();
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Unmount
      unmount();

      // Advance time - should not fetch anymore
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(marketDataService.getStockQuote).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Fallback to Polling', () => {
    it('should start polling when WebSocket is disabled', async () => {
      vi.useFakeTimers();
      
      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false,
        pollingInterval: 1000
      }));

      // Initial fetch
      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalledTimes(1);
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Advance time to trigger polling
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalledTimes(1);
      });
      
      vi.useRealTimers();
    });

    it('should fall back to polling when WebSocket connection closes', async () => {
      vi.useFakeTimers();
      
      let connectionChangeHandler: ((state: string) => void) | null = null;
      
      mockWebSocketService.onConnectionChange.mockImplementation((handler: any) => {
        connectionChangeHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true,
        fallbackToPolling: true,
        pollingInterval: 1000
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      // Simulate WebSocket connection closing
      act(() => {
        if (connectionChangeHandler) {
          connectionChangeHandler('CLOSED');
        }
      });

      await waitFor(() => {
        expect(result.current.isRealTime).toBe(false);
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Should start polling
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalled();
      });
      
      vi.useRealTimers();
    });

    it('should not fall back to polling when fallbackToPolling is false', async () => {
      vi.useFakeTimers();
      
      let connectionChangeHandler: ((state: string) => void) | null = null;
      
      mockWebSocketService.onConnectionChange.mockImplementation((handler: any) => {
        connectionChangeHandler = handler;
        return vi.fn();
      });

      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true,
        fallbackToPolling: false,
        pollingInterval: 1000
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Simulate WebSocket connection closing
      act(() => {
        if (connectionChangeHandler) {
          connectionChangeHandler('CLOSED');
        }
      });

      // Advance time - should not start polling
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should only have initial fetch, no polling
      expect(marketDataService.getStockQuote).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should stop polling when WebSocket reconnects', async () => {
      vi.useFakeTimers();
      
      let connectionChangeHandler: ((state: string) => void) | null = null;
      
      mockWebSocketService.onConnectionChange.mockImplementation((handler: any) => {
        connectionChangeHandler = handler;
        return vi.fn();
      });

      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true,
        fallbackToPolling: true,
        pollingInterval: 1000
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      // Simulate WebSocket closing and starting polling
      act(() => {
        if (connectionChangeHandler) {
          connectionChangeHandler('CLOSED');
        }
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Verify polling is active
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalled();
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Simulate WebSocket reconnecting
      act(() => {
        if (connectionChangeHandler) {
          connectionChangeHandler('OPEN');
        }
      });

      // Advance time - polling should have stopped
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(marketDataService.getStockQuote).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Reconnection Handling', () => {
    it('should update connection state when reconnecting', async () => {
      let connectionChangeHandler: ((state: string) => void) | null = null;
      
      mockWebSocketService.onConnectionChange.mockImplementation((handler: any) => {
        connectionChangeHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      // Simulate reconnecting state
      act(() => {
        if (connectionChangeHandler) {
          connectionChangeHandler('RECONNECTING');
        }
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('RECONNECTING');
        expect(result.current.isConnected).toBe(false);
        expect(result.current.isRealTime).toBe(false);
      });
    });

    it('should update to real-time mode when connection opens', async () => {
      let connectionChangeHandler: ((state: string) => void) | null = null;
      
      mockWebSocketService.onConnectionChange.mockImplementation((handler: any) => {
        connectionChangeHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      // Simulate connection opening
      act(() => {
        if (connectionChangeHandler) {
          connectionChangeHandler('OPEN');
        }
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('OPEN');
        expect(result.current.isConnected).toBe(true);
        expect(result.current.isRealTime).toBe(true);
      });
    });

    it('should handle multiple reconnection cycles', async () => {
      let connectionChangeHandler: ((state: string) => void) | null = null;
      
      mockWebSocketService.onConnectionChange.mockImplementation((handler: any) => {
        connectionChangeHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true,
        fallbackToPolling: true
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onConnectionChange).toHaveBeenCalled();
      });

      // First cycle: OPEN -> CLOSED -> RECONNECTING -> OPEN
      act(() => {
        if (connectionChangeHandler) connectionChangeHandler('OPEN');
      });
      await waitFor(() => expect(result.current.isRealTime).toBe(true));

      act(() => {
        if (connectionChangeHandler) connectionChangeHandler('CLOSED');
      });
      await waitFor(() => expect(result.current.isRealTime).toBe(false));

      act(() => {
        if (connectionChangeHandler) connectionChangeHandler('RECONNECTING');
      });
      await waitFor(() => expect(result.current.connectionState).toBe('RECONNECTING'));

      act(() => {
        if (connectionChangeHandler) connectionChangeHandler('OPEN');
      });
      await waitFor(() => expect(result.current.isRealTime).toBe(true));

      // Second cycle
      act(() => {
        if (connectionChangeHandler) connectionChangeHandler('CLOSED');
      });
      await waitFor(() => expect(result.current.isRealTime).toBe(false));

      act(() => {
        if (connectionChangeHandler) connectionChangeHandler('OPEN');
      });
      await waitFor(() => expect(result.current.isRealTime).toBe(true));
    });
  });

  describe('Real-Time Data Updates', () => {
    it('should update data when receiving WebSocket message', async () => {
      let messageHandler: ((message: any) => void) | null = null;
      
      mockWebSocketService.onMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onMessage).toHaveBeenCalled();
      });

      const updatedQuote = {
        ...mockStockQuote,
        price: 155.50,
        change: 7.75
      };

      // Simulate receiving WebSocket message
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'price_update',
            symbol: 'AAPL',
            data: updatedQuote,
            timestamp: new Date().toISOString()
          });
        }
      });

      await waitFor(() => {
        expect(result.current.data?.price).toBe(155.50);
        expect(result.current.data?.change).toBe(7.75);
      });
    });

    it('should ignore messages for different symbols', async () => {
      let messageHandler: ((message: any) => void) | null = null;
      
      mockWebSocketService.onMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onMessage).toHaveBeenCalled();
        expect(result.current.data).toBeTruthy();
      });

      const initialPrice = result.current.data?.price;

      // Simulate receiving message for different symbol
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'price_update',
            symbol: 'GOOGL',
            data: { ...mockStockQuote, symbol: 'GOOGL', price: 2800 },
            timestamp: new Date().toISOString()
          });
        }
      });

      // Wait a bit to ensure no update happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Price should not change
      expect(result.current.data?.price).toBe(initialPrice);
    });

    it('should calculate latency from message timestamp', async () => {
      let messageHandler: ((message: any) => void) | null = null;
      
      mockWebSocketService.onMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return vi.fn();
      });

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onMessage).toHaveBeenCalled();
      });

      const messageTimestamp = new Date(Date.now() - 200); // 200ms ago

      // Simulate receiving message with timestamp
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'price_update',
            symbol: 'AAPL',
            data: mockStockQuote,
            timestamp: messageTimestamp.toISOString()
          });
        }
      });

      await waitFor(() => {
        expect(result.current.latency).toBeGreaterThan(0);
      });
    });

    it('should call onUpdate callback when data updates', async () => {
      let messageHandler: ((message: any) => void) | null = null;
      
      mockWebSocketService.onMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return vi.fn();
      });

      const onUpdate = vi.fn();

      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true,
        onUpdate
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onMessage).toHaveBeenCalled();
      });

      // Simulate receiving message
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'price_update',
            symbol: 'AAPL',
            data: mockStockQuote,
            timestamp: new Date().toISOString()
          });
        }
      });

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(mockStockQuote);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(marketDataService.getStockQuote).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false
      }));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Network error');
        expect(result.current.loading).toBe(false);
      });
    });

    it('should call onError callback on fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(marketDataService.getStockQuote).mockRejectedValue(error);

      const onError = vi.fn();

      renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false,
        onError
      }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should handle WebSocket errors', async () => {
      let errorHandler: ((error: Error) => void) | null = null;
      
      mockWebSocketService.onError.mockImplementation((handler: any) => {
        errorHandler = handler;
        return vi.fn();
      });

      const onError = vi.fn();

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: true,
        onError
      }));

      await waitFor(() => {
        expect(mockWebSocketService.onError).toHaveBeenCalled();
      });

      const wsError = new Error('WebSocket connection failed');

      // Simulate WebSocket error
      act(() => {
        if (errorHandler) {
          errorHandler(wsError);
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(onError).toHaveBeenCalledWith(wsError);
      });
    });

    it('should continue working after error recovery', async () => {
      vi.useFakeTimers();
      
      // First call fails
      vi.mocked(marketDataService.getStockQuote).mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      vi.mocked(marketDataService.getStockQuote).mockResolvedValueOnce(mockStockQuote);

      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false,
        pollingInterval: 1000
      }));

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Advance time to trigger next poll
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should recover and get data
      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
        expect(result.current.error).toBeNull();
      });
      
      vi.useRealTimers();
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false
      }));

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalledTimes(1);
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(marketDataService.getStockQuote).toHaveBeenCalledTimes(1);
    });

    it('should update loading state during refetch', async () => {
      const { result } = renderHook(() => useRealTimeStock({ 
        symbol: 'AAPL',
        enableWebSocket: false
      }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch
      act(() => {
        result.current.refetch();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Symbol Changes', () => {
    it('should unsubscribe from old symbol and subscribe to new symbol', async () => {
      const { rerender } = renderHook(
        ({ symbol }) => useRealTimeStock({ symbol, enableWebSocket: true }),
        { initialProps: { symbol: 'AAPL' } }
      );

      await waitFor(() => {
        expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('AAPL');
      });

      vi.mocked(mockWebSocketService.subscribe).mockClear();
      vi.mocked(mockWebSocketService.unsubscribe).mockClear();

      // Change symbol
      rerender({ symbol: 'GOOGL' });

      await waitFor(() => {
        expect(mockWebSocketService.unsubscribe).toHaveBeenCalledWith('AAPL');
        expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('GOOGL');
      });
    });

    it('should fetch data for new symbol', async () => {
      const { rerender } = renderHook(
        ({ symbol }) => useRealTimeStock({ symbol, enableWebSocket: false }),
        { initialProps: { symbol: 'AAPL' } }
      );

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalledWith('AAPL');
      });

      vi.mocked(marketDataService.getStockQuote).mockClear();

      // Change symbol
      rerender({ symbol: 'GOOGL' });

      await waitFor(() => {
        expect(marketDataService.getStockQuote).toHaveBeenCalledWith('GOOGL');
      });
    });
  });
});
