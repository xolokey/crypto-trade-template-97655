# WebSocket Latency Testing Guide

This guide explains how to run latency tests for the WebSocket real-time data system.

## Overview

The latency test measures end-to-end latency from the backend to the frontend:

1. **Backend** publishes a message to Redis PubSub
2. **WebSocket Server** receives the message and broadcasts it
3. **Test Client** receives the message and calculates latency

The test verifies that **P95 latency is under 500ms** as required by the specifications.

## Prerequisites

- Redis server running on `localhost:6379` (or configured via `REDIS_URL`)
- WebSocket server running on `localhost:8081` (or configured via `WS_URL`)
- Node.js dependencies installed

## Quick Start

### 1. Install Dependencies

```bash
cd backend-ws
npm install
```

### 2. Start Required Services

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - WebSocket Server:**
```bash
cd backend-ws
node server.js
```

### 3. Run Latency Tests

**Terminal 3 - Latency Test:**
```bash
cd backend-ws
node latency-test.js
```

## Test Configuration

### Environment Variables

```bash
# WebSocket server URL
WS_URL=ws://localhost:8081

# Redis connection URL
REDIS_URL=redis://localhost:6379

# Network conditions to test (comma-separated)
TEST_CONDITIONS=ideal,good,moderate,poor
```

### Network Conditions

The test simulates various network conditions:

| Condition | Delay | Jitter | Packet Loss |
|-----------|-------|--------|-------------|
| **Ideal** | 0ms | 0ms | 0% |
| **Good** | 20ms | ±5ms | 0% |
| **Moderate** | 50ms | ±15ms | 1% |
| **Poor** | 100ms | ±30ms | 3% |
| **Bad** | 200ms | ±50ms | 5% |

## Running Specific Tests

### Test Only Ideal Conditions

```bash
TEST_CONDITIONS=ideal node latency-test.js
```

### Test Multiple Conditions

```bash
TEST_CONDITIONS=ideal,good,moderate node latency-test.js
```

### Custom Test Duration

Edit `latency-test.js` and modify:
```javascript
const TEST_DURATION_MS = 60000; // 60 seconds
const SAMPLES_PER_SECOND = 5;   // 5 samples per second
```

## Understanding the Results

### Sample Output

```
📊 Latency Test Report - IDEAL Network Conditions
══════════════════════════════════════════════════════════════════════

📈 Message Statistics:
   Messages sent:     60
   Messages received: 60
   Success rate:      100.00%
   Errors:            0

⏱️  Raw Latency (WebSocket only):
   Min:     12.45ms
   Max:     89.32ms
   Average: 34.67ms
   Median:  32.10ms
   P95:     67.89ms
   P99:     85.23ms

🌐 Simulated End-to-End Latency (with network conditions):
   Average: 34.67ms
   P95:     67.89ms
   P99:     85.23ms

✅ Requirement Check (P95 < 500ms):
   Status: ✅ PASS
   P95 Latency: 67.89ms

📊 Latency Distribution:
   < 50ms:  ████████████████████████████████████████ 85.0%
   < 100ms: ████████████████████████████████████████████████ 100.0%
   < 200ms: ████████████████████████████████████████████████ 100.0%
```

### Key Metrics

- **P95 Latency**: 95% of messages arrive within this time
- **P99 Latency**: 99% of messages arrive within this time
- **Success Rate**: Percentage of messages successfully delivered
- **Raw Latency**: WebSocket-only latency (no network simulation)
- **Simulated Latency**: Includes network delay and jitter

### Pass/Fail Criteria

✅ **PASS**: P95 latency < 500ms
❌ **FAIL**: P95 latency ≥ 500ms

## Troubleshooting

### WebSocket Connection Failed

**Error**: `WebSocket error: connect ECONNREFUSED`

**Solution**: Ensure WebSocket server is running:
```bash
cd backend-ws
node server.js
```

### Redis Connection Failed

**Error**: `Redis connection refused`

**Solution**: Start Redis server:
```bash
redis-server
```

Or use Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### High Latency Detected

**Warning**: `⚠️  High latency detected: 650ms`

**Possible Causes**:
1. Network congestion
2. Redis server overloaded
3. WebSocket server under heavy load
4. System resource constraints

**Solutions**:
- Reduce concurrent connections
- Optimize Redis configuration
- Scale WebSocket server horizontally
- Check system resources (CPU, memory)

### No Messages Received

**Error**: `No latency measurements collected`

**Possible Causes**:
1. WebSocket not subscribed to test symbol
2. Redis PubSub not working
3. Message format mismatch

**Solutions**:
- Check WebSocket server logs
- Verify Redis PubSub channels
- Enable debug logging in test script

## Advanced Usage

### Custom Latency Threshold

Edit `latency-test.js`:
```javascript
const LATENCY_THRESHOLD_MS = 300; // Stricter requirement
```

### Longer Test Duration

```javascript
const TEST_DURATION_MS = 300000; // 5 minutes
```

### More Samples

```javascript
const SAMPLES_PER_SECOND = 10; // 10 samples per second
```

### Debug Mode

Add console logging in `handleMessage()`:
```javascript
handleMessage(data) {
  console.log('Received:', data.toString());
  // ... rest of the code
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Latency Tests

on: [push, pull_request]

jobs:
  latency-test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
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
      
      - name: Run latency tests
        run: |
          cd backend-ws
          TEST_CONDITIONS=ideal,good node latency-test.js
```

## Performance Benchmarks

### Expected Results

| Network Condition | Expected P95 | Expected P99 |
|-------------------|--------------|--------------|
| Ideal | < 100ms | < 150ms |
| Good | < 150ms | < 200ms |
| Moderate | < 250ms | < 350ms |
| Poor | < 400ms | < 500ms |

### Production Targets

- **P95 Latency**: < 500ms (requirement)
- **P99 Latency**: < 1000ms (target)
- **Success Rate**: > 99%
- **Error Rate**: < 1%

## Related Documentation

- [Load Testing Guide](./LOAD_TESTING.md) - Test with multiple concurrent clients
- [WebSocket Setup Guide](../WEBSOCKET_SETUP_GUIDE.md) - Initial setup
- [Quick Start Guide](./QUICK_START_LOAD_TEST.md) - Quick testing guide

## Requirements Verification

This test verifies the following requirements:

- **Requirement 2.1**: Price updates received within 500ms
- **Requirement 5.1**: Sub-second latency with 100 concurrent users

## Support

For issues or questions:
1. Check WebSocket server logs
2. Check Redis logs
3. Review [Troubleshooting Guide](../TROUBLESHOOTING_API_KEYS.md)
4. Enable debug mode in test script
