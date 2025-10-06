// WebSocket Server for Real-Time Stock Data
// Provides low-latency price updates to frontend

const WebSocket = require('ws');
const axios = require('axios');

// Configuration
const WS_PORT = process.env.WS_PORT || 8081;
const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL) || 2000; // 2 seconds

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: WS_PORT,
  perMessageDeflate: false
});

// Store active subscriptions: Map<symbol, Set<WebSocket>>
const subscriptions = new Map();

// Store latest prices to detect changes
const latestPrices = new Map();

console.log(`🚀 WebSocket server starting on port ${WS_PORT}...`);

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ Client connected from ${clientIp}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Stock Tracker WebSocket',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.action) {
        case 'subscribe':
          handleSubscribe(ws, data.symbols);
          break;
          
        case 'unsubscribe':
          handleUnsubscribe(ws, data.symbols);
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
          
        default:
          console.warn(`Unknown action: ${data.action}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected from ${clientIp}`);
    // Clean up all subscriptions for this client
    subscriptions.forEach((clients, symbol) => {
      clients.delete(ws);
      if (clients.size === 0) {
        subscriptions.delete(symbol);
        console.log(`📊 No more subscribers for ${symbol}, removed from tracking`);
      }
    });
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleSubscribe(ws, symbols) {
  if (!Array.isArray(symbols)) {
    symbols = [symbols];
  }

  symbols.forEach(symbol => {
    if (!subscriptions.has(symbol)) {
      subscriptions.set(symbol, new Set());
      console.log(`📊 New symbol tracked: ${symbol}`);
    }
    subscriptions.get(symbol).add(ws);
  });

  console.log(`✅ Client subscribed to: ${symbols.join(', ')}`);
  
  // Send immediate update for subscribed symbols
  symbols.forEach(async (symbol) => {
    try {
      const data = await fetchStockData(symbol);
      if (data) {
        ws.send(JSON.stringify({
          type: 'price_update',
          symbol,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error(`Error fetching initial data for ${symbol}:`, error.message);
    }
  });
}

function handleUnsubscribe(ws, symbols) {
  if (!Array.isArray(symbols)) {
    symbols = [symbols];
  }

  symbols.forEach(symbol => {
    const clients = subscriptions.get(symbol);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        subscriptions.delete(symbol);
        console.log(`📊 Removed ${symbol} from tracking (no subscribers)`);
      }
    }
  });

  console.log(`✅ Client unsubscribed from: ${symbols.join(', ')}`);
}

async function fetchStockData(symbol) {
  try {
    const response = await axios.get(
      `${API_BASE}/api/market-data/quote/${symbol}`,
      { timeout: 5000 }
    );

    if (response.data && response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Cannot connect to API at ${API_BASE}`);
    } else {
      console.error(`Error fetching ${symbol}:`, error.message);
    }
    return null;
  }
}

function broadcastUpdate(symbol, data) {
  const clients = subscriptions.get(symbol);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({
    type: 'price_update',
    symbol,
    data,
    timestamp: new Date().toISOString()
  });

  let successCount = 0;
  let failCount = 0;

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        successCount++;
      } catch (error) {
        console.error(`Error sending to client:`, error.message);
        failCount++;
      }
    } else {
      // Remove dead connections
      clients.delete(client);
      failCount++;
    }
  });

  if (successCount > 0) {
    console.log(`📤 Broadcast ${symbol} to ${successCount} clients (${failCount} failed)`);
  }
}

// Main update loop
async function updateLoop() {
  if (subscriptions.size === 0) {
    // No active subscriptions, skip this cycle
    return;
  }

  console.log(`🔄 Updating ${subscriptions.size} symbols...`);

  for (const [symbol, clients] of subscriptions.entries()) {
    if (clients.size === 0) continue;

    try {
      const data = await fetchStockData(symbol);
      
      if (data) {
        // Check if price changed
        const lastPrice = latestPrices.get(symbol);
        const currentPrice = data.price;

        if (!lastPrice || lastPrice !== currentPrice) {
          latestPrices.set(symbol, currentPrice);
          broadcastUpdate(symbol, data);
        }
      }
    } catch (error) {
      console.error(`Error in update loop for ${symbol}:`, error.message);
    }

    // Small delay between symbols to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Start update loop
setInterval(updateLoop, UPDATE_INTERVAL);

// Health check endpoint (if needed)
const http = require('http');
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connections: wss.clients.size,
      subscriptions: subscriptions.size,
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(WS_PORT + 1, () => {
  console.log(`🏥 Health check available at http://localhost:${WS_PORT + 1}/health`);
});

console.log(`✅ WebSocket server running on ws://localhost:${WS_PORT}`);
console.log(`📊 Fetching data from: ${API_BASE}`);
console.log(`⏱️  Update interval: ${UPDATE_INTERVAL}ms`);
console.log(`🎯 Ready to accept connections!`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
