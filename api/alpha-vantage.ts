// Vercel Serverless Function for Alpha Vantage API
// Handles stock quotes and real-time data

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

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

  const { symbol, function: func } = req.query;
  const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Alpha Vantage API key not configured'
    });
  }

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Symbol parameter is required'
    });
  }

  try {
    const functionType = func || 'GLOBAL_QUOTE';
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=${functionType}&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data['Error Message']) {
      return res.status(404).json({
        success: false,
        error: 'Symbol not found',
        message: data['Error Message']
      });
    }
    
    if (data['Note']) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: data['Note']
      });
    }
    
    // Parse GLOBAL_QUOTE response
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return res.status(200).json({
        success: true,
        data: {
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          open: parseFloat(quote['02. open']),
          previousClose: parseFloat(quote['08. previous close']),
          latestTradingDay: quote['07. latest trading day']
        },
        timestamp: new Date().toISOString(),
        source: 'Alpha Vantage'
      });
    }
    
    // Return raw data for other function types
    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      source: 'Alpha Vantage'
    });

  } catch (error) {
    console.error('Alpha Vantage API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch data from Alpha Vantage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
