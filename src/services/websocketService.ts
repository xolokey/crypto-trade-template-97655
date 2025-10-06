// WebSocket Service for Real-Time Market Data
// Provides low-latency updates for active trading

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Error) => void;

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private subscribedSymbols: Set<string> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      console.log(`Connecting to WebSocket: ${this.config.url}`);
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('WebSocket disconnected');
  }

  /**
   * Subscribe to stock updates
   */
  subscribe(symbols: string | string[]): void {
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    
    symbolList.forEach(symbol => {
      this.subscribedSymbols.add(symbol);
    });

    if (this.isConnected()) {
      this.send({
        action: 'subscribe',
        symbols: symbolList
      });
    }
  }

  /**
   * Unsubscribe from stock updates
   */
  unsubscribe(symbols: string | string[]): void {
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    
    symbolList.forEach(symbol => {
      this.subscribedSymbols.delete(symbol);
    });

    if (this.isConnected()) {
      this.send({
        action: 'unsubscribe',
        symbols: symbolList
      });
    }
  }

  /**
   * Send message to server
   */
  send(data: any): void {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Add error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): string {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Handle connection open
   */
  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();

    // Resubscribe to symbols
    if (this.subscribedSymbols.size > 0) {
      this.subscribe(Array.from(this.subscribedSymbols));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Notify all handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle error
   */
  private handleError(event: Event): void {
    const error = new Error('WebSocket error occurred');
    console.error('WebSocket error:', event);
    
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    });
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    this.clearTimers();

    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * this.reconnectAttempts;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ action: 'ping' });
      }
    }, this.config.heartbeatInterval!);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// Create singleton instance (will be initialized when needed)
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(url?: string): WebSocketService {
  if (!wsInstance && url) {
    wsInstance = new WebSocketService({ url });
  }
  
  if (!wsInstance) {
    throw new Error('WebSocket service not initialized. Provide URL on first call.');
  }
  
  return wsInstance;
}

export function createWebSocketService(config: WebSocketConfig): WebSocketService {
  return new WebSocketService(config);
}
