# WebSocket Real-Time Data - Complete Setup Guide

## 🎉 Overview

This guide will help you set up and run the complete WebSocket real-time data system for the Stock Tracker application.

## ✅ What's Been Implemented

- ✅ **Backend (.NET)**: Real-time data publishing via Redis PubSub
- ✅ **WebSocket Server (Node.js)**: Message routing and broadcasting
- ✅ **Frontend (React)**: Real-time data consumption with automatic fallback
- ✅ **Connection Status UI**: Visual indicators and notifications
- ✅ **Error Handling**: Exponential backoff, circuit breakers, graceful degradation

## 📋 Prerequisites

1. **Redis** (v6.0+)
2. **.NET SDK** (v7.0+)
3. **Node.js** (v18+)
4. **npm** or **yarn**

## 🚀 Quick Start

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
redis-cli ping  # Should return PONG
```

**Docker:**
```bash
docker run -d --name redis-stocktracker -p 6379:6379 redis:7-alpine
```

**Windows:**
Download from https://redis.io/download or use WSL2

### 2. Configure Environment Variables

**Frontend (.env):**
```env
# WebSocket Configuration
VITE_WS_URL=ws://localhost:8081
VITE_ENABLE_WEBSOCKET=true
VITE_FALLBACK_TO_POLLING=true
VITE_WS_RECONNECT_INTERVAL=1000
VITE_WS_MAX_RECONNECT_ATTEMPTS=10
VITE_WS_HEARTBEAT_INTERVAL=30000
VITE_WS_MESSAGE_QUEUE_SIZE=100

# Backend API
VITE_API_BASE_URL=http://localhost:5000
```

**WebSocket Server (backend-ws/.env):**
```env
WS_PORT=8081
API_BASE=http://localhost:5000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CHANNEL_UPDATES=market-data:updates
REDIS_CHANNEL_SUBSCRIPTIONS=market-data:subscriptions
REDIS_CHANNEL_CONTROL=market-data:control
```

**Backend (.NET) (appsettings.json):**
```json
{
  "ConnectionStrings": {
    "Redis": "localhost:6379"
  },
  "BackgroundServices": {
    "ActiveSymbolsUpdateIntervalMs": 2000
  }
}
```

### 3. Install Dependencies

**WebSocket Server:**
```bash
cd backend-ws
npm install
```

**Backend:**
```bash
cd backend/StockTracker.API
dotnet restore
```

**Frontend:**
```bash
npm install
```

### 4. Start Services

**Terminal 1 - Redis:**
```bash
redis-cli ping
# Should return PONG
```

**Terminal 2 - .NET Backend:**
```bash
cd backend/StockTracker.API
dotnet run
```

**Terminal 3 - WebSocket Server:**
```bash
cd backend-ws
npm start
```

**Terminal 4 - Frontend:**
```bash
npm run dev
```

## 🔍 Verify Setup

### 1. Check Redis
```bash
redis-cli
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> PSUBSCRIBE market-data:*
# Leave this running to monitor messages
```

### 2. Check WebSocket Server
```bash
curl http://localhost:8082/health
```

Expected response:
```json
{
  "status": "healthy",
  "connections": 0,
  "subscriptions": 0,
  "redisConnected": true,
  "timestamp": "2025-06-10T..."
}
```

### 3. Check .NET Backend
```bash
curl http://localhost:5000/health
```

### 4. Check Frontend
Open browser to `http://localhost:5173` and look for:
- Green "Live" indicator in top-right corner
- Real-time price updates
- Toast notifications on connection changes

## 📊 Architecture

```
External APIs (Alpha Vantage, Twelve Data)
    ↓
.NET Backend
├── Fetches data every 2 seconds for subscribed symbols
├── Publishes to Redis PubSub
└── Tracks active subscriptions
    ↓
Redis PubSub
├── market-data:updates channel
├── market-data:subscriptions channel
└── subscriptions:active set
    ↓
WebSocket Server (Node.js)
├── Subscribes to Redis PubSub
├── Manages client connections
├── Broadcasts to subscribed clients
└── Syncs subscriptions with Redis
    ↓
Frontend (React)
├── Connects via WebSocket
├── Subscribes to symbols
├── Falls back to polling if needed
└── Displays real-time updates
```

## 🎯 Features

### Real-Time Updates
- Sub-500ms latency from backend to frontend
- Automatic subscription management
- Message batching to prevent UI thrashing

### Connection Management
- Exponential backoff reconnection (1s, 2s, 4s, 8s, 16s, 30s max)
- Automatic fallback to 30-second polling
- Connection status indicator with tooltips

### Error Handling
- Circuit breaker in background service
- Graceful degradation
- Comprehensive logging

### Visual Feedback
- Green "Live" indicator for real-time connection
- Yellow "Delayed" for polling mode
- Red "Offline" for no connection
- Blue "Reconnecting" during reconnection
- Toast notifications for state changes
- Price change highlighting (green/red)

## 🧪 Testing

### Test WebSocket Connection

**JavaScript Console:**
```javascript
const ws = new WebSocket('ws://localhost:8081');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['RELIANCE', 'TCS']
  }));
};

ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};
```

### Monitor Redis PubSub

**Terminal:**
```bash
redis-cli
127.0.0.1:6379> PSUBSCRIBE market-data:*
# Watch for messages
```

### Check Active Subscriptions

```bash
redis-cli
127.0.0.1:6379> SMEMBERS subscriptions:active
1) "RELIANCE"
2) "TCS"
```

## 🐛 Troubleshooting

### WebSocket Won't Connect

1. **Check WebSocket server is running:**
   ```bash
   curl http://localhost:8082/health
   ```

2. **Check Redis is running:**
   ```bash
   redis-cli ping
   ```

3. **Check browser console for errors**

4. **Verify VITE_WS_URL in .env**

### No Real-Time Updates

1. **Check .NET backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check background service logs:**
   Look for "ActiveSymbolsBackgroundService started"

3. **Monitor Redis PubSub:**
   ```bash
   redis-cli
   127.0.0.1:6379> PSUBSCRIBE market-data:*
   ```

4. **Check subscriptions:**
   ```bash
   redis-cli SMEMBERS subscriptions:active
   ```

### High Latency

1. **Check Redis latency:**
   ```bash
   redis-cli --latency
   ```

2. **Check network conditions**

3. **Reduce update interval in appsettings.json:**
   ```json
   "ActiveSymbolsUpdateIntervalMs": 5000
   ```

### Memory Issues

1. **Check Redis memory:**
   ```bash
   redis-cli INFO memory
   ```

2. **Check WebSocket server memory:**
   ```bash
   curl http://localhost:8082/metrics
   ```

3. **Reduce message queue size in .env:**
   ```env
   VITE_WS_MESSAGE_QUEUE_SIZE=50
   ```

## 📈 Performance Tuning

### Backend (.NET)

**Adjust update interval:**
```json
{
  "BackgroundServices": {
    "ActiveSymbolsUpdateIntervalMs": 2000  // Lower = more frequent updates
  }
}
```

### WebSocket Server

**Adjust update interval:**
```env
UPDATE_INTERVAL=2000  # Milliseconds
```

### Frontend

**Adjust reconnection:**
```env
VITE_WS_RECONNECT_INTERVAL=1000  # Base interval
VITE_WS_MAX_RECONNECT_ATTEMPTS=10
```

**Adjust polling fallback:**
```typescript
const { data } = useRealTimeStock({
  symbol: 'RELIANCE',
  pollingInterval: 30000  // 30 seconds
});
```

## 🚀 Production Deployment

### Environment Variables

**Production Frontend:**
```env
VITE_WS_URL=wss://ws.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Production WebSocket Server:**
```env
WS_PORT=8081
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

### Security

1. **Use WSS (WebSocket Secure):**
   - Configure SSL/TLS certificates
   - Use wss:// protocol

2. **Secure Redis:**
   - Enable authentication
   - Use TLS for Redis connections
   - Restrict network access

3. **Rate Limiting:**
   - Implement per-user rate limits
   - Limit subscriptions per client

### Scaling

**Horizontal Scaling:**
- Deploy multiple WebSocket server instances
- Use load balancer with sticky sessions
- Redis PubSub handles cross-instance communication

**Vertical Scaling:**
- Increase server resources
- Optimize message serialization
- Use binary protocols (MessagePack)

## 📚 API Reference

### WebSocket Messages

**Subscribe:**
```json
{
  "action": "subscribe",
  "symbols": ["RELIANCE", "TCS"]
}
```

**Unsubscribe:**
```json
{
  "action": "unsubscribe",
  "symbols": ["RELIANCE"]
}
```

**Ping:**
```json
{
  "action": "ping"
}
```

### Server Responses

**Price Update:**
```json
{
  "type": "price_update",
  "symbol": "RELIANCE",
  "data": {
    "symbol": "RELIANCE",
    "price": 2450.50,
    "change": 12.30,
    "changePercent": 0.50,
    "volume": 1234567,
    "timestamp": "2025-06-10T10:30:00Z"
  },
  "timestamp": "2025-06-10T10:30:00.123Z"
}
```

## 🎓 Best Practices

1. **Always enable fallback to polling**
2. **Monitor connection status in UI**
3. **Log errors for debugging**
4. **Use environment variables for configuration**
5. **Test reconnection scenarios**
6. **Monitor Redis memory usage**
7. **Implement rate limiting in production**
8. **Use WSS in production**

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Check server logs
3. Monitor Redis PubSub
4. Review this guide
5. Check WEBSOCKET_PROGRESS_SUMMARY.md

## 🎉 Success!

If you see:
- ✅ Green "Live" indicator
- ✅ Real-time price updates
- ✅ Toast notifications on connection changes
- ✅ Price highlighting on changes

**Congratulations! Your real-time WebSocket system is working!** 🚀
