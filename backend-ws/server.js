// WebSocket Server for Real-Time Stock Data with Redis PubSub
// Provides low-latency price updates to frontend

require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const Redis = require('ioredis');

// Configuration
const WS_PORT = process.env.WS_PORT || 8081;
const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Redis PubSub Channels
const CHANNEL_UPDATES = process.env.REDIS_CHANNEL_UPDATES || 'market-data:updates';
const CHANNEL_SUBSCRIPTIONS = process.env.REDIS_CHANNEL_SUBSCRIPTIONS || 'market-data:subscriptions';
const CHANNEL_CONTROL = process.env.REDIS_CHANNEL_CONTROL || 'market-data:control';

// Redis Keys
const KEY_ACTIVE_SUBSCRIPTIONS = 'subscriptions:active';

console.log(`🚀 WebSocket server starting on port ${WS_PORT}...`);

// Create Redis clients (separate for pub/sub and commands)
const redisSubscriber = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

const redisPublisher = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined
});

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: WS_PORT,
  perMessageDeflate: false
});

// Store active subscriptions: Map<symbol, Set<WebSocket>>
const subscriptions = new Map();

// Store client subscriptions: Map<WebSocket, Set<symbol>>
const clientSubscriptions = new Map();

// Store last message timestamp per symbol for deduplication
const lastMessageTimestamp = new Map();

// Generate unique client IDs
let clientIdCounter = 0;
function generateClientId() {
  return `client_${Date.now()}_${clientIdCounter++}`;
}

// Redis connection handlers
redisSubscriber.on('connect', () => {
  console.log('✅ Redis Subscriber connected');
});

redisSubscriber.on('error', (err) => {
  console.error('❌ Redis Subscriber error:', err);
});

redisPublisher.on('error', (err) => {
  console.error('❌ Redis Publisher error:', err);
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client error:', err);
});

// Subscribe to Redis PubSub channels
redisSubscriber.subscribe(CHANNEL_UPDATES, CHANNEL_CONTROL, (err, count) => {
  if (err) {
    console.error('❌ Failed to subscribe to Redis channels:', err);
  } else {
    console.log(`✅ Subscribed to ${count} Redis channels`);
  }
});

// Handle messages from Redis PubSub
redisSubscriber.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);
    
    if (channel === CHANNEL_UPDATES) {
      handleRedisUpdate(data);
    } else if (channel === CHANNEL_CONTROL) {
      handleRedisControl(data);
    }
  } catch (error) {
    console.error('Error parsing Redis message:', error);
  }
});

// Handle price updates from Redis
function handleRedisUpdate(data) {
  const { type, symbol, data: quoteData, timestamp } = data;
  
  if (type === 'price_update' && symbol && quoteData) {
    // Deduplication: check if we've seen this message recently
    const lastTimestamp = lastMessageTimestamp.get(symbol);
    const currentTimestamp = new Date(timestamp).getTime();
    
    if (lastTimestamp && (currentTimestamp - lastTimestamp) < 100) {
      console.log(`🔄 Deduplicated message for ${symbol}`);
      return;
    }
    
    lastMessageTimestamp.set(symbol, currentTimestamp);
    
    // Broadcast to subscribed clients
    broadcastUpdate(symbol, quoteData, timestamp);
  } else if (type === 'batch_update' && data.updates) {
    // Handle batch updates
    data.updates.forEach(update => {
      if (update.symbol && update.data) {
        broadcastUpdate(update.symbol, update.data, timestamp);
      }
    });
  } else if (type === 'error') {
    // Handle error messages
    broadcastError(symbol, data.error);
  }
}

// Handle control messages from Redis
function handleRedisControl(data) {
  const { action, data: controlData } = data;
  
  console.log(`🎛️  Control message received: ${action}`);
  
  if (action === 'pause') {
    // Pause updates (could implement pause logic)
    console.log('⏸️  Updates paused');
  } else if (action === 'resume') {
    // Resume updates
    console.log('▶️  Updates resumed');
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const clientId = generateClientId();
  ws.clientId = clientId;
  
  console.log(`✅ Client connected: ${clientId} from ${clientIp}`);
  
  // Initialize client subscriptions
  clientSubscriptions.set(ws, new Set());
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Stock Tracker WebSocket',
    clientId: clientId,
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
          ws.send(JSON.stringify({ 
            type: 'pong', 
            timestamp: new Date().toISOString() 
          }));
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
    console.log(`🔌 Client disconnected: ${clientId}`);
    handleClientDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
  });
});

// Handle client subscription
async function handleSubscribe(ws, symbols) {
  if (!Array.isArray(symbols)) {
    symbols = [symbols];
  }

  const clientSubs = clientSubscriptions.get(ws);
  
  symbols.forEach(symbol => {
    // Add to local subscriptions
    if (!subscriptions.has(symbol)) {
      subscriptions.set(symbol, new Set());
      console.log(`📊 New symbol tracked: ${symbol}`);
    }
    subscriptions.get(symbol).add(ws);
    clientSubs.add(symbol);
  });

  // Sync with Redis
  try {
    await redisClient.sadd(KEY_ACTIVE_SUBSCRIPTIONS, ...symbols);
    
    // Increment subscription counts
    for (const symbol of symbols) {
      await redisClient.incr(`subscriptions:count:${symbol}`);
    }
    
    console.log(`✅ Client ${ws.clientId} subscribed to: ${symbols.join(', ')}`);
  } catch (error) {
    console.error('Error syncing subscriptions to Redis:', error);
  }
  
  // Send immediate update for subscribed symbols
  symbols.forEach(async (symbol) => {
    try {
      const data = await fetchStockData(symbol);
      if (data && ws.readyState === WebSocket.OPEN) {
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

// Handle client unsubscription
async function handleUnsubscribe(ws, symbols) {
  if (!Array.isArray(symbols)) {
    symbols = [symbols];
  }

  const clientSubs = clientSubscriptions.get(ws);

  symbols.forEach(symbol => {
    const clients = subscriptions.get(symbol);
    if (clients) {
      clients.delete(ws);
      clientSubs.delete(symbol);
      
      if (clients.size === 0) {
        subscriptions.delete(symbol);
        console.log(`📊 Removed ${symbol} from tracking (no subscribers)`);
      }
    }
  });

  // Sync with Redis
  try {
    for (const symbol of symbols) {
      const count = await redisClient.decr(`subscriptions:count:${symbol}`);
      
      // Remove from active subscriptions if count reaches zero
      if (count <= 0) {
        await redisClient.srem(KEY_ACTIVE_SUBSCRIPTIONS, symbol);
        await redisClient.del(`subscriptions:count:${symbol}`);
      }
    }
    
    console.log(`✅ Client ${ws.clientId} unsubscribed from: ${symbols.join(', ')}`);
  } catch (error) {
    console.error('Error syncing unsubscriptions to Redis:', error);
  }
}

// Handle client disconnect
async function handleClientDisconnect(ws) {
  const clientSubs = clientSubscriptions.get(ws);
  
  if (clientSubs && clientSubs.size > 0) {
    const symbols = Array.from(clientSubs);
    await handleUnsubscribe(ws, symbols);
  }
  
  clientSubscriptions.delete(ws);
}

// Fetch stock data from API
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

// Broadcast update to subscribed clients
function broadcastUpdate(symbol, data, timestamp) {
  const clients = subscriptions.get(symbol);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({
    type: 'price_update',
    symbol,
    data,
    timestamp: timestamp || new Date().toISOString()
  });

  let successCount = 0;
  let failCount = 0;

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        successCount++;
      } catch (error) {
        console.error(`Error sending to client ${client.clientId}:`, error.message);
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

// Broadcast error to subscribed clients
function broadcastError(symbol, errorMessage) {
  const clients = subscriptions.get(symbol);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({
    type: 'error',
    symbol,
    error: errorMessage,
    timestamp: new Date().toISOString()
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error(`Error sending error to client:`, error.message);
      }
    }
  });
}

// Health check endpoint
const http = require('http');
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connections: wss.clients.size,
      subscriptions: subscriptions.size,
      redisConnected: redisClient.status === 'ready',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connections: wss.clients.size,
      subscriptions: subscriptions.size,
      uniqueSymbols: subscriptions.size,
      redisStatus: redisClient.status,
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(WS_PORT + 1, () => {
  console.log(`🏥 Health check available at http://localhost:${WS_PORT + 1}/health`);
  console.log(`📊 Metrics available at http://localhost:${WS_PORT + 1}/metrics`);
});

console.log(`✅ WebSocket server running on ws://localhost:${WS_PORT}`);
console.log(`📊 Backend API: ${API_BASE}`);
console.log(`🔴 Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`📡 Listening for updates on Redis channel: ${CHANNEL_UPDATES}`);
console.log(`🎯 Ready to accept connections!`);

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close Redis connections
  await redisSubscriber.quit();
  await redisPublisher.quit();
  await redisClient.quit();
  
  console.log('Redis connections closed');
  process.exit(0);
}
