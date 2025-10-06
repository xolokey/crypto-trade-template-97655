// WebSocket Configuration
// Centralized configuration for WebSocket connections

export interface WebSocketConfiguration {
  url: string;
  enabled: boolean;
  fallbackToPolling: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueSize: number;
}

// Get WebSocket URL based on environment
function getWebSocketUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Default URLs based on environment
  if (import.meta.env.PROD) {
    // Production: Use secure WebSocket
    return 'wss://your-websocket-server.com';
  }
  
  // Development: Use local WebSocket server
  return 'ws://localhost:8081';
}

// Get configuration from environment variables with defaults
export function getWebSocketConfig(): WebSocketConfiguration {
  return {
    url: getWebSocketUrl(),
    enabled: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false', // Default: true
    fallbackToPolling: import.meta.env.VITE_FALLBACK_TO_POLLING !== 'false', // Default: true
    reconnectInterval: parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL || '1000'),
    maxReconnectAttempts: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '10'),
    heartbeatInterval: parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL || '30000'),
    messageQueueSize: parseInt(import.meta.env.VITE_WS_MESSAGE_QUEUE_SIZE || '100')
  };
}

// Validate configuration
export function validateWebSocketConfig(config: WebSocketConfiguration): boolean {
  if (!config.url) {
    console.error('WebSocket URL is required');
    return false;
  }
  
  if (config.reconnectInterval < 100) {
    console.warn('Reconnect interval is too low, using minimum of 100ms');
    config.reconnectInterval = 100;
  }
  
  if (config.maxReconnectAttempts < 1) {
    console.warn('Max reconnect attempts must be at least 1');
    config.maxReconnectAttempts = 1;
  }
  
  return true;
}

// Export singleton configuration
export const websocketConfig = getWebSocketConfig();

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('WebSocket Configuration:', {
    ...websocketConfig,
    url: websocketConfig.url.replace(/\/\/.+@/, '//***@') // Hide credentials if any
  });
}
