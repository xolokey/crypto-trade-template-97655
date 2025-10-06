# Production Deployment Design

## Overview

This design document outlines the architecture and implementation strategy for deploying the Stock Tracker application to production with full real-time capabilities. The deployment uses a multi-service architecture with the frontend on Vercel, backend services on Railway, and Redis on Upstash.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION STACK                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────▶│  Backend API │────────▶│    Redis     │
│   (Vercel)   │         │  (Railway)   │         │  (Upstash)   │
│              │         │              │         │              │
│  React/Vite  │         │  .NET Core   │         │   Pub/Sub    │
└──────┬───────┘         └──────────────┘         └──────┬───────┘
       │                                                   │
       │                 ┌──────────────┐                 │
       └────────────────▶│  WebSocket   │◀────────────────┘
                         │   Server     │
                         │  (Railway)   │
                         │              │
                         │   Node.js    │
                         └──────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │  Gemini AI   │  │  Market Data │
│  (Database)  │  │    (API)     │  │  APIs (NSE)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Service Responsibilities

**Frontend (Vercel)**
- Serves static React application
- Handles client-side routing
- Manages WebSocket connections
- Displays real-time data
- Communicates with backend API

**Backend API (Railway)**
- Fetches market data from external APIs
- Manages caching with Redis
- Publishes updates to Redis pub/sub
- Handles business logic
- Provides REST endpoints

**WebSocket Server (Railway)**
- Maintains persistent connections with clients
- Subscribes to Redis pub/sub channels
- Broadcasts real-time updates to clients
- Manages client subscriptions
- Handles connection lifecycle

**Redis (Upstash)**
- Provides pub/sub messaging
- Caches market data
- Stores active subscriptions
- Enables service communication

## Components and Interfaces

### 1. Frontend Configuration

**Environment Variables:**
```typescript
// Production environment variables
VITE_SUPABASE_URL=https://msesvmlvhrhdipfbhvub.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<key>
VITE_SUPABASE_PROJECT_ID=msesvmlvhrhdipfbhvub
VITE_GEMINI_API_KEY=<key>
VITE_ALPHA_VANTAGE_API_KEY=<key>
VITE_TWELVE_DATA_API_KEY=<key>
VITE_API_BASE_URL=https://stock-tracker-api.railway.app
VITE_WS_URL=wss://stock-tracker-ws.railway.app
VITE_ENABLE_WEBSOCKET=true
VITE_FALLBACK_TO_POLLING=true
VITE_APP_ENV=production
```

**Build Configuration:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18.x

### 2. Backend API Configuration

**Deployment Platform:** Railway

**Environment Variables:**
```bash
# Database
ConnectionStrings__DefaultConnection=<postgres-url>
ConnectionStrings__Redis=<redis-url>

# API Keys
AlphaVantage__ApiKey=<key>
TwelveData__ApiKey=<key>
NSE__BaseUrl=https://www.nseindia.com

# CORS
Cors__AllowedOrigins__0=https://your-app.vercel.app
Cors__AllowedOrigins__1=http://localhost:8080

# Redis Channels
Redis__ChannelUpdates=market-data:updates
Redis__ChannelSubscriptions=market-data:subscriptions
Redis__ChannelControl=market-data:control

# Logging
Serilog__MinimumLevel__Default=Information
Serilog__MinimumLevel__Override__Microsoft=Warning

# Application
ASPNETCORE_ENVIRONMENT=Production
```

**Build Configuration:**
- Runtime: .NET 8.0
- Build command: `dotnet publish -c Release -o out`
- Start command: `dotnet out/StockTracker.API.dll`
- Port: 5000 (Railway auto-assigns)

**Health Check Endpoint:**
- URL: `/health`
- Returns: `{ "status": "healthy", "timestamp": "..." }`

### 3. WebSocket Server Configuration

**Deployment Platform:** Railway

**Environment Variables:**
```bash
# Server
WS_PORT=8081
NODE_ENV=production

# Backend API
API_BASE=https://stock-tracker-api.railway.app

# Redis
REDIS_HOST=<upstash-host>
REDIS_PORT=<upstash-port>
REDIS_PASSWORD=<upstash-password>
REDIS_TLS=true

# Redis Channels
REDIS_CHANNEL_UPDATES=market-data:updates
REDIS_CHANNEL_SUBSCRIPTIONS=market-data:subscriptions
REDIS_CHANNEL_CONTROL=market-data:control

# CORS
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:8080
```

**Build Configuration:**
- Runtime: Node.js 18.x
- Build command: `npm install`
- Start command: `node server.js`
- Port: 8081 (Railway auto-assigns)

**Health Check Endpoint:**
- URL: `/health` (port 8082)
- Returns: `{ "status": "healthy", "connections": 0, "subscriptions": 0 }`

### 4. Redis Configuration

**Platform:** Upstash Redis

**Configuration:**
- Region: Choose closest to Railway deployment
- TLS: Enabled
- Eviction policy: allkeys-lru
- Max memory: 100MB (free tier)

**Channels:**
- `market-data:updates` - Price updates
- `market-data:subscriptions` - Subscription management
- `market-data:control` - Control messages

**Keys:**
- `subscriptions:active` - Set of active symbols
- `subscriptions:count:{symbol}` - Subscription count per symbol
- `cache:quote:{symbol}` - Cached stock quotes
- `cache:indices` - Cached market indices

## Data Models

### WebSocket Message Format

**Price Update:**
```typescript
{
  type: 'price_update',
  symbol: 'RELIANCE',
  data: {
    symbol: 'RELIANCE',
    price: 2450.50,
    change: 12.30,
    changePercent: 0.50,
    volume: 1234567,
    timestamp: '2025-06-10T10:30:00Z'
  },
  timestamp: '2025-06-10T10:30:00Z'
}
```

**Subscription Request:**
```typescript
{
  action: 'subscribe',
  symbols: ['RELIANCE', 'TCS', 'INFY']
}
```

**Connection Status:**
```typescript
{
  type: 'connected',
  message: 'Connected to Stock Tracker WebSocket',
  clientId: 'client_1234567890_0',
  timestamp: '2025-06-10T10:30:00Z'
}
```

### Redis Pub/Sub Message Format

**Update Message:**
```json
{
  "type": "price_update",
  "symbol": "RELIANCE",
  "data": {
    "symbol": "RELIANCE",
    "price": 2450.50,
    "change": 12.30,
    "changePercent": 0.50,
    "volume": 1234567
  },
  "timestamp": "2025-06-10T10:30:00Z"
}
```

**Control Message:**
```json
{
  "action": "pause",
  "data": {
    "reason": "maintenance"
  }
}
```

## Error Handling

### Frontend Error Handling

**WebSocket Connection Failures:**
1. Attempt reconnection with exponential backoff
2. Fall back to polling after 10 failed attempts
3. Display connection status to user
4. Continue showing cached data

**API Request Failures:**
1. Retry with exponential backoff (3 attempts)
2. Show error toast to user
3. Fall back to simulated data if available
4. Log error to console in development

### Backend Error Handling

**External API Failures:**
1. Return cached data if available
2. Log error with context
3. Return 503 Service Unavailable
4. Include retry-after header

**Redis Connection Failures:**
1. Continue operation without caching
2. Log warning
3. Attempt reconnection every 5 seconds
4. Disable pub/sub features temporarily

### WebSocket Server Error Handling

**Client Connection Errors:**
1. Log error with client ID
2. Clean up subscriptions
3. Close connection gracefully
4. Send error message to client if possible

**Redis Pub/Sub Errors:**
1. Attempt reconnection
2. Buffer messages temporarily
3. Log error
4. Notify connected clients of degraded service

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- WebSocket service connection logic
- Real-time data hooks
- Error handling and fallback logic
- Component rendering with real-time data

**Integration Tests:**
- WebSocket connection and subscription flow
- API communication
- Error recovery scenarios
- Fallback to polling

**E2E Tests:**
- Complete user flow with real-time updates
- Connection loss and recovery
- Multiple simultaneous connections
- Cross-browser compatibility

### Backend Testing

**Unit Tests:**
- Market data service logic
- Redis pub/sub publishing
- Caching logic
- Input validation

**Integration Tests:**
- External API integration
- Redis connection and pub/sub
- WebSocket notification service
- Database operations

**Load Tests:**
- 100 concurrent API requests
- 1000 simultaneous WebSocket connections
- Redis pub/sub throughput
- Cache performance under load

### Deployment Testing

**Smoke Tests:**
1. Frontend loads successfully
2. Backend API health check passes
3. WebSocket server accepts connections
4. Redis pub/sub works
5. End-to-end data flow works

**Performance Tests:**
1. Page load time < 3 seconds
2. API response time < 2 seconds
3. WebSocket latency < 100ms
4. Redis pub/sub latency < 50ms

## Security Considerations

### API Security

**Authentication:**
- Supabase JWT tokens for user authentication
- API key validation for external services
- Rate limiting on public endpoints

**CORS Configuration:**
- Whitelist specific origins
- Allow credentials for authenticated requests
- Validate origin on WebSocket connections

**Security Headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### Environment Security

**Secret Management:**
- Store secrets in platform environment variables
- Never commit secrets to repository
- Rotate API keys regularly
- Use different keys for production and development

**Network Security:**
- Enforce HTTPS/WSS in production
- Use TLS for Redis connections
- Validate SSL certificates
- Implement request signing for sensitive operations

## Deployment Workflow

### 1. Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Rollback plan prepared

### 2. Deployment Order

1. **Deploy Redis (Upstash)**
   - Create database
   - Note connection details
   - Test connectivity

2. **Deploy Backend API (Railway)**
   - Configure environment variables
   - Deploy from GitHub
   - Verify health check
   - Test API endpoints

3. **Deploy WebSocket Server (Railway)**
   - Configure environment variables
   - Deploy from GitHub
   - Verify health check
   - Test WebSocket connection

4. **Deploy Frontend (Vercel)**
   - Configure environment variables
   - Deploy from GitHub
   - Verify build success
   - Test application

### 3. Post-Deployment Verification

1. Check all health endpoints
2. Test WebSocket connection
3. Verify real-time updates
4. Test error scenarios
5. Monitor logs for errors
6. Check performance metrics

## Monitoring and Maintenance

### Monitoring

**Metrics to Track:**
- API response times
- WebSocket connection count
- Redis memory usage
- Error rates
- Request throughput

**Alerting:**
- Health check failures
- High error rates (> 5%)
- High latency (> 5 seconds)
- Redis memory > 80%
- WebSocket connection drops

### Maintenance Tasks

**Daily:**
- Check error logs
- Monitor performance metrics
- Verify all services healthy

**Weekly:**
- Review and rotate logs
- Check for security updates
- Analyze usage patterns

**Monthly:**
- Update dependencies
- Review and optimize costs
- Performance optimization
- Security audit

## Cost Estimation

### Free Tier Usage

**Vercel:**
- Bandwidth: 100GB/month
- Build time: 6000 minutes/month
- Cost: $0

**Railway:**
- $5 credit/month
- Backend API: ~$3/month
- WebSocket Server: ~$2/month
- Total: $5/month (covered by credit)

**Upstash Redis:**
- 10,000 commands/day
- 256MB storage
- Cost: $0

**Total Monthly Cost: $0** (within free tiers)

### Scaling Costs

**If exceeding free tiers:**
- Railway: $0.000463/GB-hour (~$10-20/month)
- Upstash: $0.20/100K commands (~$5-10/month)
- Vercel: $20/month for Pro plan

**Estimated cost at scale: $35-50/month**

## Rollback Strategy

### Immediate Rollback

**Frontend (Vercel):**
1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"
4. Verify rollback successful

**Backend Services (Railway):**
1. Go to Railway dashboard
2. Select service
3. Redeploy previous version
4. Verify health check

### Database Rollback

**If migrations fail:**
1. Run rollback migration scripts
2. Restore from Supabase backup
3. Verify data integrity
4. Redeploy services

### Communication Plan

**During rollback:**
1. Post status update
2. Notify users of temporary issues
3. Document root cause
4. Plan fix and redeployment
