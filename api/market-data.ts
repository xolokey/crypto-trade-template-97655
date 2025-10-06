// Unified Market Data API - Tries multiple sources with fallback
// This is the main endpoint your frontend should use

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp?: string;
}

// Try Alpha Vantage
async function fetchFromAlphaVantage(symbol: string, apiKey: string): Promise<StockData | null> {
  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: quote['07. latest trading day']
      };
    }
    
    return null;
  } catch (error) {
    console.error('Alpha Vantage error:', error);
    return null;
  }
}

// Try Twelve Data
async function fetchFromTwelveData(symbol: string, apiKey: string): Promise<StockData | null> {
  try {
    const url = `${TWELVE_DATA_BASE_URL}/quote?symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.symbol && data.close) {
      return {
        symbol: data.symbol,
        price: parseFloat(data.close),
        change: parseFloat(data.change || 0),
        changePercent: parseFloat(data.percent_change || 0),
        volume: parseInt(data.volume || 0),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        open: parseFloat(data.open),
        previousClose: parseFloat(data.previous_close),
        timestamp: data.timestamp
      };
    }
    
    return null;
  } catch (error) {
    console.error('Twelve Data error:', error);
    return null;
  }
}

// Generate realistic mock data as fallback
function generateMockData(symbol: string): StockData {
  const basePrice = Math.random() * 4000 + 500;
  const changePercent = (Math.random() - 0.5) * 5;
  const change = (basePrice * changePercent) / 100;
  
  return {
    symbol,
    price: basePrice,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 10000000),
    high: basePrice * 1.02,
    low: basePrice * 0.98,
    open: basePrice * 0.99,
    previousClose: basePrice - change
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol, symbols } = req.query;
  const alphaVantageKey = process.env.VITE_ALPHA_VANTAGE_API_KEY;
  const twelveDataKey = process.env.VITE_TWELVE_DATA_API_KEY;

  if (!symbol && !symbols) {
    return res.status(400).json({
      success: false,
      error: 'Symbol or symbols parameter is required'
    });
  }

  try {
    // Handle multiple symbols
    if (symbols) {
      const symbolList = (symbols as string).split(',').map(s => s.trim());
      const results = await Promise.all(
        symbolList.map(async (sym) => {
          // Try Alpha Vantage first
          if (alphaVantageKey) {
            const data = await fetchFromAlphaVantage(sym, alphaVantageKey);
            if (data) return { ...data, source: 'Alpha Vantage' };
          }
          
          // Try Twelve Data
          if (twelveDataKey) {
            const data = await fetchFromTwelveData(sym, twelveDataKey);
            if (data) return { ...data, source: 'Twelve Data' };
          }
          
          // Fallback to mock data
          return { ...generateMockData(sym), source: 'Mock (Simulated)' };
        })
      );
      
      return res.status(200).json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    }

    // Handle single symbol
    const sym = symbol as string;
    let stockData: StockData | null = null;
    let source = 'Mock (Simulated)';

    // Try Alpha Vantage first
    if (alphaVantageKey && !stockData) {
      stockData = await fetchFromAlphaVantage(sym, alphaVantageKey);
      if (stockData) source = 'Alpha Vantage';
    }

    // Try Twelve Data if Alpha Vantage failed
    if (twelveDataKey && !stockData) {
      stockData = await fetchFromTwelveData(sym, twelveDataKey);
      if (stockData) source = 'Twelve Data';
    }

    // Fallback to mock data
    if (!stockData) {
      stockData = generateMockData(sym);
    }

    return res.status(200).json({
      success: true,
      data: stockData,
      source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market Data API Error:', error);
    
    // Even on error, return mock data
    const sym = (symbol || (symbols as string).split(',')[0]) as string;
    return res.status(200).json({
      success: true,
      data: generateMockData(sym),
      source: 'Mock (Error Fallback)',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
