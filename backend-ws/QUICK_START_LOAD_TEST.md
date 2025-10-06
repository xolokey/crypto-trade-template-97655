# Quick Start: Load Testing

## TL;DR

```bash
# 1. Start services
redis-server                                    # Terminal 1
cd backend/StockTracker.API && dotnet run      # Terminal 2
cd backend-ws && npm start                      # Terminal 3

# 2. Run load test
cd backend-ws && npm run load-test             # Terminal 4
```

## What Gets Tested

✅ 100 concurrent WebSocket connections  
✅ Message delivery rate (target: > 99%)  
✅ Latency (target: P95 < 500ms)  
✅ Memory usage and leak detection  
✅ Connection stability  

## Test Variants

```bash
# Quick test (30 seconds, 50 clients)
npm run load-test:quick

# Standard test (60 seconds, 100 clients)
npm run load-test

# Stress test (60 seconds, 200 clients)
npm run load-test:stress

# Endurance test (5 minutes, 100 clients)
npm run load-test:endurance
```

## Check Environment First

```bash
npm run check-env
```

This verifies:
- ✅ WebSocket server is running
- ✅ Redis is running
- ✅ Backend is running (optional)

## Understanding Results

### ✅ PASS Criteria
- Connection success rate: 100%
- Message delivery rate: > 99%
- P95 latency: < 500ms
- Memory growth: < 50%

### Sample Output
```
✅ TEST RESULTS SUMMARY
Connection Success Rate: 100.00%
Message Delivery Rate: 99.60% ✅ (Target: > 99%)
P95 Latency: 456.78ms ✅ (Target: < 500ms)
Memory Growth: 15.72%

✅ ALL TESTS PASSED
```

## Troubleshooting

### "WebSocket server is not running"
```bash
cd backend-ws
npm start
```

### "Redis is not running"
```bash
redis-server
```

### "Low delivery rate"
- Check backend is fetching data
- Verify Redis PubSub is working: `redis-cli monitor`
- Check server logs for errors

### "High latency"
- Check system resources: `top`
- Verify network is stable
- Check backend API response times

## Full Documentation

See [LOAD_TESTING.md](./LOAD_TESTING.md) for complete documentation.
