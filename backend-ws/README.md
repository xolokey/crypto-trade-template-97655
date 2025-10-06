# Stock Tracker WebSocket Server

Real-time stock data streaming via WebSocket.

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Development with auto-reload
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
WS_PORT=8081
API_BASE=http://localhost:5000
UPDATE_INTERVAL=2000
```

## Testing

### Basic Connection Test

```bash
# Test WebSocket connection
node test-client.js
```

### Load Testing

Comprehensive load testing to verify performance requirements:

```bash
# Check if environment is ready for testing
npm run check-env

# Run standard load test (100 clients, 60 seconds)
npm run load-test

# Quick test (50 clients, 30 seconds)
npm run load-test:quick

# Stress test (200 clients, 60 seconds)
npm run load-test:stress

# Endurance test (100 clients, 5 minutes)
npm run load-test:endurance
```

**Requirements Verified:**
- ✅ Message delivery rate > 99%
- ✅ P95 latency < 500ms
- ✅ 100 concurrent connections
- ✅ Memory stability

See [LOAD_TESTING.md](./LOAD_TESTING.md) for detailed documentation.

## Deployment

### Heroku

```bash
heroku create stocktracker-ws
git push heroku main
```

### Docker

```bash
docker build -t stocktracker-ws .
docker run -p 8081:8081 stocktracker-ws
```

## Health Check

```
http://localhost:8082/health
```
