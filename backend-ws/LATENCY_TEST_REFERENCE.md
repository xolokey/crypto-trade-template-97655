# Latency Test Quick Reference

## One-Line Commands

```bash
# Standard test (ideal, good, moderate, poor)
npm run latency-test

# Fast test (ideal only)
npm run latency-test:ideal

# Comprehensive test (all conditions)
npm run latency-test:all

# Custom conditions
TEST_CONDITIONS=ideal,good node latency-test.js
```

## Prerequisites Checklist

- [ ] Redis running: `redis-cli ping` → PONG
- [ ] WebSocket server running: `curl http://localhost:8081/health`
- [ ] Dependencies installed: `npm install`

## Quick Troubleshooting

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` (Redis) | `redis-server` |
| `ECONNREFUSED` (WebSocket) | `npm start` |
| No messages received | Check Redis channels: `redis-cli PUBSUB CHANNELS` |
| High latency | Check system resources, reduce load |

## Pass/Fail Criteria

✅ **PASS**: P95 latency < 500ms
❌ **FAIL**: P95 latency ≥ 500ms

## Network Conditions

| Condition | Delay | Jitter | Loss |
|-----------|-------|--------|------|
| ideal | 0ms | 0ms | 0% |
| good | 20ms | ±5ms | 0% |
| moderate | 50ms | ±15ms | 1% |
| poor | 100ms | ±30ms | 3% |
| bad | 200ms | ±50ms | 5% |

## Key Metrics

- **P95**: 95% of messages arrive within this time
- **P99**: 99% of messages arrive within this time
- **Success Rate**: % of messages delivered
- **Raw Latency**: WebSocket only (no simulation)
- **Simulated Latency**: With network conditions

## Environment Variables

```bash
WS_URL=ws://localhost:8081
REDIS_URL=redis://localhost:6379
TEST_CONDITIONS=ideal,good,moderate,poor
```

## Expected Results

| Condition | Expected P95 |
|-----------|--------------|
| Ideal | < 100ms |
| Good | < 150ms |
| Moderate | < 250ms |
| Poor | < 400ms |

## Full Documentation

- [Complete Guide](./LATENCY_TESTING.md)
- [Quick Start](./QUICK_START_LATENCY_TEST.md)
- [Load Testing](./LOAD_TESTING.md)
