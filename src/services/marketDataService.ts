// Unified Market Data Service
// Uses backend API proxies to avoid CORS issues

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:8080';

export interface MarketDataResponse {
  success: boolean;
  data: any;
  source?: string;
  timestamp: string;
  error?: string;
}

export interface StockQuote {
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

class MarketDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 10000; // 10 seconds

  /**
   * Fetch single stock quote using backend proxy
   */
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      // Check cache first
      const cached = this.getFromCache(symbol);
      if (cached) return cached;

      const response = await fetch(`${API_BASE}/api/market-data?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result: MarketDataResponse = await response.json();
      
      if (result.success && result.data) {
        this.setCache(symbol, result.data);
        console.log(`✅ Fetched ${symbol} from ${result.source}`);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch multiple stock quotes in parallel
   */
  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(`${API_BASE}/api/market-data?symbols=${symbolsParam}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result: MarketDataResponse = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // Cache each result
        result.data.forEach((quote: StockQuote) => {
          this.setCache(quote.symbol, quote);
        });
        
        console.log(`✅ Fetched ${symbols.length} stocks`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      return [];
    }
  }

  /**
   * Fetch from Alpha Vantage directly (via proxy)
   */
  async getFromAlphaVantage(symbol: string): Promise<StockQuote | null> {
    try {
      const response = await fetch(`${API_BASE}/api/alpha-vantage?symbol=${symbol}`);
      
      if (!response.ok) return null;

      const result: MarketDataResponse = await response.json();
      
      if (result.success && result.data) {
        this.setCache(symbol, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Alpha Vantage error:', error);
      return null;
    }
  }

  /**
   * Fetch from Twelve Data directly (via proxy)
   */
  async getFromTwelveData(symbol: string): Promise<StockQuote | null> {
    try {
      const response = await fetch(`${API_BASE}/api/twelve-data?symbol=${symbol}`);
      
      if (!response.ok) return null;

      const result: MarketDataResponse = await response.json();
      
      if (result.success && result.data) {
        this.setCache(symbol, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Twelve Data error:', error);
      return null;
    }
  }

  /**
   * Fetch NSE data (via proxy)
   */
  async getNSEData(type: 'index' | 'stock', symbol?: string): Promise<any> {
    try {
      let url = `${API_BASE}/api/nse-live-data?type=${type}`;
      if (symbol) url += `&symbol=${symbol}`;

      const response = await fetch(url);
      
      if (!response.ok) return null;

      const result: MarketDataResponse = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('NSE data error:', error);
      return null;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

// Export class for testing
export default MarketDataService;
