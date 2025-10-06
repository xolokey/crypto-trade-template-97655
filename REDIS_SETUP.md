# Redis Setup Guide for WebSocket Real-Time Data

This guide will help you set up Redis for the WebSocket real-time data feature.

## What is Redis?

Redis is an in-memory data store used for:
- **PubSub messaging** between .NET backend and WebSocket server
- **Caching** stock quotes and market data
- **Tracking** active subscriptions

## Installation

### macOS (using Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Alternative: Run Redis with Docker

```bash
# Run Redis in a container
docker run -d --name redis-stocktracker -p 6379:6379 redis:7-alpine

# Verify it's running
docker ps | grep redis

# Test connection
docker exec -it redis-stocktracker redis-cli ping
# Should return: PONG
```

### Windows

Download and install from: https://redis.io/download

Or use WSL2 with the Linux instructions.

## Configuration

### 1. Backend (.NET) Configuration

Redis is already configured in `backend/StockTracker.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "Redis": "localhost:6379"
  }
}
```

For production, update with your Redis connection string:
```json
{
  "ConnectionStrings": {
    "Redis": "your-redis-host:6379,password=your-password,ssl=true"
  }
}
```

### 2. WebSocket Server Configuration

Redis configuration is in `backend-ws/.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# PubSub Channels
REDIS_CHANNEL_UPDATES=market-data:updates
REDIS_CHANNEL_SUBSCRIPTIONS=market-data:subscriptions
REDIS_CHANNEL_CONTROL=market-data:control
```

### 3. Frontend Configuration

WebSocket configuration is in `.env`:

```env
VITE_WS_URL=ws://localhost:8081
VITE_ENABLE_WEBSOCKET=true
VITE_FALLBACK_TO_POLLING=true
VITE_WS_RECONNECT_INTERVAL=5000
```

## Redis Channels

The system uses three Redis PubSub channels:

1. **market-data:updates** - Real-time price updates
   ```json
   {
     "type": "price_update",
     "symbol": "RELIANCE",
     "data": { /* StockQuote */ },
     "timestamp": "2024-01-10T10:30:00Z"
   }
   ```

2. **market-data:subscriptions** - Subscription changes
   ```json
   {
     "action": "subscribe",
     "symbols": ["RELIANCE", "TCS"],
     "clientId": "uuid"
   }
   ```

3. **market-data:control** - Control messages
   ```json
   {
     "action": "pause",
     "reason": "maintenance"
   }
   ```

## Redis Keys

The system uses these Redis keys:

- `subscriptions:active` - Set of actively subscribed symbols
- `subscriptions:count:{symbol}` - Count of subscribers per symbol
- `quote:{symbol}` - Cached stock quotes

## Testing Redis

### Test Redis Connection

```bash
# Connect to Redis CLI
redis-cli

# Test basic commands
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> SET test "Hello Redis"
OK

127.0.0.1:6379> GET test
"Hello Redis"

127.0.0.1:6379> DEL test
(integer) 1
```

### Monitor PubSub Messages

```bash
# In one terminal, subscribe to all channels
redis-cli
127.0.0.1:6379> PSUBSCRIBE market-data:*

# In another terminal, publish a test message
redis-cli
127.0.0.1:6379> PUBLISH market-data:updates '{"type":"test","symbol":"RELIANCE"}'
```

### Check Active Subscriptions

```bash
redis-cli
127.0.0.1:6379> SMEMBERS subscriptions:active
1) "RELIANCE"
2) "TCS"
3) "INFY"
```

## Troubleshooting

### Redis Not Starting

```bash
# Check if Redis is running
ps aux | grep redis

# Check Redis logs (macOS)
tail -f /usr/local/var/log/redis.log

# Restart Redis
brew services restart redis
```

### Connection Refused

1. Verify Redis is running: `redis-cli ping`
2. Check firewall settings
3. Verify port 6379 is not in use: `lsof -i :6379`

### Memory Issues

```bash
# Check Redis memory usage
redis-cli INFO memory

# Set max memory (e.g., 256MB)
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Production Considerations

### Security

1. **Enable Authentication**
   ```bash
   # Set password in redis.conf
   requirepass your-strong-password
   ```

2. **Use TLS/SSL**
   ```bash
   # Configure SSL in redis.conf
   tls-port 6380
   tls-cert-file /path/to/cert.pem
   tls-key-file /path/to/key.pem
   ```

3. **Bind to Specific IP**
   ```bash
   # In redis.conf
   bind 127.0.0.1 ::1
   ```

### Persistence

For PubSub, persistence is not required, but for caching:

```bash
# Enable RDB snapshots
save 900 1
save 300 10
save 60 10000
```

### Monitoring

```bash
# Monitor Redis in real-time
redis-cli --stat

# Get server info
redis-cli INFO

# Monitor slow queries
redis-cli SLOWLOG GET 10
```

## Cloud Redis Options

For production deployment:

1. **Redis Cloud** - https://redis.com/redis-enterprise-cloud/
2. **AWS ElastiCache** - https://aws.amazon.com/elasticache/
3. **Azure Cache for Redis** - https://azure.microsoft.com/en-us/services/cache/
4. **Google Cloud Memorystore** - https://cloud.google.com/memorystore

## Next Steps

After Redis is set up:

1. ✅ Redis installed and running
2. ⏭️ Implement .NET WebSocket notification service (Task 2)
3. ⏭️ Integrate Redis PubSub into WebSocket server (Task 5)
4. ⏭️ Test end-to-end real-time data flow

## Useful Commands

```bash
# Start Redis
brew services start redis

# Stop Redis
brew services stop redis

# Restart Redis
brew services restart redis

# Connect to Redis CLI
redis-cli

# Flush all data (CAUTION!)
redis-cli FLUSHALL

# Monitor all commands
redis-cli MONITOR
```
