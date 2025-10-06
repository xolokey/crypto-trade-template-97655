// Vercel Serverless Function for Twelve Data API
// Handles real-time stock quotes and time series data

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

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

  const { symbol, symbols, interval, outputsize } = req.query;
  const apiKey = process.env.VITE_TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Twelve Data API key not configured'
    });
  }

  if (!symbol && !symbols) {
    return res.status(400).json({
      success: false,
      error: 'Symbol or symbols parameter is required'
    });
  }

  try {
    // Build URL based on request type
    let url: string;
    
    if (symbols) {
      // Multiple symbols - use quote endpoint
      url = `${TWELVE_DATA_BASE_URL}/quote?symbol=${symbols}&apikey=${apiKey}`;
    } else if (interval) {
      // Time series data
      url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize || 30}&apikey=${apiKey}`;
    } else {
      // Single quote
      url = `${TWELVE_DATA_BASE_URL}/quote?symbol=${symbol}&apikey=${apiKey}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Twelve Data API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data.status === 'error') {
      return res.status(400).json({
        success: false,
        error: data.message || 'API error',
        code: data.code
      });
    }
    
    // Parse single quote response
    if (data.symbol && !Array.isArray(data)) {
      return res.status(200).json({
        success: true,
        data: {
          symbol: data.symbol,
          name: data.name,
          price: parseFloat(data.close),
          change: parseFloat(data.change),
          changePercent: parseFloat(data.percent_change),
          volume: parseInt(data.volume || 0),
          high: parseFloat(data.high),
          low: parseFloat(data.low),
          open: parseFloat(data.open),
          previousClose: parseFloat(data.previous_close),
          timestamp: data.timestamp,
          exchange: data.exchange,
          currency: data.currency
        },
        timestamp: new Date().toISOString(),
        source: 'Twelve Data'
      });
    }
    
    // Return raw data for other response types
    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      source: 'Twelve Data'
    });

  } catch (error) {
    console.error('Twelve Data API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch data from Twelve Data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
