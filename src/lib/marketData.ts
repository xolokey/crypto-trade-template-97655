import { env } from '@/config/env';

// Market data types
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  symbol: string;
  timeframe: string;
  data: CandlestickData[];
}

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

// API Configuration
const ALPHA_VANTAGE_API_KEY = env.ALPHA_VANTAGE_API_KEY || '';
const TWELVE_DATA_API_KEY = env.TWELVE_DATA_API_KEY || '';

// Cache for API responses
const priceCache = new Map<string, { data: StockPrice; timestamp: number }>();
const historicalCache = new Map<string, { data: HistoricalData; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

// Helper to check if cache is valid
const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Convert NSE symbol to API format
const formatSymbolForAPI = (symbol: string): string => {
  // For Alpha Vantage and most APIs, NSE stocks need .NS suffix
  return `${symbol}.NS`;
};

// Alpha Vantage API Integration
export const fetchRealTimePriceAlphaVantage = async (symbol: string): Promise<StockPrice | null> => {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('Alpha Vantage API key not configured');
    return null;
  }

  // Check cache
  const cacheKey = `price_${symbol}`;
  const cached = priceCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const apiSymbol = formatSymbolForAPI(symbol);
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${apiSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`Alpha Vantage API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();

    // Check for rate limit message
    if (data.Note) {
      console.warn('Alpha Vantage rate limit reached:', data.Note);
      return null;
    }

    if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
      const quote = data['Global Quote'];
      const stockPrice: StockPrice = {
        symbol,
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

      // Cache the result
      priceCache.set(cacheKey, { data: stockPrice, timestamp: Date.now() });
      return stockPrice;
    }

    console.warn('Alpha Vantage returned empty data for', symbol);
    return null;
  } catch (error) {
    console.error('Error fetching price from Alpha Vantage:', error);
    return null;
  }
};

// Twelve Data API Integration
export const fetchRealTimePriceTwelveData = async (symbol: string): Promise<StockPrice | null> => {
  if (!TWELVE_DATA_API_KEY) {
    console.warn('Twelve Data API key not configured');
    return null;
  }

  // Check cache
  const cacheKey = `price_${symbol}`;
  const cached = priceCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const apiSymbol = formatSymbolForAPI(symbol);
    const url = `https://api.twelvedata.com/quote?symbol=${apiSymbol}&apikey=${TWELVE_DATA_API_KEY}`;
    
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`Twelve Data API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();

    // Check for error response
    if (data.status === 'error') {
      console.warn('Twelve Data error:', data.message);
      return null;
    }

    // Check for rate limit
    if (data.code === 429) {
      console.warn('Twelve Data rate limit reached');
      return null;
    }

    if (data.symbol && data.close) {
      const stockPrice: StockPrice = {
        symbol,
        price: parseFloat(data.close),
        change: parseFloat(data.change || 0),
        changePercent: parseFloat(data.percent_change || 0),
        volume: parseInt(data.volume || 0),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        open: parseFloat(data.open),
        previousClose: parseFloat(data.previous_close),
        timestamp: data.datetime
      };

      // Cache the result
      priceCache.set(cacheKey, { data: stockPrice, timestamp: Date.now() });
      return stockPrice;
    }

    console.warn('Twelve Data returned incomplete data for', symbol, data);
    return null;
  } catch (error) {
    console.error('Error fetching price from Twelve Data:', error);
    return null;
  }
};

// Fetch historical candlestick data
export const fetchHistoricalData = async (
  symbol: string,
  timeframe: TimeFrame = '1d',
  outputSize: 'compact' | 'full' = 'compact'
): Promise<HistoricalData | null> => {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('Alpha Vantage API key not configured');
    return null;
  }

  // Check cache
  const cacheKey = `historical_${symbol}_${timeframe}`;
  const cached = historicalCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const apiSymbol = formatSymbolForAPI(symbol);
    
    // Map timeframe to Alpha Vantage function
    let functionName = 'TIME_SERIES_DAILY';
    let interval = '';
    
    if (timeframe.includes('m') || timeframe.includes('h')) {
      functionName = 'TIME_SERIES_INTRADAY';
      interval = `&interval=${timeframe}`;
    } else if (timeframe === '1w') {
      functionName = 'TIME_SERIES_WEEKLY';
    } else if (timeframe === '1M') {
      functionName = 'TIME_SERIES_MONTHLY';
    }

    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${apiSymbol}${interval}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    // Parse the time series data
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
      console.error('No time series data found');
      return null;
    }

    const timeSeries = data[timeSeriesKey];
    const candlesticks: CandlestickData[] = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    }));

    const historicalData: HistoricalData = {
      symbol,
      timeframe,
      data: candlesticks
    };

    // Cache the result
    historicalCache.set(cacheKey, { data: historicalData, timestamp: Date.now() });
    return historicalData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
};

// Twelve Data historical data (better for intraday)
export const fetchHistoricalDataTwelveData = async (
  symbol: string,
  timeframe: TimeFrame = '1d',
  outputSize: number = 100
): Promise<HistoricalData | null> => {
  if (!TWELVE_DATA_API_KEY) {
    console.warn('Twelve Data API key not configured');
    return null;
  }

  // Check cache
  const cacheKey = `historical_${symbol}_${timeframe}`;
  const cached = historicalCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const apiSymbol = formatSymbolForAPI(symbol);
    const url = `https://api.twelvedata.com/time_series?symbol=${apiSymbol}&interval=${timeframe}&outputsize=${outputSize}&apikey=${TWELVE_DATA_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.values && Array.isArray(data.values)) {
      const candlesticks: CandlestickData[] = data.values.map((item: any) => ({
        timestamp: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume)
      }));

      const historicalData: HistoricalData = {
        symbol,
        timeframe,
        data: candlesticks
      };

      // Cache the result
      historicalCache.set(cacheKey, { data: historicalData, timestamp: Date.now() });
      return historicalData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching historical data from Twelve Data:', error);
    return null;
  }
};

// Fallback to mock data if APIs are not available
export const generateMockPrice = (symbol: string): StockPrice => {
  const basePrice = Math.random() * 5000 + 100;
  const change = (Math.random() - 0.5) * 100;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    price: basePrice,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 10000000),
    high: basePrice * 1.05,
    low: basePrice * 0.95,
    open: basePrice * (1 + (Math.random() - 0.5) * 0.02),
    previousClose: basePrice - change,
    timestamp: new Date().toISOString()
  };
};

export const generateMockHistoricalData = (
  symbol: string,
  timeframe: TimeFrame = '1d',
  points: number = 100
): HistoricalData => {
  const data: CandlestickData[] = [];
  let basePrice = Math.random() * 5000 + 100;
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now);
    
    // Adjust timestamp based on timeframe
    if (timeframe.includes('m')) {
      timestamp.setMinutes(timestamp.getMinutes() - i * parseInt(timeframe));
    } else if (timeframe.includes('h')) {
      timestamp.setHours(timestamp.getHours() - i * parseInt(timeframe));
    } else if (timeframe === '1d') {
      timestamp.setDate(timestamp.getDate() - i);
    } else if (timeframe === '1w') {
      timestamp.setDate(timestamp.getDate() - i * 7);
    } else if (timeframe === '1M') {
      timestamp.setMonth(timestamp.getMonth() - i);
    }

    const open = basePrice;
    const volatility = basePrice * 0.02;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    data.push({
      timestamp: timestamp.toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000)
    });

    basePrice = close;
  }

  return {
    symbol,
    timeframe,
    data
  };
};

// Main function to fetch real-time price (tries multiple sources)
export const fetchRealTimePrice = async (symbol: string): Promise<StockPrice> => {
  // Try Twelve Data first (better rate limits)
  let price = await fetchRealTimePriceTwelveData(symbol);
  
  // Fallback to Alpha Vantage
  if (!price) {
    price = await fetchRealTimePriceAlphaVantage(symbol);
  }
  
  // Fallback to mock data
  if (!price) {
    console.warn(`Using mock data for ${symbol} - API keys not configured or rate limit reached`);
    price = generateMockPrice(symbol);
  }
  
  return price;
};

// Main function to fetch historical data (tries multiple sources)
export const fetchHistoricalDataMultiSource = async (
  symbol: string,
  timeframe: TimeFrame = '1d',
  outputSize: number = 100
): Promise<HistoricalData> => {
  // Try Twelve Data first (better for intraday)
  let data = await fetchHistoricalDataTwelveData(symbol, timeframe, outputSize);
  
  // Fallback to Alpha Vantage
  if (!data) {
    data = await fetchHistoricalData(symbol, timeframe, outputSize > 100 ? 'full' : 'compact');
  }
  
  // Fallback to mock data
  if (!data) {
    console.warn(`Using mock data for ${symbol} - API keys not configured or rate limit reached`);
    data = generateMockHistoricalData(symbol, timeframe, outputSize);
  }
  
  return data;
};

// Batch fetch prices for multiple symbols
export const fetchBatchPrices = async (symbols: string[]): Promise<Map<string, StockPrice>> => {
  const prices = new Map<string, StockPrice>();
  
  // Fetch prices in parallel with rate limiting
  const batchSize = 5; // Fetch 5 at a time to avoid rate limits
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchPromises = batch.map(symbol => fetchRealTimePrice(symbol));
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach((price, index) => {
      prices.set(batch[index], price);
    });
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return prices;
};

// Clear cache (useful for forcing refresh)
export const clearCache = () => {
  priceCache.clear();
  historicalCache.clear();
};

// Check if real-time data is available
export const isRealTimeDataAvailable = (): boolean => {
  return !!(ALPHA_VANTAGE_API_KEY || TWELVE_DATA_API_KEY);
};