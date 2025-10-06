# 🔴 Real-Time Data Implementation - Complete Guide

## 🎯 Critical Issue Identified

**Current State**: Using simulated data with polling (setInterval)
**Required**: True real-time WebSocket integration with actual market data

## 📊 Implementation Plan

### Phase 1: Connect Frontend to Backend APIs ✅
Replace all mock data calls with actual backend API calls

### Phase 2: Implement WebSocket Real-Time Updates ✅
True low-latency price updates via WebSocket

### Phase 3: Remove All Simulated Data ✅
Ensure 100% real data from APIs

---

## 🚀 Phase 1: Backend API Integration

### Step 1: Update Market Data Service

Replace `src/services/marketDataService.ts` to use backend:

```typescript
// Use backend API (Vercel or .NET)
const API_BASE = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE_URL || ''
  : 'http://localhost:5000'; // .NET backend or http://localhost:8080 for Vercel

// All calls now go through backend - NO MORE CORS!
```

### Step 2: Update All Components

Components to update:
1. `LiveMarketIndices.tsx` - Use real API data
2. `LiveStockTicker.tsx` - Use real API data
3. `EnhancedStockCard.tsx` - Use real API data
4. `useRealTimePrice.ts` - Replace with WebSocket

---

## 🔴 Phase 2: WebSocket Implementation

### Backend WebSocket Server

#### Option A: .NET WebSocket (Recommended)

Already implemented in `backend/StockTracker.API/Program.cs`:

```csharp
app.UseWebSockets();
app.Map("/ws/market-data", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        await HandleWebSocket(webSocket);
    }
});
```

#### Option B: Node.js WebSocket Server

Create `backend-ws/server.js`:

```javascript
const WebSocket = require('ws');
const axios = require('axios');

const wss = new WebSocket.Server({ port: 8081 });

// Store active subscriptions
const subscriptions = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    
    if (data.action === 'subscribe') {
      // Add symbols to subscription
      data.symbols.forEach(symbol => {
        if (!subscriptions.has(symbol)) {
          subscriptions.set(symbol, new Set());
        }
        subscriptions.get(symbol).add(ws);
      });
    }
    
    if (data.action === 'unsubscribe') {
      // Remove symbols from subscription
      data.symbols.forEach(symbol => {
        subscriptions.get(symbol)?.delete(ws);
      });
    }
  });
  
  ws.on('close', () => {
    // Clean up subscriptions
    subscriptions.forEach((clients, symbol) => {
      clients.delete(ws);
    });
  });
});

// Fetch and broadcast real-time data
setInterval(async () => {
  for (const [symbol, clients] of subscriptions.entries()) {
    if (clients.size === 0) continue;
    
    try {
      // Fetch real data from your backend API
      const response = await axios.get(
        `http://localhost:5000/api/market-data/quote/${symbol}`
      );
      
      const data = {
        type: 'price_update',
        symbol,
        data: response.data.data,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to all subscribed clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
    }
  }
}, 2000); // Update every 2 seconds

console.log('WebSocket server running on ws://localhost:8081');
```

### Frontend WebSocket Integration

Update `src/hooks/useRealTimePrice.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { getWebSocketService } from '@/services/websocketService';

export function useRealTimePrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [changePercent, setChangePercent] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<any>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const wsUrl = import.meta.env.PROD 
      ? 'wss://your-api.com/ws/market-data'
      : 'ws://localhost:8081';
    
    try {
      wsRef.current = getWebSocketService(wsUrl);
      
      // Connect
      wsRef.current.connect();
      
      // Subscribe to symbol
      wsRef.current.subscribe(symbol);
      
      // Handle messages
      const unsubscribe = wsRef.current.onMessage((data: any) => {
        if (data.type === 'price_update' && data.symbol === symbol) {
          setPrice(data.data.price);
          setChange(data.data.change);
          setChangePercent(data.data.changePercent);
          setLastUpdate(new Date(data.timestamp));
          setIsConnected(true);
        }
      });
      
      return () => {
        wsRef.current?.unsubscribe(symbol);
        unsubscribe();
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    }
  }, [symbol]);

  return {
    price,
    change,
    changePercent,
    lastUpdate,
    isConnected,
    isRealTime: true
  };
}
```

---

## 🔄 Phase 3: Update All Components

### 1. Update LiveMarketIndices

Replace simulated data with real API calls:

```typescript
import { useEffect, useState } from 'react';
import { marketDataService } from '@/services/marketDataService';
import { getWebSocketService } from '@/services/websocketService';

const LiveMarketIndices = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initial fetch from API
    const fetchIndices = async () => {
      try {
        const data = await marketDataService.getNSEData('index');
        setIndices(data);
      } catch (error) {
        console.error('Error fetching indices:', error);
      }
    };

    fetchIndices();

    // Set up WebSocket for real-time updates
    const ws = getWebSocketService('ws://localhost:8081');
    ws.connect();
    ws.subscribe(['NIFTY50', 'SENSEX', 'BANKNIFTY']);

    const unsubscribe = ws.onMessage((data) => {
      if (data.type === 'index_update') {
        setIndices(prev => prev.map(index => 
          index.name === data.symbol ? { ...index, ...data.data } : index
        ));
      }
    });

    return () => {
      ws.unsubscribe(['NIFTY50', 'SENSEX', 'BANKNIFTY']);
      unsubscribe();
    };
  }, []);

  // Rest of component...
};
```

### 2. Update LiveStockTicker

```typescript
import { useMultipleStockQuotes } from '@/hooks/useMarketData';

const LiveStockTicker = () => {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', /* ... */];
  
  // Use real API data with polling
  const { data: stocks, loading } = useMultipleStockQuotes(symbols, 5000);

  if (loading) return <Skeleton />;

  return (
    <div className="ticker">
      {stocks?.map(stock => (
        <div key={stock.symbol}>
          {stock.symbol}: ₹{stock.price} ({stock.changePercent}%)
        </div>
      ))}
    </div>
  );
};
```

### 3. Update EnhancedStockCard

```typescript
import { useRealTimePrice } from '@/hooks/useRealTimePrice';

function EnhancedStockCard({ symbol }: { symbol: string }) {
  // Now uses WebSocket for true real-time updates
  const { price, changePercent, isConnected, isRealTime } = useRealTimePrice(symbol);

  return (
    <Card>
      <div className="flex items-center gap-2">
        {isRealTime && isConnected && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
        <h3>{symbol}</h3>
      </div>
      <p className="text-2xl">₹{price?.toFixed(2)}</p>
      <p className={changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
        {changePercent >= 0 ? '+' : ''}{changePercent?.toFixed(2)}%
      </p>
      <p className="text-xs text-muted-foreground">
        {isRealTime ? 'Live' : 'Delayed'} • {isConnected ? 'Connected' : 'Disconnected'}
      </p>
    </Card>
  );
}
```

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:5000

# WebSocket URL
VITE_WS_URL=ws://localhost:8081

# For production
# VITE_API_BASE_URL=https://your-api.azurewebsites.net
# VITE_WS_URL=wss://your-api.azurewebsites.net/ws/market-data
```

### Update marketDataService.ts

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:5000');

const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.PROD ? 'wss://your-api.com/ws' : 'ws://localhost:8081');
```

---

## 📊 Data Flow

### Before (Simulated)
```
Frontend → setInterval → Mock Data → UI
```

### After (Real-Time)
```
Frontend → WebSocket → Backend API → External APIs → Real Data → UI
         ↓
    HTTP REST API (fallback)
```

---

## 🚀 Deployment

### WebSocket Server Deployment

#### Option 1: Deploy with .NET API
Already included in .NET backend - just deploy together

#### Option 2: Separate Node.js WebSocket Server

**Heroku**:
```bash
heroku create stocktracker-ws
git push heroku main
```

**AWS**:
```bash
# Use AWS API Gateway WebSocket API
# Or deploy to EC2/ECS
```

**Azure**:
```bash
# Use Azure SignalR Service
# Or deploy to App Service
```

---

## ✅ Testing Real-Time Data

### 1. Test Backend API
```bash
curl http://localhost:5000/api/market-data/quote/RELIANCE
```

### 2. Test WebSocket Connection
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
  console.log('Received:', JSON.parse(event.data));
};
```

### 3. Verify Real Data
- Check that prices match actual market prices
- Verify updates happen in real-time (< 1 second latency)
- Confirm no simulated/mock data is being used

---

## 🎯 Success Criteria

- [ ] All components use backend API (no direct external API calls)
- [ ] WebSocket connection established and stable
- [ ] Real-time price updates (< 1 second latency)
- [ ] No simulated/mock data in production
- [ ] Fallback to HTTP polling if WebSocket fails
- [ ] Visual indicator showing real-time status
- [ ] Prices match actual market data

---

## 📚 Next Steps

1. **Implement WebSocket server** (Node.js or use .NET)
2. **Update all components** to use real APIs
3. **Remove mock data** from codebase
4. **Test thoroughly** with real market data
5. **Deploy** WebSocket server
6. **Monitor** real-time performance

See implementation files in next section!
