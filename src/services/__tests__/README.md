# WebSocketService Unit Tests

This directory contains comprehensive unit tests for the WebSocketService, which manages real-time WebSocket connections for stock market data.

## Test Coverage

### 1. Connection Lifecycle Tests
- ✅ Initializes with CLOSED state
- ✅ Transitions to CONNECTING state when connect() is called
- ✅ Transitions to OPEN state when connection opens
- ✅ Transitions to CLOSING then CLOSED when disconnect() is called
- ✅ Prevents duplicate connections when already connected
- ✅ Handles connection close events and attempts reconnection

### 2. Reconnection Logic with Exponential Backoff Tests
- ✅ Attempts to reconnect after unexpected connection loss
- ✅ Uses exponential backoff for reconnection attempts (1s, 2s, 4s, 8s, 16s, 30s max)
- ✅ Caps reconnection delay at 30 seconds
- ✅ Stops reconnecting after max attempts (default: 10)
- ✅ Resets reconnection attempts counter on successful connection
- ✅ Does not reconnect if disconnect was intentional

### 3. Subscription Persistence Tests
- ✅ Tracks subscribed symbols in memory
- ✅ Sends subscribe messages when connected
- ✅ Does not send subscribe messages when disconnected (but tracks them)
- ✅ Automatically resubscribes to all symbols after reconnection
- ✅ Removes symbols on unsubscribe
- ✅ Sends unsubscribe messages when connected
- ✅ Persists subscriptions across multiple reconnections

### 4. Message Batching Tests
- ✅ Batches messages within 100ms window to avoid UI thrashing
- ✅ Processes messages in order
- ✅ Limits queue size to prevent memory issues (default: 100 messages)
- ✅ Handles multiple batches correctly
- ✅ Tracks message count in metrics
- ✅ Calculates latency from message timestamps

### 5. Error Handling Tests
- ✅ Tracks error count in metrics
- ✅ Calls registered error handlers on error
- ✅ Handles malformed JSON messages gracefully without crashing

### 6. Metrics and Monitoring Tests
- ✅ Tracks connection time (connectedAt)
- ✅ Tracks last message time (lastMessageAt)
- ✅ Tracks active subscriptions count

### 7. Handler Management Tests
- ✅ Allows adding and removing message handlers
- ✅ Allows adding and removing connection state change handlers

## Running Tests

```bash
# Run all tests
npm test

# Run WebSocketService tests only
npm test -- src/services/__tests__/websocketService.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Requirements Covered

This test suite fulfills the requirements specified in task 6.5:

- **Requirement 1.4**: Connection lifecycle and reconnection logic
- **Requirement 1.5**: Subscription persistence across reconnections
- **Requirement 2.5**: Message batching to avoid UI thrashing

## Test Architecture

The tests use:
- **Vitest** as the test runner
- **vi.fn()** for mocking functions
- **vi.useFakeTimers()** for testing time-dependent behavior (reconnection backoff, message batching)
- **Mock WebSocket** to simulate WebSocket behavior without actual network connections

## Key Testing Patterns

### Mocking WebSocket
```typescript
mockWebSocket = {
  readyState: WebSocket.CONNECTING,
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
};

global.WebSocket = vi.fn(() => mockWebSocket) as any;
```

### Simulating Connection Events
```typescript
// Simulate connection open
mockWebSocket.readyState = WebSocket.OPEN;
if (mockWebSocket.onopen) {
  mockWebSocket.onopen(new Event('open'));
}

// Simulate message received
if (mockWebSocket.onmessage) {
  mockWebSocket.onmessage(new MessageEvent('message', { 
    data: JSON.stringify({ type: 'price_update', symbol: 'AAPL' }) 
  }));
}
```

### Testing Time-Dependent Behavior
```typescript
vi.useFakeTimers();

// Trigger reconnection
service.connect();
mockWebSocket.onclose(new CloseEvent('close', { code: 1006 }));

// Advance time to trigger reconnection
vi.advanceTimersByTime(1000);

vi.useRealTimers();
```

## Future Enhancements

Potential additional tests to consider:
- Performance tests for high-frequency message handling
- Memory leak detection tests
- Concurrent connection tests
- Network condition simulation (slow network, packet loss)
- Integration tests with actual WebSocket server
