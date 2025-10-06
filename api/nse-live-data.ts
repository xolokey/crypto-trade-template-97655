// Vercel Serverless Function for NSE Live Data
// This runs on the server, avoiding CORS issues

import type { VercelRequest, VercelResponse } from '@vercel/node';

// NSE India API endpoints (unofficial but working)
const NSE_BASE_URL = 'https://www.nseindia.com/api';

// Headers required by NSE
const NSE_HEADERS = {
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive'
};

// Fetch Nifty 50 index data
async function fetchNiftyData() {
  try {
    const response = await fetch(`${NSE_BASE_URL}/equity-stockIndices?index=NIFTY%2050`, {
      headers: NSE_HEADERS
    });
    
    if (!response.ok) {
      throw new Error(`NSE API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const nifty = data.data[0];
      return {
        name: 'Nifty 50',
        value: parseFloat(nifty.last),
        change: parseFloat(nifty.change),
        changePercent: parseFloat(nifty.pChange),
        high: parseFloat(nifty.high || nifty.last),
        low: parseFloat(nifty.low || nifty.last),
        open: parseFloat(nifty.open || nifty.last),
        previousClose: parseFloat(nifty.previousClose || nifty.last)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Nifty data:', error);
    return null;
  }
}

// Fetch stock quote
async function fetchStockQuote(symbol: string) {
  try {
    const response = await fetch(`${NSE_BASE_URL}/quote-equity?symbol=${symbol}`, {
      headers: NSE_HEADERS
    });
    
    if (!response.ok) {
      throw new Error(`NSE API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.priceInfo) {
      const priceInfo = data.priceInfo;
      return {
        symbol,
        price: parseFloat(priceInfo.lastPrice),
        change: parseFloat(priceInfo.change),
        changePercent: parseFloat(priceInfo.pChange),
        volume: parseInt(priceInfo.totalTradedVolume || 0),
        high: parseFloat(priceInfo.intraDayHighLow?.max || priceInfo.lastPrice),
        low: parseFloat(priceInfo.intraDayHighLow?.min || priceInfo.lastPrice),
        open: parseFloat(priceInfo.open || priceInfo.lastPrice),
        previousClose: parseFloat(priceInfo.previousClose || priceInfo.lastPrice)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

// Main handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, symbol, symbols } = req.query;

  try {
    // Fetch index data
    if (type === 'index') {
      const niftyData = await fetchNiftyData();
      
      if (niftyData) {
        return res.status(200).json({
          success: true,
          data: niftyData,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(404).json({
        success: false,
        error: 'Index data not available'
      });
    }

    // Fetch single stock
    if (type === 'stock' && symbol) {
      const stockData = await fetchStockQuote(symbol as string);
      
      if (stockData) {
        return res.status(200).json({
          success: true,
          data: stockData,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(404).json({
        success: false,
        error: 'Stock data not available'
      });
    }

    // Fetch multiple stocks
    if (type === 'stocks' && symbols) {
      const symbolList = (symbols as string).split(',');
      const stockPromises = symbolList.map(s => fetchStockQuote(s.trim()));
      const stockResults = await Promise.all(stockPromises);
      
      const validStocks = stockResults.filter(s => s !== null);
      
      return res.status(200).json({
        success: true,
        data: validStocks,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid request. Use ?type=index or ?type=stock&symbol=RELIANCE or ?type=stocks&symbols=RELIANCE,TCS'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}