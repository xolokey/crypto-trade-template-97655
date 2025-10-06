// Enhanced WebSocket Service for Real-Time Market Data
// Provides low-latency updates with exponential backoff reconnection

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Error) => void;
type ConnectionHandler = (state: ConnectionState) => void;

export type ConnectionState = 
  | 'CONNECTING' 
  | 'OPEN' 
  | 'CLOSING' 
  | 'CLOSED' 
  | 'RECONNECTING';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number; // Base interval for exponential backoff
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  enableAutoReconnect?: boolean;
}

export interface ConnectionMetrics {
  connectionState: ConnectionState;
  connectedAt: Date | null;
  lastMessageAt: Date | null;
  messageCount: number;
  errorCount: number;
  reconnectAttempts: number;
  averageLatency: number;
  activeSubscriptions: number;
}

interface QueuedMessage {
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private subscribedSymbols: Set<string> = new Set();
  
  // State tracking
  private connectionState: ConnectionState = 'CLOSED';
  private connectedAt: Date | null = null;
  private lastMessageAt: Date | null = null;
  private messageCount = 0;
  private errorCount = 0;
  private latencySum = 0;
  private latencyCount = 0;
  
  // Message batching
  private messageQueue: QueuedMessage[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_INTERVAL = 100; // ms

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 1000, // Start with 1 second
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageQueueSize: 100,
      enableAutoReconnect: true,
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
    this.setConnectionState('CONNECTING');

    try {
      console.log(`Connecting to WebSocket: ${this.config.url}`);
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.errorCount++;
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
      this.setConnectionState('CLOSING');
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('CLOSED');
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
   * Get active subscriptions
   */
  getActiveSubscriptions(): Set<string> {
    return new Set(this.subscribedSymbols);
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
      this.errorCount++;
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Add error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Add connection state change handler
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    
    return () => {
      this.connectionHandlers.delete(handler);
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
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics {
    return {
      connectionState: this.connectionState,
      connectedAt: this.connectedAt,
      lastMessageAt: this.lastMessageAt,
      messageCount: this.messageCount,
      errorCount: this.errorCount,
      reconnectAttempts: this.reconnectAttempts,
      averageLatency: this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0,
      activeSubscriptions: this.subscribedSymbols.size
    };
  }

  /**
   * Get average latency
   */
  getLatency(): number {
    return this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;
  }

  /**
   * Get last message time
   */
  getLastMessageTime(): Date | null {
    return this.lastMessageAt;
  }

  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log(`WebSocket state changed: ${state}`);
      
      this.connectionHandlers.forEach(handler => {
        try {
          handler(state);
        } catch (error) {
          console.error('Error in connection handler:', error);
        }
      });
    }
  }

  /**
   * Handle connection open
   */
  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.setConnectionState('OPEN');
    this.connectedAt = new Date();
    this.reconnectAttempts = 0;
    this.startHeartbeat();

    // Resubscribe to symbols
    if (this.subscribedSymbols.size > 0) {
      console.log(`Resubscribing to ${this.subscribedSymbols.size} symbols`);
      this.subscribe(Array.from(this.subscribedSymbols));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.lastMessageAt = new Date();
      this.messageCount++;
      
      // Calculate latency if timestamp is provided
      if (data.timestamp) {
        const latency = Date.now() - new Date(data.timestamp).getTime();
        this.latencySum += latency;
        this.latencyCount++;
        
        // Log warning if latency is high
        if (latency > 1000) {
          console.warn(`High latency detected: ${latency}ms`);
        }
      }
      
      // Add to message queue for batching
      this.queueMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.errorCount++;
    }
  }

  /**
   * Queue message for batch processing
   */
  private queueMessage(data: any): void {
    this.messageQueue.push({
      data,
      timestamp: Date.now()
    });

    // Limit queue size
    if (this.messageQueue.length > this.config.messageQueueSize!) {
      this.messageQueue.shift();
    }

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatchedMessages();
      }, this.BATCH_INTERVAL);
    }
  }

  /**
   * Process batched messages
   */
  private processBatchedMessages(): void {
    if (this.messageQueue.length === 0) {
      this.batchTimer = null;
      return;
    }

    const messages = [...this.messageQueue];
    this.messageQueue = [];
    this.batchTimer = null;

    // Notify all handlers
    messages.forEach(({ data }) => {
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
          this.errorCount++;
        }
      });
    });
  }

  /**
   * Handle error
   */
  private handleError(event: Event): void {
    const error = new Error('WebSocket error occurred');
    console.error('WebSocket error:', event);
    this.errorCount++;
    
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
    this.setConnectionState('CLOSED');
    this.clearTimers();

    if (!this.isIntentionallyClosed && this.config.enableAutoReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      this.setConnectionState('CLOSED');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('RECONNECTING');

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const baseDelay = this.config.reconnectInterval!;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const delay = Math.min(exponentialDelay, 30000); // Cap at 30 seconds

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

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

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
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
