# Implementation Plan

- [x] 1. Set up Redis infrastructure for PubSub communication

  - Install and configure Redis for development environment
  - Add Redis connection configuration to .NET backend appsettings.json
  - Add Redis connection configuration to WebSocket server .env
  - Create Redis PubSub channel constants (market-data:updates, market-data:subscriptions)
  - _Requirements: 4.1, 4.2, 7.1, 7.2_

- [x] 2. Implement .NET Backend WebSocket notification service
- [x] 2.1 Create IWebSocketNotificationService interface

  - Define interface with methods: PublishPriceUpdateAsync, PublishBatchUpdatesAsync, NotifySubscriptionChangeAsync
  - Add interface to StockTracker.Core/Interfaces directory
  - _Requirements: 4.1, 4.2_

- [x] 2.2 Implement WebSocketNotificationService class

  - Create service class in StockTracker.Infrastructure/Services
  - Implement Redis PubSub publishing logic
  - Add error handling and logging
  - Register service in Program.cs dependency injection
  - _Requirements: 4.1, 4.2, 6.1_

- [ ] 2.3 Write unit tests for WebSocketNotificationService

  - Test successful message publishing
  - Test error handling when Redis is unavailable
  - Test message serialization
  - _Requirements: 4.1, 4.2_

- [x] 3. Integrate WebSocket notifications into MarketDataService
- [x] 3.1 Modify GetStockQuoteAsync to publish updates

  - Inject IWebSocketNotificationService into MarketDataService
  - After fetching and caching data, publish to Redis PubSub
  - Add conditional logic to only publish for subscribed symbols
  - _Requirements: 4.1, 4.3_

- [x] 3.2 Create subscription tracking mechanism

  - Add Redis key for tracking active subscriptions (Set data structure)
  - Implement methods to check if symbol is subscribed
  - Add methods to add/remove symbols from subscription set
  - _Requirements: 3.1, 3.2, 4.3_

- [ ] 3.3 Write integration tests for MarketDataService updates

  - Test that updates are published after fetching data
  - Test that updates are only published for subscribed symbols
  - Test error handling when publishing fails
  - _Requirements: 4.1, 4.3_

- [x] 4. Implement ActiveSymbolsBackgroundService
- [x] 4.1 Create background service class

  - Create ActiveSymbolsBackgroundService inheriting from BackgroundService
  - Implement ExecuteAsync method with continuous loop
  - Add service registration in Program.cs
  - _Requirements: 4.3, 4.4_

- [x] 4.2 Implement active symbol fetching logic

  - Fetch list of active subscriptions from Redis
  - Loop through symbols and fetch data for each
  - Publish updates via WebSocketNotificationService
  - Add configurable interval (default 2 seconds)
  - _Requirements: 4.3, 4.4_

- [x] 4.3 Add error handling and resilience

  - Wrap fetch logic in try-catch blocks
  - Continue processing other symbols if one fails
  - Log errors with context
  - Implement circuit breaker for external API failures
  - _Requirements: 6.1, 6.2_

- [ ]\* 4.4 Write tests for background service

  - Test that service fetches active symbols
  - Test that service publishes updates
  - Test error handling for failed fetches
  - _Requirements: 4.3_

- [x] 5. Enhance WebSocket server with Redis PubSub integration
- [x] 5.1 Add Redis client to WebSocket server

  - Install ioredis npm package
  - Create Redis connection configuration
  - Implement Redis PubSub subscriber
  - _Requirements: 4.2, 4.4_

- [x] 5.2 Implement subscription manager with Redis sync

  - Enhance existing SubscriptionManager to sync with Redis
  - When client subscribes, add to Redis subscription set
  - When client unsubscribes, remove from Redis subscription set
  - Handle cleanup when all clients unsubscribe from a symbol
  - _Requirements: 3.1, 3.2, 3.3, 4.3_

- [x] 5.3 Implement Redis PubSub message handler

  - Subscribe to market-data:updates channel
  - Parse incoming messages
  - Route messages to appropriate clients via BroadcastEngine
  - Add error handling for malformed messages
  - _Requirements: 2.1, 2.2, 4.2_

- [x] 5.4 Add message deduplication logic

  - Track last message timestamp per symbol
  - Ignore duplicate messages within 100ms window
  - Log deduplicated messages for monitoring
  - _Requirements: 4.7, 9.2_

- [ ] 5.5 Write tests for Redis integration

  - Test subscription sync with Redis
  - Test message routing from Redis to clients
  - Test deduplication logic
  - _Requirements: 4.2, 4.7_

- [x] 6. Enhance frontend WebSocketService
- [x] 6.1 Implement exponential backoff reconnection

  - Add reconnection state tracking
  - Implement exponential backoff algorithm (1s, 2s, 4s, 8s, 16s, 30s max)
  - Add max reconnection attempts configuration
  - Reset attempt counter on successful connection
  - _Requirements: 1.4, 6.2, 6.3_

- [x] 6.2 Add connection state management

  - Implement state machine for connection states (CONNECTING, OPEN, CLOSING, CLOSED, RECONNECTING)
  - Add state change event emitter
  - Track connection metrics (connected time, message count, error count)
  - _Requirements: 1.2, 1.6, 1.7, 8.1_

- [x] 6.3 Implement subscription persistence across reconnections

  - Store active subscriptions in memory
  - On reconnection, automatically resubscribe to all symbols
  - Add subscription confirmation handling
  - _Requirements: 1.5, 3.1, 3.2_

- [x] 6.4 Add message batching and throttling

  - Implement message queue for incoming updates
  - Batch process updates every 100ms to avoid UI thrashing
  - Add throttling for rapid updates to same symbol
  - _Requirements: 2.5, 5.3_

- [ ] 6.5 Write unit tests for WebSocketService

  - Test connection lifecycle
  - Test reconnection logic with exponential backoff
  - Test subscription persistence
  - Test message batching
  - _Requirements: 1.4, 1.5, 2.5_

- [x] 7. Enhance useRealTimeStock hook
- [x] 7.1 Implement automatic fallback to polling

  - Detect WebSocket connection failure
  - Automatically start polling interval (30 seconds)
  - Switch back to WebSocket when connection restored
  - Add isRealTime flag to indicate current mode
  - _Requirements: 1.3, 1.7, 6.3_

- [x] 7.2 Add connection status tracking

  - Expose connection state from WebSocketService
  - Add isConnected boolean flag
  - Add connectionState enum
  - Track last update timestamp
  - _Requirements: 1.2, 1.6, 1.7, 10.1, 10.2_

- [x] 7.3 Implement automatic subscription management

  - Subscribe to symbol on hook mount
  - Unsubscribe on hook unmount
  - Handle symbol changes (unsubscribe old, subscribe new)
  - Add 5-second delay before unsubscribing (optimization)
  - _Requirements: 3.1, 3.2_

- [x] 7.4 Add latency tracking

  - Calculate message latency using timestamps
  - Expose average latency metric
  - Log warnings when latency exceeds 1 second
  - _Requirements: 2.1, 5.1, 8.5_

- [ ] 7.5 Write tests for useRealTimeStock hook

  - Test automatic subscription on mount
  - Test unsubscription on unmount
  - Test fallback to polling
  - Test reconnection handling
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 8. Create ConnectionStatusIndicator component
- [x] 8.1 Implement visual status indicator

  - Create component with three states: Live (green), Delayed (yellow), Offline (red)
  - Add fourth state: Reconnecting (blue)
  - Position indicator in top-right corner by default
  - Make position configurable via props
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 8.2 Add detailed tooltip

  - Show connection state
  - Show last update time
  - Show latency (if available)
  - Show number of active subscriptions
  - _Requirements: 10.4_

- [x] 8.3 Add pulse animation for updates

  - Animate indicator when new data received
  - Use subtle pulse effect (scale + opacity)
  - Duration: 500ms
  - _Requirements: 10.5_

- [x] 8.4 Add toast notifications for state changes

  - Show "Connected - Real-Time" when WebSocket connects
  - Show "Connection Lost - Using Delayed Data" when falling back to polling
  - Show "Connection Restored" when reconnecting
  - Auto-dismiss after 3 seconds
  - _Requirements: 6.7, 10.6_

- [x] 9. Integrate ConnectionStatusIndicator into UI
- [x] 9.1 Add to Dashboard page

  - Import and render ConnectionStatusIndicator
  - Pass connection state from useRealTimeStock hook
  - Position in top-right corner
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 9.2 Add to LiveMarket page

  - Import and render ConnectionStatusIndicator
  - Pass connection state from useRealTimeStock hook
  - Position in top-right corner
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 9.3 Add to stock detail pages

  - Import and render ConnectionStatusIndicator
  - Pass connection state from useRealTimeStock hook
  - Position in top-right corner
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 10. Implement price update visual feedback
- [x] 10.1 Add price change highlighting

  - Detect price increase and highlight in green for 2 seconds
  - Detect price decrease and highlight in red for 2 seconds
  - Use CSS transitions for smooth color changes
  - _Requirements: 2.3, 2.4_

- [x] 10.2 Update EnhancedStockCard component

  - Integrate price change highlighting
  - Add "Last updated: X seconds ago" text
  - Update on every WebSocket message
  - _Requirements: 2.6, 9.7_

- [x] 10.3 Update LiveStockTicker component

  - Integrate price change highlighting
  - Add real-time update indicator
  - Ensure smooth animations
  - _Requirements: 2.3, 2.4, 10.5_

- [x] 11. Add configuration and environment support
- [x] 11.1 Add environment variables

  - Add VITE_WS_URL to .env files (development and production)
  - Add VITE_ENABLE_WEBSOCKET flag (default: true)
  - Add VITE_FALLBACK_TO_POLLING flag (default: true)
  - Add VITE_WS_RECONNECT_INTERVAL (default: 5000)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11.2 Create WebSocket configuration utility

  - Create src/config/websocket.ts
  - Export configuration object with all WebSocket settings
  - Add validation for required environment variables
  - Provide sensible defaults
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 11.3 Update WebSocketService to use configuration

  - Import configuration from websocket.ts
  - Use environment-specific WebSocket URL
  - Respect enable/disable flags
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 12. Implement monitoring and debugging tools
- [x] 12.1 Add comprehensive logging

  - Log all connection events (connect, disconnect, reconnect)
  - Log all subscription events (subscribe, unsubscribe)
  - Log all errors with stack traces
  - Use different log levels (info, warn, error)
  - _Requirements: 8.1, 8.2, 8.6_

- [x] 12.2 Create debug panel component

  - Create DebugPanel component for development mode
  - Show connection status and metrics
  - Show message log (last 50 messages)
  - Show active subscriptions
  - Add toggle to show/hide panel
  - _Requirements: 8.2, 8.6_

- [x] 12.3 Add metrics tracking

  - Track connection count
  - Track messages per second
  - Track average latency
  - Track error rate
  - Expose metrics via getMetrics() method
  - _Requirements: 5.6, 8.4_

- [x] 12.4 Add health check endpoint to WebSocket server

  - Create /health endpoint
  - Return connection statistics
  - Return active subscriptions count
  - Return system health status
  - _Requirements: 8.8_

- [x] 13. Implement data consistency and synchronization
- [x] 13.1 Add timestamp-based message ordering

  - Parse timestamp from all messages
  - Compare with last received timestamp
  - Ignore out-of-order messages
  - Log discarded messages
  - _Requirements: 9.2_

- [x] 13.2 Add data staleness detection

  - Track last update time per symbol
  - Display warning if data is older than 60 seconds
  - Add visual indicator for stale data
  - _Requirements: 9.7_

- [x] 13.3 Implement page focus refresh

  - Listen for page visibility change events
  - When page regains focus, fetch fresh data
  - Update all subscribed symbols
  - _Requirements: 9.5_

- [x] 13.4 Handle polling/WebSocket data conflicts

  - When both sources provide data, use most recent timestamp
  - Log discrepancies for monitoring
  - Prefer WebSocket data when timestamps are equal
  - _Requirements: 9.3, 9.4_

- [x] 14. Add user settings for WebSocket control
- [x] 14.1 Create settings UI

  - Add WebSocket settings section to settings page
  - Add toggle to enable/disable WebSocket
  - Add toggle to enable/disable automatic fallback
  - Save preferences to localStorage
  - _Requirements: 10.7_

- [x] 14.2 Implement settings persistence

  - Load settings from localStorage on app start
  - Apply settings to WebSocketService
  - Update settings when user changes preferences
  - _Requirements: 10.7_

- [x] 15. Performance optimization and testing
- [x] 15.1 Implement message compression

  - Add compression support to WebSocket server
  - Enable per-message deflate
  - Configure compression threshold (messages > 1KB)
  - _Requirements: 5.2_

- [x] 15.2 Implement slow client detection

  - Track message queue size per client
  - Detect clients with queue > 100 messages
  - Disconnect slow clients with warning message
  - Log slow client events
  - _Requirements: 5.4_

- [x] 15.3 Add backpressure handling

  - Monitor WebSocket server memory usage
  - Implement throttling when memory > 80%
  - Reduce update frequency for non-critical symbols
  - _Requirements: 5.3_

- [ ] 15.4 Perform load testing

  - Simulate 100 concurrent connections
  - Measure message delivery latency
  - Verify > 99% delivery success rate
  - Measure memory usage over time
  - _Requirements: 5.1, 5.2_

- [ ] 15.5 Perform latency testing

  - Measure end-to-end latency (backend → frontend)
  - Verify latency < 500ms
  - Test under various network conditions
  - _Requirements: 2.1, 5.1_

- [x] 16. Documentation and deployment preparation
- [x] 16.1 Update README with WebSocket setup instructions

  - Document Redis installation and configuration
  - Document WebSocket server deployment
  - Document environment variables
  - Add troubleshooting section
  - _Requirements: 7.1, 7.2, 7.7_

- [x] 16.2 Create deployment guide

  - Document infrastructure requirements
  - Document scaling considerations
  - Document monitoring setup
  - Add production checklist
  - _Requirements: 7.6_

- [x] 16.3 Update API documentation

  - Document WebSocket message formats
  - Document connection flow
  - Document error codes
  - Add examples
  - _Requirements: 8.1, 8.2_

- [x] 17. Final integration and validation
- [x] 17.1 End-to-end integration testing

  - Test complete flow: frontend → WebSocket → backend → external API
  - Verify real-time updates work correctly
  - Test fallback mechanism
  - Test reconnection after network interruption
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [x] 17.2 Cross-browser testing

  - Test on Chrome, Firefox, Safari, Edge
  - Verify WebSocket compatibility
  - Test on mobile browsers (iOS Safari, Chrome Mobile)
  - _Requirements: 1.1_

- [x] 17.3 Multi-tab testing

  - Open multiple tabs with same stock
  - Verify each tab maintains independent connection
  - Verify all tabs receive updates
  - _Requirements: 9.6_

- [x] 17.4 Watchlist integration testing

  - Add stock to watchlist
  - Verify automatic subscription
  - Remove stock from watchlist
  - Verify automatic unsubscription
  - _Requirements: 3.3, 3.4_

- [x] 17.5 Performance validation
  - Monitor memory usage over 1 hour
  - Verify no memory leaks
  - Verify CPU usage remains reasonable
  - Test with 50+ active subscriptions
  - _Requirements: 3.6, 5.1, 5.5_
