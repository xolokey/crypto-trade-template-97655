# Quick Start: Latency Testing

Run latency tests in under 2 minutes!

## Prerequisites

✅ Redis running on `localhost:6379`
✅ WebSocket server running on `localhost:8081`

## Step 1: Start Services

### Terminal 1 - Redis
```bash
redis-server
```

### Terminal 2 - WebSocket Server
```bash
cd backend-ws
npm start
```

## Step 2: Run Latency Test

### Terminal 3 - Run Test
```bash
cd backend-ws
npm run latency-test
```

## What to Expect

The test will:
1. Connect to WebSocket and Redis
2. Subscribe to a test symbol
3. Send messages through Redis → WebSocket → Client
4. Measure end-to-end latency
5. Test under different network conditions
6. Generate a detailed report

### Expected Output

```
🚀 WebSocket Latency Testing Suite
══════════════════════════════════════════════════════════════════════
Target: ws://localhost:8081
Redis: redis://localhost:6379
Latency Threshold: 500ms
══════════════════════════════════════════════════════════════════════

🔌 Connecting to Redis and WebSocket...
✅ Redis connected
✅ WebSocket connected

🧪 Running latency test under "ideal" network conditions...
   Duration: 30s
   Samples per second: 2
   Network delay: 0ms ± 0ms
   Packet loss: 0%

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

✅ Requirement Check (P95 < 500ms):
   Status: ✅ PASS
   P95 Latency: 67.89ms

🎯 Overall Result: ✅ ALL TESTS PASSED
```

## Quick Commands

### Test Only Ideal Conditions (Fastest)
```bash
npm run latency-test:ideal
```

### Test All Conditions (Comprehensive)
```bash
npm run latency-test:all
```

### Custom Test
```bash
TEST_CONDITIONS=ideal,good node latency-test.js
```

## Pass/Fail Criteria

✅ **PASS**: P95 latency < 500ms
❌ **FAIL**: P95 latency ≥ 500ms

## Troubleshooting

### Redis Not Running
```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:alpine
```

### WebSocket Server Not Running
```bash
cd backend-ws
npm start
```

### Connection Refused
Check that services are running:
```bash
# Check Redis
redis-cli ping

# Check WebSocket (in browser console or another terminal)
curl http://localhost:8081/health
```

## Next Steps

- Run [Load Tests](./QUICK_START_LOAD_TEST.md) to test with multiple clients
- Review [Full Documentation](./LATENCY_TESTING.md) for advanced options
- Check [WebSocket Setup Guide](../WEBSOCKET_SETUP_GUIDE.md) for configuration

## Requirements Verified

✅ **Requirement 2.1**: Price updates within 500ms
✅ **Requirement 5.1**: Sub-second latency under load
