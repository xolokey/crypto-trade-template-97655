# Design Document: WebSocket Real-Time Data System

## Overview

This design document outlines the architecture for replacing the current 30-second polling mechanism with a true real-time WebSocket-based data streaming system. The solution will provide instant price updates, reduce server load, improve user experience, and maintain backward compatibility with automatic fallback to polling when WebSocket connections fail.

The system consists of three main layers:

1. **Frontend Layer**: React hooks and services for WebSocket connection management
2. **WebSocket Server Layer**: Node.js WebSocket server for message routing and broadcasting
3. **Backend Integration Layer**: .NET backend integration for data sourcing and distribution

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ useRealTimeStock │  │ WebSocketService │  │ UI Components │ │
│  │      Hook        │──│   (Singleton)    │──│  (Live Data)  │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │ WebSocket (ws/wss)
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    WebSocket Server (Node.js)                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Connection      │  │  Subscription    │  │   Broadcast   │ │
│  │  Manager         │──│  Manager         │──│   Engine      │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP/REST + Redis PubSub
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    .NET Backend (ASP.NET Core)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ MarketDataService│  │  Cache Service   │  │  External API │ │
│  │                  │──│   (Redis)        │──│   Services    │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│              External APIs (Alpha Vantage, Twelve Data)          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Real-Time Update Flow

1. External API provides new market data to .NET Backend
2. .NET Backend processes and caches data in Redis
3. .NET Backend publishes update event to Redis PubSub channel
4. WebSocket Server subscribes to Redis PubSub and receives update
5. WebSocket Server broadcasts update to all subscribed frontend clients
6. Frontend receives update and updates UI immediately

#### Subscription Flow

1. User views a stock or adds to watchlist
2. Frontend sends subscription message to WebSocket Server
3. WebSocket Server tracks subscription and notifies .NET Backend
4. .NET Backend starts fetching data for that symbol (if not already)
5. Updates flow through the Real-Time Update Flow

## Components and Interfaces

### 1. Frontend Components

#### WebSocketService (Enhanced)

**Purpose**: Manage WebSocket connection lifecycle, subscriptions, and message handling.

**Key Methods**:

```typescript
class WebSocketService {
  // Connection management
  connect(): void;
  disconnect(): void;
  reconnect(): void;
  isConnected(): boolean;
  getConnectionState(): ConnectionState;

  // Subscription management
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  getActiveSubscriptions(): Set<string>;

  // Message handling
  onMessage(handler: MessageHandler): UnsubscribeFn;
  onError(handler: ErrorHandler): UnsubscribeFn;
  onConnectionChange(handler: ConnectionHandler): UnsubscribeFn;

  // Health and monitoring
  getLatency(): number;
  getLastMessageTime(): Date;
  getMetrics(): ConnectionMetrics;
}
```

**Configuration**:

```typescript
interface WebSocketConfig {
  url: string;
  reconnectInterval: number; // Base interval for exponential backoff
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueSize: number; // Max buffered messages
  enableCompression: boolean;
  enableAutoReconnect: boolean;
}
```

**State Management**:

- Connection states: CONNECTING, OPEN, CLOSING, CLOSED, RECONNECTING
- Subscription tracking: Map<symbol, SubscriptionMetadata>
- Message queue for offline buffering
- Reconnection backoff state

#### useRealTimeStock Hook (Enhanced)

**Purpose**: React hook for consuming real-time stock data with automatic subscription management.

**Interface**:

```typescript
function useRealTimeStock(
  options: UseRealTimeStockOptions
): UseRealTimeStockReturn;

interface UseRealTimeStockOptions {
  symbol: string;
  enableWebSocket?: boolean; // Default: true
  fallbackToPolling?: boolean; // Default: true
  pollingInterval?: number; // Default: 30000ms
  onUpdate?: (data: StockQuote) => void;
  onError?: (error: Error) => void;
}

interface UseRealTimeStockReturn {
  data: StockQuote | null;
  loading: boolean;
  error: Error | null;
  isRealTime: boolean; // true if using WebSocket
  isConnected: boolean;
  connectionState: ConnectionState;
  lastUpdate: Date | null;
  latency: number; // WebSocket message latency
  refetch: () => Promise<void>;
}
```

**Behavior**:

- Automatically subscribes on mount, unsubscribes on unmount
- Falls back to polling if WebSocket unavailable
- Handles reconnection transparently
- Provides connection status for UI feedback

#### ConnectionStatusIndicator Component

**Purpose**: Visual indicator of connection status and data freshness.

**Props**:

```typescript
interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isRealTime: boolean;
  lastUpdate: Date | null;
  latency?: number;
  showDetails?: boolean; // Show tooltip with details
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}
```

**Visual States**:

- 🟢 Green "Live" - WebSocket connected, receiving real-time updates
- 🟡 Yellow "Delayed" - Polling mode, 30s intervals
- 🔴 Red "Offline" - No connection, stale data
- 🔵 Blue "Reconnecting..." - Attempting to reconnect

### 2. WebSocket Server Components

#### Connection Manager

**Purpose**: Handle WebSocket connections, authentication, and lifecycle.

**Responsibilities**:

- Accept new WebSocket connections
- Validate client connections (optional authentication)
- Track active connections: Map<clientId, WebSocket>
- Handle connection close and cleanup
- Implement heartbeat/ping-pong mechanism
- Detect and remove stale connections

**Key Functions**:

```javascript
class ConnectionManager {
  handleConnection(ws, req)
  closeConnection(clientId, reason)
  broadcastToClient(clientId, message)
  broadcastToAll(message)
  getActiveConnections()
  cleanupStaleConnections()
}
```

#### Subscription Manager

**Purpose**: Track which clients are subscribed to which symbols.

**Data Structure**:

```javascript
// Map<symbol, Set<clientId>>
subscriptions: Map<string, Set<string>>

// Map<clientId, Set<symbol>>
clientSubscriptions: Map<string, Set<string>>
```

**Key Functions**:

```javascript
class SubscriptionManager {
  subscribe(clientId, symbols)
  unsubscribe(clientId, symbols)
  unsubscribeAll(clientId)
  getSubscribers(symbol)
  getClientSubscriptions(clientId)
  getActiveSymbols()
  notifyBackend(action, symbols) // Notify .NET backend of subscription changes
}
```

#### Broadcast Engine

**Purpose**: Efficiently broadcast updates to subscribed clients.

**Features**:

- Message batching for multiple updates
- Selective broadcasting (only to subscribed clients)
- Message deduplication
- Backpressure handling (slow client detection)
- Message compression (optional)

**Key Functions**:

```javascript
class BroadcastEngine {
  broadcast(symbol, data)
  batchBroadcast(updates) // Array of {symbol, data}
  broadcastToClients(clientIds, message)
  handleSlowClient(clientId)
  getQueueSize(clientId)
}
```

#### Redis Integration

**Purpose**: Receive real-time updates from .NET backend via Redis PubSub.

**Channels**:

- `market-data:updates` - Real-time price updates
- `market-data:subscriptions` - Subscription change notifications
- `market-data:control` - Control messages (pause, resume, etc.)

**Message Format**:

```javascript
{
  type: 'price_update',
  symbol: 'RELIANCE',
  data: {
    price: 2450.50,
    change: 12.30,
    changePercent: 0.50,
    volume: 1234567,
    timestamp: '2024-01-10T10:30:00Z'
  },
  source: 'AlphaVantage'
}
```

### 3. Backend Integration Components

#### WebSocket Notification Service (.NET)

**Purpose**: Push real-time updates to WebSocket server via Redis PubSub.

**Interface**:

```csharp
public interface IWebSocketNotificationService
{
    Task PublishPriceUpdateAsync(string symbol, StockQuote quote);
    Task PublishBatchUpdatesAsync(Dictionary<string, StockQuote> updates);
    Task NotifySubscriptionChangeAsync(string action, List<string> symbols);
    Task<bool> IsWebSocketServerHealthyAsync();
}
```

**Implementation**:

```csharp
public class WebSocketNotificationService : IWebSocketNotificationService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<WebSocketNotificationService> _logger;

    public async Task PublishPriceUpdateAsync(string symbol, StockQuote quote)
    {
        var channel = "market-data:updates";
        var message = JsonSerializer.Serialize(new
        {
            type = "price_update",
            symbol = symbol,
            data = quote,
            timestamp = DateTime.UtcNow
        });

        await _redis.GetSubscriber().PublishAsync(channel, message);
    }
}
```

#### Enhanced MarketDataService

**Purpose**: Integrate WebSocket notifications into existing data fetching logic.

**Changes**:

1. After fetching new data, publish to Redis PubSub
2. Track active subscriptions from WebSocket server
3. Prioritize fetching for subscribed symbols
4. Implement intelligent polling (fetch only subscribed symbols)

**Pseudo-code**:

```csharp
public async Task<StockQuote?> GetStockQuoteAsync(string symbol)
{
    // Check cache
    var cached = await _cacheService.GetAsync<StockQuote>($"quote:{symbol}");
    if (cached != null && !IsStale(cached))
        return cached;

    // Fetch from external API
    var quote = await FetchFromExternalAPIs(symbol);

    if (quote != null)
    {
        // Cache the data
        await _cacheService.SetAsync($"quote:{symbol}", quote, TimeSpan.FromSeconds(10));

        // Publish to WebSocket server if symbol is subscribed
        if (await IsSymbolSubscribed(symbol))
        {
            await _wsNotificationService.PublishPriceUpdateAsync(symbol, quote);
        }
    }

    return quote;
}
```

#### Background Service for Active Symbols

**Purpose**: Continuously fetch data for actively subscribed symbols.

**Implementation**:

```csharp
public class ActiveSymbolsBackgroundService : BackgroundService
{
    private readonly IMarketDataService _marketDataService;
    private readonly IWebSocketNotificationService _wsNotificationService;
    private readonly ILogger<ActiveSymbolsBackgroundService> _logger;
    private HashSet<string> _activeSymbols = new();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Get list of active subscriptions from Redis
                _activeSymbols = await GetActiveSubscriptionsAsync();

                if (_activeSymbols.Count > 0)
                {
                    // Fetch data for all active symbols
                    var tasks = _activeSymbols.Select(symbol =>
                        FetchAndPublishAsync(symbol));
                    await Task.WhenAll(tasks);
                }

                // Wait before next cycle (e.g., 2 seconds)
                await Task.Delay(2000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in active symbols background service");
            }
        }
    }

    private async Task FetchAndPublishAsync(string symbol)
    {
        var quote = await _marketDataService.GetStockQuoteAsync(symbol);
        if (quote != null)
        {
            await _wsNotificationService.PublishPriceUpdateAsync(symbol, quote);
        }
    }
}
```

## Data Models

### WebSocket Message Types

#### Client → Server Messages

**Subscribe Message**:

```json
{
  "action": "subscribe",
  "symbols": ["RELIANCE", "TCS", "INFY"],
  "clientId": "uuid-client-id"
}
```

**Unsubscribe Message**:

```json
{
  "action": "unsubscribe",
  "symbols": ["RELIANCE"],
  "clientId": "uuid-client-id"
}
```

**Ping Message**:

```json
{
  "action": "ping",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

#### Server → Client Messages

**Connection Established**:

```json
{
  "type": "connected",
  "message": "Connected to Stock Tracker WebSocket",
  "clientId": "uuid-client-id",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

**Price Update**:

```json
{
  "type": "price_update",
  "symbol": "RELIANCE",
  "data": {
    "symbol": "RELIANCE",
    "price": 2450.5,
    "change": 12.3,
    "changePercent": 0.5,
    "volume": 1234567,
    "high": 2460.0,
    "low": 2440.0,
    "open": 2445.0,
    "previousClose": 2438.2,
    "timestamp": "2024-01-10T10:30:00Z",
    "source": "AlphaVantage"
  },
  "timestamp": "2024-01-10T10:30:00.123Z"
}
```

**Batch Update**:

```json
{
  "type": "batch_update",
  "updates": [
    {
      "symbol": "RELIANCE",
      "data": {
        /* StockQuote */
      }
    },
    {
      "symbol": "TCS",
      "data": {
        /* StockQuote */
      }
    }
  ],
  "timestamp": "2024-01-10T10:30:00Z"
}
```

**Error Message**:

```json
{
  "type": "error",
  "code": "SUBSCRIPTION_FAILED",
  "message": "Failed to subscribe to symbol: INVALID",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

**Pong Message**:

```json
{
  "type": "pong",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

### Connection Metrics

```typescript
interface ConnectionMetrics {
  connectionState:
    | "CONNECTING"
    | "OPEN"
    | "CLOSING"
    | "CLOSED"
    | "RECONNECTING";
  connectedAt: Date | null;
  lastMessageAt: Date | null;
  messageCount: number;
  errorCount: number;
  reconnectAttempts: number;
  averageLatency: number;
  activeSubscriptions: number;
}
```

## Error Handling

### Error Categories

1. **Connection Errors**

   - Network unavailable
   - WebSocket server unreachable
   - Connection timeout
   - Authentication failure

2. **Message Errors**

   - Invalid message format
   - Unsupported action
   - Subscription limit exceeded
   - Rate limit exceeded

3. **Data Errors**
   - Invalid symbol
   - Data parsing failure
   - Stale data detected
   - Source API failure

### Error Handling Strategy

#### Frontend Error Handling

```typescript
class WebSocketService {
  private handleError(error: Error, context: string) {
    // Log error
    console.error(`WebSocket error in ${context}:`, error);

    // Categorize error
    const category = this.categorizeError(error);

    // Take action based on category
    switch (category) {
      case "CONNECTION":
        this.scheduleReconnect();
        break;
      case "MESSAGE":
        this.notifyErrorHandlers(error);
        break;
      case "DATA":
        // Request fresh data
        this.requestDataRefresh();
        break;
    }

    // Update metrics
    this.metrics.errorCount++;

    // Notify UI
    this.emit("error", { error, category, context });
  }
}
```

#### Backend Error Handling

```csharp
public async Task<StockQuote?> GetStockQuoteAsync(string symbol)
{
    try
    {
        // Attempt to fetch data
        var quote = await FetchFromExternalAPIs(symbol);
        return quote;
    }
    catch (HttpRequestException ex)
    {
        _logger.LogWarning(ex, "HTTP error fetching {Symbol}, using cached data", symbol);
        return await GetCachedQuoteAsync(symbol);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unexpected error fetching {Symbol}", symbol);

        // Publish error notification to WebSocket
        await _wsNotificationService.PublishErrorAsync(symbol, ex.Message);

        return null;
    }
}
```

### Reconnection Strategy

**Exponential Backoff**:

```
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5: 16 seconds
Attempt 6+: 30 seconds (max)
```

**Reconnection Logic**:

1. Detect connection loss
2. Clear existing connection
3. Wait for backoff period
4. Attempt reconnection
5. If successful, resubscribe to all symbols
6. If failed, increment attempt counter and retry
7. After 10 failed attempts, fall back to polling mode

## Testing Strategy

### Unit Tests

#### Frontend Tests

- WebSocketService connection lifecycle
- Message parsing and handling
- Subscription management
- Error handling and recovery
- Reconnection logic

#### Backend Tests

- WebSocketNotificationService message publishing
- MarketDataService integration
- Background service symbol fetching
- Redis PubSub integration

### Integration Tests

1. **End-to-End WebSocket Flow**

   - Frontend connects to WebSocket server
   - Subscribe to symbols
   - Receive real-time updates
   - Unsubscribe and verify no more updates

2. **Fallback Mechanism**

   - Simulate WebSocket server down
   - Verify automatic fallback to polling
   - Restore WebSocket server
   - Verify automatic reconnection

3. **Multi-Client Scenario**

   - Multiple clients subscribe to same symbol
   - Verify all clients receive updates
   - One client unsubscribes
   - Verify other clients still receive updates

4. **Backend Integration**
   - .NET backend fetches new data
   - Publishes to Redis PubSub
   - WebSocket server receives and broadcasts
   - Frontend receives update

### Performance Tests

1. **Latency Test**

   - Measure time from backend publish to frontend receive
   - Target: < 500ms end-to-end

2. **Throughput Test**

   - 100 concurrent clients
   - 50 symbols with 1-second update frequency
   - Measure message delivery success rate
   - Target: > 99% delivery rate

3. **Reconnection Test**

   - Simulate network interruptions
   - Measure reconnection time
   - Verify no data loss during reconnection

4. **Memory Leak Test**
   - Run for 24 hours with active connections
   - Monitor memory usage
   - Verify no memory leaks

### Manual Testing Checklist

- [ ] Connect to WebSocket and verify "Live" indicator
- [ ] Subscribe to stock and verify real-time updates
- [ ] Disconnect network and verify fallback to polling
- [ ] Reconnect network and verify WebSocket reconnection
- [ ] Open multiple tabs and verify independent connections
- [ ] Add stock to watchlist and verify automatic subscription
- [ ] Remove stock from watchlist and verify unsubscription
- [ ] Test on slow network (throttle to 3G)
- [ ] Test with browser dev tools WebSocket inspector
- [ ] Verify error messages are user-friendly

## Deployment Considerations

### Environment Configuration

**Development**:

```env
VITE_WS_URL=ws://localhost:8081
VITE_ENABLE_WEBSOCKET=true
VITE_FALLBACK_TO_POLLING=true
VITE_WS_RECONNECT_INTERVAL=5000
```

**Production**:

```env
VITE_WS_URL=wss://ws.stocktracker.com
VITE_ENABLE_WEBSOCKET=true
VITE_FALLBACK_TO_POLLING=true
VITE_WS_RECONNECT_INTERVAL=5000
```

### Infrastructure Requirements

1. **WebSocket Server**

   - Node.js 18+ runtime
   - Redis connection for PubSub
   - Load balancer with WebSocket support (sticky sessions)
   - Health check endpoint
   - Monitoring and logging

2. **.NET Backend**

   - Redis connection for PubSub
   - Background service enabled
   - Increased API rate limits for active symbols

3. **Redis**
   - PubSub channels configured
   - Sufficient memory for message buffering
   - Persistence disabled (PubSub is ephemeral)

### Scaling Considerations

**Horizontal Scaling**:

- Multiple WebSocket server instances behind load balancer
- Use Redis PubSub for cross-instance communication
- Sticky sessions to maintain client connections

**Vertical Scaling**:

- Increase WebSocket server memory for more connections
- Optimize message serialization/deserialization
- Use binary protocols (MessagePack) for large-scale deployments

### Monitoring and Observability

**Metrics to Track**:

- Active WebSocket connections
- Messages per second
- Average message latency
- Error rate
- Reconnection rate
- Subscription count per symbol
- Memory usage
- CPU usage

**Logging**:

- Connection events (connect, disconnect, reconnect)
- Subscription events (subscribe, unsubscribe)
- Error events with stack traces
- Performance warnings (slow clients, high latency)

**Alerting**:

- WebSocket server down
- High error rate (> 5%)
- High latency (> 1 second)
- Memory usage > 80%
- Connection count drops suddenly

## Security Considerations

1. **Authentication** (Future Enhancement)

   - JWT token validation on WebSocket connection
   - Token refresh mechanism
   - Rate limiting per user

2. **Authorization**

   - Validate user can access requested symbols
   - Enforce subscription limits per user tier

3. **Input Validation**

   - Validate all incoming messages
   - Sanitize symbol names
   - Limit message size

4. **DDoS Protection**

   - Rate limiting on connections
   - Rate limiting on subscriptions
   - Connection timeout for idle clients

5. **TLS/SSL**
   - Use WSS (WebSocket Secure) in production
   - Valid SSL certificates
   - Enforce HTTPS for initial page load

## Migration Strategy

### Phase 1: Parallel Running (Week 1-2)

- Deploy WebSocket infrastructure
- Enable WebSocket for 10% of users (feature flag)
- Monitor metrics and errors
- Keep polling as primary mechanism

### Phase 2: Gradual Rollout (Week 3-4)

- Increase to 50% of users
- Optimize based on feedback
- Fix any issues discovered

### Phase 3: Full Rollout (Week 5)

- Enable for 100% of users
- WebSocket as primary, polling as fallback
- Monitor for any regressions

### Phase 4: Optimization (Week 6+)

- Remove polling code paths (keep fallback)
- Optimize message formats
- Implement advanced features (compression, batching)

## Future Enhancements

1. **Binary Protocol**: Use MessagePack or Protocol Buffers for smaller message sizes
2. **Message Compression**: Enable per-message compression for large payloads
3. **Multiplexing**: Single WebSocket connection for multiple data streams
4. **Offline Support**: Queue messages when offline, sync when reconnected
5. **Advanced Subscriptions**: Subscribe to price ranges, alerts, custom filters
6. **GraphQL Subscriptions**: Integrate with GraphQL for flexible data queries
7. **WebRTC Data Channels**: For ultra-low latency in specific scenarios
