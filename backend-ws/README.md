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

```bash
# Test WebSocket connection
node test-client.js
```

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
