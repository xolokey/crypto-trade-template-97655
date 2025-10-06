# WebSocket Load Testing Guide

This guide explains how to perform load testing on the WebSocket server to verify performance requirements.

## Overview

The load testing script simulates 100 concurrent WebSocket connections and measures:
- Message delivery latency
- Delivery success rate (target: > 99%)
- Memory usage over time
- Connection stability

## Prerequisites

1. **WebSocket Server Running**: Ensure the WebSocket server is running
   ```bash
   cd backend-ws
   node server.js
   ```

2. **.NET Backend Running**: The backend should be running to provide real data
   ```bash
   cd backend/StockTracker.API
   dotnet run
   ```

3. **Redis Running**: Redis must be running for PubSub
   ```bash
   redis-server
   ```

## Running the Load Test

### Basic Test (Default Configuration)

```bash
cd backend-ws
node load-test.js
```

This will:
- Connect 100 concurrent clients
- Subscribe each client to 5 symbols (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK)
- Run for 60 seconds
- Collect and report metrics

### Custom Configuration

You can customize the test using environment variables:

```bash
# Test with different WebSocket URL
WS_URL=ws://localhost:8081 node load-test.js

# Test with more clients
NUM_CLIENTS=200 node load-test.js

# Test for longer duration (5 minutes)
TEST_DURATION_MS=300000 node load-test.js
```

### Available Configuration Options

Edit the `CONFIG` object in `load-test.js`:

```javascript
const CONFIG = {
  WS_URL: 'ws://localhost:8081',        // WebSocket server URL
  NUM_CLIENTS: 100,                      // Number of concurrent clients
  TEST_DURATION_MS: 60000,               // Test duration (1 minute)
  SYMBOLS: ['RELIANCE', 'TCS', ...],     // Symbols to subscribe to
  MEMORY_CHECK_INTERVAL_MS: 5000,        // Memory snapshot interval
  REPORT_INTERVAL_MS: 10000,             // Interim report interval
};
```

## Understanding the Results

### Connection Metrics

```
📊 CONNECTION METRICS
Total Connection Attempts: 100
Successful Connections: 100
Failed Connections: 0
Connection Success Rate: 100.00%
Disconnections During Test: 0
```

**What to look for:**
- Connection success rate should be 100%
- No disconnections during the test
- Connection times should be < 1000ms

### Message Metrics

```
📨 MESSAGE METRICS
Total Messages Sent: 500
Total Messages Received: 12,450
Message Delivery Rate: 99.60%
```

**What to look for:**
- **Delivery rate > 99%** ✅ (This is the key requirement)
- Messages received should be proportional to test duration
- No significant message loss

### Latency Metrics

```
⏱️  LATENCY METRICS (ms)
Samples: 12,450
Min: 45.23
Max: 892.15
Average: 234.56
Median: 198.34
P95: 456.78
P99: 678.90

Latency Target (P95 < 500ms): ✅ PASS
```

**What to look for:**
- **P95 latency < 500ms** ✅ (This is the key requirement)
- Average latency should be < 300ms
- P99 latency should be < 1000ms
- No extreme outliers (max should be reasonable)

### Memory Metrics

```
💾 MEMORY METRICS
Initial Heap Used: 45.23 MB
Final Heap Used: 52.34 MB
Heap Growth: 7.11 MB
Initial RSS: 78.45 MB
Final RSS: 85.67 MB
RSS Growth: 7.22 MB
Heap Growth Rate: 15.72%
```

**What to look for:**
- Heap growth should be < 50% (indicates no major memory leaks)
- RSS growth should be proportional to number of connections
- Memory should stabilize after initial connection phase

### Error Metrics

```
❌ ERROR METRICS
Total Errors: 5
Error Rate: 0.04%
```

**What to look for:**
- Error rate should be < 1%
- No critical errors (connection failures, parse errors)
- Occasional timeout errors are acceptable

### Test Results Summary

```
✅ TEST RESULTS SUMMARY
Connection Success Rate: 100.00%
Message Delivery Rate: 99.60% ✅ (Target: > 99%)
P95 Latency: 456.78ms ✅ (Target: < 500ms)
Memory Growth: 15.72%

✅ ALL TESTS PASSED
```

**Pass Criteria:**
- ✅ Message delivery rate > 99%
- ✅ P95 latency < 500ms
- ✅ No connection failures
- ✅ Memory growth < 50%

## Interpreting Test Failures

### Low Delivery Rate (< 99%)

**Possible causes:**
- WebSocket server overloaded
- Network issues
- Backend not publishing updates fast enough
- Redis PubSub issues

**Solutions:**
- Check server logs for errors
- Verify Redis is running and healthy
- Ensure backend is fetching data for subscribed symbols
- Consider scaling WebSocket server

### High Latency (P95 > 500ms)

**Possible causes:**
- Slow backend API responses
- Redis PubSub delays
- Network latency
- Server CPU/memory constraints

**Solutions:**
- Optimize backend data fetching
- Check Redis performance
- Profile WebSocket server for bottlenecks
- Consider caching strategies

### Connection Failures

**Possible causes:**
- Server not running
- Port conflicts
- Firewall blocking connections
- Server connection limit reached

**Solutions:**
- Verify server is running: `ps aux | grep node`
- Check port availability: `lsof -i :8081`
- Increase server connection limits
- Check server logs for errors

### Memory Growth

**Possible causes:**
- Memory leaks in message handling
- Unbounded message queues
- Connection objects not being cleaned up
- Event listener leaks

**Solutions:**
- Review code for memory leaks
- Implement proper cleanup in disconnect handlers
- Use WeakMap/WeakSet where appropriate
- Profile with Node.js memory profiler

## Advanced Testing Scenarios

### Stress Test (200 Clients)

```bash
NUM_CLIENTS=200 TEST_DURATION_MS=120000 node load-test.js
```

### Endurance Test (1 Hour)

```bash
TEST_DURATION_MS=3600000 node load-test.js
```

### Network Simulation

Use tools like `tc` (traffic control) to simulate network conditions:

```bash
# Add 100ms latency
sudo tc qdisc add dev lo root netem delay 100ms

# Remove latency
sudo tc qdisc del dev lo root
```

### Production-like Test

```bash
WS_URL=wss://your-production-url.com node load-test.js
```

## Continuous Integration

Add load testing to your CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend-ws
          npm install
      
      - name: Start WebSocket server
        run: |
          cd backend-ws
          node server.js &
          sleep 5
      
      - name: Run load test
        run: |
          cd backend-ws
          node load-test.js
```

## Monitoring During Tests

### Server Metrics

Monitor the WebSocket server during tests:

```bash
# CPU and memory usage
top -p $(pgrep -f "node server.js")

# Network connections
watch -n 1 'netstat -an | grep :8081 | wc -l'

# Redis monitoring
redis-cli monitor
```

### Client Metrics

The load test script provides real-time metrics:
- Interim reports every 10 seconds
- Memory snapshots every 5 seconds
- Connection status updates
- Error logging

## Troubleshooting

### Test Hangs or Doesn't Complete

- Check if WebSocket server is responding: `curl http://localhost:8081/health`
- Verify Redis is running: `redis-cli ping`
- Check for port conflicts: `lsof -i :8081`
- Review server logs for errors

### Inconsistent Results

- Run multiple test iterations
- Ensure no other processes are competing for resources
- Use dedicated test environment
- Check for network instability

### Test Fails in CI but Passes Locally

- Verify CI environment has sufficient resources
- Check for timing issues (increase timeouts)
- Ensure all services are properly started
- Review CI logs for specific errors

## Best Practices

1. **Baseline Testing**: Run tests on a clean system to establish baseline metrics
2. **Regular Testing**: Run load tests before each release
3. **Trend Analysis**: Track metrics over time to detect performance regressions
4. **Realistic Scenarios**: Test with production-like data and traffic patterns
5. **Gradual Load**: Start with fewer clients and gradually increase
6. **Monitor Resources**: Watch CPU, memory, and network during tests
7. **Document Results**: Keep records of test results for comparison

## Requirements Verification

This load test verifies the following requirements:

- **Requirement 5.1**: System maintains sub-second update latency with 100 concurrent users
- **Requirement 5.2**: Message batching reduces overhead
- **Requirement 2.1**: Price updates received within 500ms (P95 latency)

## Next Steps

After successful load testing:

1. ✅ Document baseline performance metrics
2. ✅ Set up monitoring alerts for production
3. ✅ Create performance regression tests
4. ✅ Plan for horizontal scaling if needed
5. ✅ Optimize based on test results

## Support

For issues or questions:
- Check server logs: `backend-ws/logs/`
- Review WebSocket documentation: `backend-ws/README.md`
- Check Redis status: `redis-cli info`
