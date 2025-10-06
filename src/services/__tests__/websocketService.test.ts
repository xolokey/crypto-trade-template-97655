import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketService, ConnectionState } from '../websocketService';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWebSocket: any;
  let WebSocketConstructor: any;

  beforeEach(() => {
    // Mock WebSocket instance
    mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    };

    // Mock WebSocket constructor
    WebSocketConstructor = vi.fn(() => mockWebSocket);
    global.WebSocket = WebSocketConstructor as any;
    
    // Add WebSocket constants
    (global.WebSocket as any).CONNECTING = 0;
    (global.WebSocket as any).OPEN = 1;
    (global.WebSocket as any).CLOSING = 2;
    (global.WebSocket as any).CLOSED = 3;

    // Create a fresh service instance for each test
    service = new WebSocketService({ url: 'ws://localhost:8081' });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('Connection Lifecycle', () => {
    it('should initialize with CLOSED state', () => {
      expect(service.getConnectionState()).toBe('CLOSED');
      expect(service.isConnected()).toBe(false);
    });

    it('should transition to CONNECTING state when connect is called', () => {
      const stateHandler = vi.fn();
      service.onConnectionChange(stateHandler);

      service.connect();

      expect(service.getConnectionState()).toBe('CONNECTING');
      expect(stateHandler).toHaveBeenCalledWith('CONNECTING');
    });

    it('should transition to OPEN state when connection opens', () => {
      const stateHandler = vi.fn();
      service.onConnectionChange(stateHandler);

      service.connect();
      
      // Simulate WebSocket open event
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      expect(service.getConnectionState()).toBe('OPEN');
      expect(service.isConnected()).toBe(true);
      expect(stateHandler).toHaveBeenCalledWith('OPEN');
    });

    it('should transition to CLOSING then CLOSED when disconnect is called', () => {
      const stateHandler = vi.fn();
      service.onConnectionChange(stateHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.disconnect();

      expect(stateHandler).toHaveBeenCalledWith('CLOSING');
      expect(stateHandler).toHaveBeenCalledWith('CLOSED');
      expect(service.isConnected()).toBe(false);
    });

    it('should not attempt to connect if already connected', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      const wsConstructorCallCount = (global.WebSocket as any).mock.calls.length;
      
      service.connect();

      // Should not create a new WebSocket
      expect((global.WebSocket as any).mock.calls.length).toBe(wsConstructorCallCount);
    });

    it('should handle connection close event and attempt reconnection', () => {
      const stateHandler = vi.fn();
      service.onConnectionChange(stateHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Simulate unexpected close event (not intentional)
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006, reason: 'Abnormal' }));
      }

      // Should transition to RECONNECTING for unexpected closes
      expect(service.getConnectionState()).toBe('RECONNECTING');
      expect(stateHandler).toHaveBeenCalledWith('CLOSED');
      expect(stateHandler).toHaveBeenCalledWith('RECONNECTING');
    });
  });

  describe('Reconnection Logic with Exponential Backoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt to reconnect after connection loss', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Simulate unexpected close
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006, reason: 'Abnormal' }));
      }

      expect(service.getConnectionState()).toBe('RECONNECTING');
    });

    it('should use exponential backoff for reconnection attempts', () => {
      const stateHandler = vi.fn();
      service.onConnectionChange(stateHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // First disconnect - should reconnect after 1s (2^0 * 1000)
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }

      expect(service.getConnectionState()).toBe('RECONNECTING');

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);
      
      // Should attempt reconnection
      expect(service.getConnectionState()).toBe('CONNECTING');

      // Simulate another failure - should reconnect after 2s (2^1 * 1000)
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }

      expect(service.getConnectionState()).toBe('RECONNECTING');

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);
      
      expect(service.getConnectionState()).toBe('CONNECTING');
    });

    it('should cap reconnection delay at 30 seconds', () => {
      service = new WebSocketService({ 
        url: 'ws://localhost:8081',
        reconnectInterval: 1000,
        maxReconnectAttempts: 20
      });

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Simulate multiple failures to reach max delay
      for (let i = 0; i < 10; i++) {
        mockWebSocket.readyState = WebSocket.CLOSED;
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
        }

        // The delay should be capped at 30000ms
        const expectedDelay = Math.min(1000 * Math.pow(2, i), 30000);
        vi.advanceTimersByTime(expectedDelay);
      }

      // Verify it's still attempting to reconnect
      expect(service.getConnectionState()).toBe('CONNECTING');
    });

    it('should stop reconnecting after max attempts', () => {
      service = new WebSocketService({ 
        url: 'ws://localhost:8081',
        maxReconnectAttempts: 3
      });

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Simulate 3 failed reconnection attempts
      for (let i = 0; i < 3; i++) {
        mockWebSocket.readyState = WebSocket.CLOSED;
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
        }

        const delay = 1000 * Math.pow(2, i);
        vi.advanceTimersByTime(delay);
      }

      // After max attempts, should give up
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }

      expect(service.getConnectionState()).toBe('CLOSED');
    });

    it('should reset reconnection attempts on successful connection', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Simulate a disconnect
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }

      // Reconnect successfully
      vi.advanceTimersByTime(1000);
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      const metrics = service.getMetrics();
      expect(metrics.reconnectAttempts).toBe(0);
    });

    it('should not reconnect if disconnect was intentional', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Intentional disconnect
      service.disconnect();

      // Should not transition to RECONNECTING
      expect(service.getConnectionState()).toBe('CLOSED');

      // Advance time - should not attempt reconnection
      vi.advanceTimersByTime(10000);
      expect(service.getConnectionState()).toBe('CLOSED');
    });
  });

  describe('Subscription Persistence', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track subscribed symbols', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.subscribe('AAPL');
      service.subscribe(['GOOGL', 'MSFT']);

      const subscriptions = service.getActiveSubscriptions();
      expect(subscriptions.size).toBe(3);
      expect(subscriptions.has('AAPL')).toBe(true);
      expect(subscriptions.has('GOOGL')).toBe(true);
      expect(subscriptions.has('MSFT')).toBe(true);
    });

    it('should send subscribe message when connected', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.subscribe(['AAPL', 'GOOGL']);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'subscribe',
          symbols: ['AAPL', 'GOOGL']
        })
      );
    });

    it('should not send subscribe message when disconnected', () => {
      service.subscribe(['AAPL', 'GOOGL']);

      // Should not call send since not connected
      expect(mockWebSocket.send).not.toHaveBeenCalled();

      // But should track the subscriptions
      const subscriptions = service.getActiveSubscriptions();
      expect(subscriptions.size).toBe(2);
    });

    it('should resubscribe to all symbols after reconnection', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.subscribe(['AAPL', 'GOOGL', 'MSFT']);

      // Clear the mock to track new calls
      mockWebSocket.send.mockClear();

      // Simulate disconnect and reconnect
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }

      vi.advanceTimersByTime(1000);

      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Should resubscribe to all symbols
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('subscribe')
      );

      const sentData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentData.symbols).toContain('AAPL');
      expect(sentData.symbols).toContain('GOOGL');
      expect(sentData.symbols).toContain('MSFT');
    });

    it('should remove symbols on unsubscribe', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.subscribe(['AAPL', 'GOOGL', 'MSFT']);
      service.unsubscribe('GOOGL');

      const subscriptions = service.getActiveSubscriptions();
      expect(subscriptions.size).toBe(2);
      expect(subscriptions.has('AAPL')).toBe(true);
      expect(subscriptions.has('MSFT')).toBe(true);
      expect(subscriptions.has('GOOGL')).toBe(false);
    });

    it('should send unsubscribe message when connected', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.subscribe(['AAPL', 'GOOGL']);
      mockWebSocket.send.mockClear();

      service.unsubscribe('AAPL');

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'unsubscribe',
          symbols: ['AAPL']
        })
      );
    });

    it('should persist subscriptions across multiple reconnections', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      service.subscribe(['AAPL', 'GOOGL']);

      // First reconnection
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }
      vi.advanceTimersByTime(1000);
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Second reconnection
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));
      }
      vi.advanceTimersByTime(2000);
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Subscriptions should still be intact
      const subscriptions = service.getActiveSubscriptions();
      expect(subscriptions.size).toBe(2);
      expect(subscriptions.has('AAPL')).toBe(true);
      expect(subscriptions.has('GOOGL')).toBe(true);
    });
  });

  describe('Message Batching', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should batch messages within 100ms window', () => {
      const messageHandler = vi.fn();
      service.onMessage(messageHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Send multiple messages quickly
      const message1 = { type: 'price_update', symbol: 'AAPL', price: 150 };
      const message2 = { type: 'price_update', symbol: 'GOOGL', price: 2800 };
      const message3 = { type: 'price_update', symbol: 'MSFT', price: 300 };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(message1) 
        }));
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(message2) 
        }));
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(message3) 
        }));
      }

      // Messages should be queued, not processed yet
      expect(messageHandler).not.toHaveBeenCalled();

      // Advance time to trigger batch processing
      vi.advanceTimersByTime(100);

      // All messages should be processed
      expect(messageHandler).toHaveBeenCalledTimes(3);
      expect(messageHandler).toHaveBeenCalledWith(message1);
      expect(messageHandler).toHaveBeenCalledWith(message2);
      expect(messageHandler).toHaveBeenCalledWith(message3);
    });

    it('should process messages in order', () => {
      const receivedMessages: any[] = [];
      const messageHandler = vi.fn((data) => receivedMessages.push(data));
      service.onMessage(messageHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      const messages = [
        { type: 'price_update', symbol: 'AAPL', price: 150, seq: 1 },
        { type: 'price_update', symbol: 'AAPL', price: 151, seq: 2 },
        { type: 'price_update', symbol: 'AAPL', price: 152, seq: 3 },
      ];

      if (mockWebSocket.onmessage) {
        messages.forEach(msg => {
          mockWebSocket.onmessage(new MessageEvent('message', { 
            data: JSON.stringify(msg) 
          }));
        });
      }

      vi.advanceTimersByTime(100);

      expect(receivedMessages).toEqual(messages);
    });

    it('should limit queue size to prevent memory issues', () => {
      const messageHandler = vi.fn();
      service.onMessage(messageHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Send more messages than queue size (default 100)
      if (mockWebSocket.onmessage) {
        for (let i = 0; i < 150; i++) {
          mockWebSocket.onmessage(new MessageEvent('message', { 
            data: JSON.stringify({ type: 'price_update', seq: i }) 
          }));
        }
      }

      vi.advanceTimersByTime(100);

      // Should only process the last 100 messages
      expect(messageHandler).toHaveBeenCalledTimes(100);
    });

    it('should handle multiple batches correctly', () => {
      const messageHandler = vi.fn();
      service.onMessage(messageHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // First batch
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ batch: 1, msg: 1 }) 
        }));
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ batch: 1, msg: 2 }) 
        }));
      }

      vi.advanceTimersByTime(100);
      expect(messageHandler).toHaveBeenCalledTimes(2);

      messageHandler.mockClear();

      // Second batch
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ batch: 2, msg: 1 }) 
        }));
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ batch: 2, msg: 2 }) 
        }));
      }

      vi.advanceTimersByTime(100);
      expect(messageHandler).toHaveBeenCalledTimes(2);
    });

    it('should track message count in metrics', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      if (mockWebSocket.onmessage) {
        for (let i = 0; i < 5; i++) {
          mockWebSocket.onmessage(new MessageEvent('message', { 
            data: JSON.stringify({ seq: i }) 
          }));
        }
      }

      vi.advanceTimersByTime(100);

      const metrics = service.getMetrics();
      expect(metrics.messageCount).toBe(5);
    });

    it('should calculate latency from message timestamps', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      const now = Date.now();
      const message = {
        type: 'price_update',
        symbol: 'AAPL',
        timestamp: new Date(now - 200).toISOString() // 200ms ago
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(message) 
        }));
      }

      vi.advanceTimersByTime(100);

      const latency = service.getLatency();
      expect(latency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should track error count', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      // Simulate error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      const metrics = service.getMetrics();
      expect(metrics.errorCount).toBeGreaterThan(0);
    });

    it('should call error handlers on error', () => {
      const errorHandler = vi.fn();
      service.onError(errorHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle malformed JSON messages gracefully', () => {
      const messageHandler = vi.fn();
      service.onMessage(messageHandler);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: 'invalid json{' 
        }));
      }

      // Should not crash, and should track error
      const metrics = service.getMetrics();
      expect(metrics.errorCount).toBeGreaterThan(0);
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track connection time', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      const metrics = service.getMetrics();
      expect(metrics.connectedAt).toBeInstanceOf(Date);
    });

    it('should track last message time', () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ test: true }) 
        }));
      }

      const lastMessageTime = service.getLastMessageTime();
      expect(lastMessageTime).toBeInstanceOf(Date);
    });

    it('should track active subscriptions count', () => {
      service.subscribe(['AAPL', 'GOOGL', 'MSFT']);

      const metrics = service.getMetrics();
      expect(metrics.activeSubscriptions).toBe(3);
    });
  });

  describe('Handler Management', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow adding and removing message handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsubscribe1 = service.onMessage(handler1);
      const unsubscribe2 = service.onMessage(handler2);

      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ test: true }) 
        }));
      }

      vi.advanceTimersByTime(100);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();

      handler1.mockClear();
      handler2.mockClear();

      // Remove handler1
      unsubscribe1();

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { 
          data: JSON.stringify({ test: true }) 
        }));
      }

      vi.advanceTimersByTime(100);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should allow adding and removing connection handlers', () => {
      const handler = vi.fn();
      const unsubscribe = service.onConnectionChange(handler);

      service.connect();
      expect(handler).toHaveBeenCalledWith('CONNECTING');

      handler.mockClear();
      unsubscribe();

      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
