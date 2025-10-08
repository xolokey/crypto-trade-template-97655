// Advanced Technical Analysis Service
// Provides comprehensive technical indicators and pattern recognition

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  atr: number; // Average True Range
  adx: number; // Average Directional Index
  volume: {
    volumeMA: number;
    volumeRatio: number;
    onBalanceVolume: number;
  };
}

export interface ChartPattern {
  type: 'head_and_shoulders' | 'double_top' | 'double_bottom' | 'triangle' | 'flag' | 'wedge';
  confidence: number;
  direction: 'bullish' | 'bearish';
  targetPrice?: number;
  stopLoss?: number;
}

export interface TechnicalAnalysis {
  symbol: string;
  timestamp: Date;
  indicators: TechnicalIndicators;
  patterns: ChartPattern[];
  signals: TradingSignal[];
  trend: {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    mediumTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
  };
  support: number[];
  resistance: number[];
  recommendation: {
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    reasoning: string[];
  };
}

export interface TradingSignal {
  type: 'buy' | 'sell';
  strength: 'weak' | 'moderate' | 'strong';
  indicator: string;
  description: string;
  timestamp: Date;
}

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class TechnicalAnalysisService {
  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Neutral if insufficient data

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI using Wilder's smoothing
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    
    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

    const latest = macdLine.length - 1;
    return {
      macd: macdLine[latest] || 0,
      signal: signalLine[latest] || 0,
      histogram: histogram[latest] || 0
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.calculateSMA(prices, period);
    const latest = sma.length - 1;
    const middle = sma[latest] || 0;

    // Calculate standard deviation
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: middle + (standardDeviation * stdDev),
      middle,
      lower: middle - (standardDeviation * stdDev)
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    ema[0] = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 1; i < prices.length - period + 1; i++) {
      ema[i] = (prices[i + period - 1] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  }

  /**
   * Calculate Stochastic Oscillator
   */
  calculateStochastic(data: OHLCV[], kPeriod: number = 14, dPeriod: number = 3) {
    if (data.length < kPeriod) return { k: 50, d: 50 };

    const recent = data.slice(-kPeriod);
    const currentClose = recent[recent.length - 1].close;
    const lowestLow = Math.min(...recent.map(d => d.low));
    const highestHigh = Math.max(...recent.map(d => d.high));

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (3-period SMA of %K)
    const kValues = [k]; // In a real implementation, you'd maintain a history
    const d = kValues.reduce((a, b) => a + b, 0) / kValues.length;

    return { k, d };
  }

  /**
   * Calculate Average True Range (ATR)
   */
  calculateATR(data: OHLCV[], period: number = 14): number {
    if (data.length < 2) return 0;

    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Calculate ATR as SMA of True Ranges
    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((a, b) => a + b, 0) / recentTR.length;
  }

  /**
   * Detect chart patterns
   */
  detectPatterns(data: OHLCV[]): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    
    if (data.length < 20) return patterns;

    // Simple pattern detection (can be enhanced with more sophisticated algorithms)
    const recent = data.slice(-20);
    const prices = recent.map(d => d.close);
    
    // Double top pattern
    if (this.isDoubleTop(prices)) {
      patterns.push({
        type: 'double_top',
        confidence: 0.7,
        direction: 'bearish',
        targetPrice: Math.min(...prices.slice(-10)) * 0.95
      });
    }

    // Double bottom pattern
    if (this.isDoubleBottom(prices)) {
      patterns.push({
        type: 'double_bottom',
        confidence: 0.7,
        direction: 'bullish',
        targetPrice: Math.max(...prices.slice(-10)) * 1.05
      });
    }

    return patterns;
  }

  /**
   * Generate trading signals
   */
  generateSignals(analysis: TechnicalIndicators): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const now = new Date();

    // RSI signals
    if (analysis.rsi < 30) {
      signals.push({
        type: 'buy',
        strength: 'moderate',
        indicator: 'RSI',
        description: 'RSI indicates oversold condition',
        timestamp: now
      });
    } else if (analysis.rsi > 70) {
      signals.push({
        type: 'sell',
        strength: 'moderate',
        indicator: 'RSI',
        description: 'RSI indicates overbought condition',
        timestamp: now
      });
    }

    // MACD signals
    if (analysis.macd.macd > analysis.macd.signal && analysis.macd.histogram > 0) {
      signals.push({
        type: 'buy',
        strength: 'strong',
        indicator: 'MACD',
        description: 'MACD bullish crossover with positive histogram',
        timestamp: now
      });
    } else if (analysis.macd.macd < analysis.macd.signal && analysis.macd.histogram < 0) {
      signals.push({
        type: 'sell',
        strength: 'strong',
        indicator: 'MACD',
        description: 'MACD bearish crossover with negative histogram',
        timestamp: now
      });
    }

    // Moving average signals
    const { sma20, sma50, sma200 } = analysis.movingAverages;
    if (sma20 > sma50 && sma50 > sma200) {
      signals.push({
        type: 'buy',
        strength: 'strong',
        indicator: 'Moving Averages',
        description: 'Golden cross pattern - all MAs aligned bullishly',
        timestamp: now
      });
    } else if (sma20 < sma50 && sma50 < sma200) {
      signals.push({
        type: 'sell',
        strength: 'strong',
        indicator: 'Moving Averages',
        description: 'Death cross pattern - all MAs aligned bearishly',
        timestamp: now
      });
    }

    return signals;
  }

  /**
   * Comprehensive technical analysis
   */
  async analyzeTechnicals(symbol: string, data: OHLCV[]): Promise<TechnicalAnalysis> {
    if (data.length < 50) {
      throw new Error('Insufficient data for technical analysis');
    }

    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    // Calculate all indicators
    const indicators: TechnicalIndicators = {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      movingAverages: {
        sma20: this.calculateSMA(prices, 20).slice(-1)[0] || 0,
        sma50: this.calculateSMA(prices, 50).slice(-1)[0] || 0,
        sma200: this.calculateSMA(prices, 200).slice(-1)[0] || 0,
        ema12: this.calculateEMA(prices, 12).slice(-1)[0] || 0,
        ema26: this.calculateEMA(prices, 26).slice(-1)[0] || 0,
      },
      stochastic: this.calculateStochastic(data),
      atr: this.calculateATR(data),
      adx: 50, // Placeholder - would need more complex calculation
      volume: {
        volumeMA: this.calculateSMA(volumes, 20).slice(-1)[0] || 0,
        volumeRatio: volumes[volumes.length - 1] / (this.calculateSMA(volumes, 20).slice(-1)[0] || 1),
        onBalanceVolume: this.calculateOBV(data)
      }
    };

    // Detect patterns
    const patterns = this.detectPatterns(data);

    // Generate signals
    const signals = this.generateSignals(indicators);

    // Determine trends
    const trend = this.determineTrend(indicators);

    // Calculate support and resistance
    const { support, resistance } = this.calculateSupportResistance(data);

    // Generate recommendation
    const recommendation = this.generateRecommendation(indicators, signals, trend);

    return {
      symbol,
      timestamp: new Date(),
      indicators,
      patterns,
      signals,
      trend,
      support,
      resistance,
      recommendation
    };
  }

  private isDoubleTop(prices: number[]): boolean {
    // Simplified double top detection
    const max1 = Math.max(...prices.slice(0, 10));
    const max2 = Math.max(...prices.slice(-10));
    const valley = Math.min(...prices.slice(5, 15));
    
    return Math.abs(max1 - max2) / max1 < 0.03 && valley < max1 * 0.95;
  }

  private isDoubleBottom(prices: number[]): boolean {
    // Simplified double bottom detection
    const min1 = Math.min(...prices.slice(0, 10));
    const min2 = Math.min(...prices.slice(-10));
    const peak = Math.max(...prices.slice(5, 15));
    
    return Math.abs(min1 - min2) / min1 < 0.03 && peak > min1 * 1.05;
  }

  private calculateOBV(data: OHLCV[]): number {
    let obv = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        obv += data[i].volume;
      } else if (data[i].close < data[i - 1].close) {
        obv -= data[i].volume;
      }
    }
    return obv;
  }

  private determineTrend(indicators: TechnicalIndicators) {
    const { sma20, sma50, sma200 } = indicators.movingAverages;
    
    return {
      shortTerm: sma20 > sma50 ? 'bullish' : 'bearish',
      mediumTerm: sma50 > sma200 ? 'bullish' : 'bearish',
      longTerm: indicators.rsi > 50 && sma20 > sma200 ? 'bullish' : 
                indicators.rsi < 50 && sma20 < sma200 ? 'bearish' : 'neutral'
    } as const;
  }

  private calculateSupportResistance(data: OHLCV[]) {
    const recent = data.slice(-50);
    const highs = recent.map(d => d.high);
    const lows = recent.map(d => d.low);
    
    // Find local maxima and minima
    const resistance = this.findLocalMaxima(highs).slice(-3);
    const support = this.findLocalMinima(lows).slice(-3);
    
    return { support, resistance };
  }

  private findLocalMaxima(values: number[]): number[] {
    const maxima: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        maxima.push(values[i]);
      }
    }
    return maxima.sort((a, b) => b - a);
  }

  private findLocalMinima(values: number[]): number[] {
    const minima: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        minima.push(values[i]);
      }
    }
    return minima.sort((a, b) => a - b);
  }

  private generateRecommendation(
    indicators: TechnicalIndicators,
    signals: TradingSignal[],
    trend: any
  ) {
    const buySignals = signals.filter(s => s.type === 'buy').length;
    const sellSignals = signals.filter(s => s.type === 'sell').length;
    
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0.5;
    const reasoning: string[] = [];

    if (buySignals > sellSignals) {
      action = 'buy';
      confidence = Math.min(0.9, 0.5 + (buySignals - sellSignals) * 0.1);
      reasoning.push(`${buySignals} bullish signals detected`);
    } else if (sellSignals > buySignals) {
      action = 'sell';
      confidence = Math.min(0.9, 0.5 + (sellSignals - buySignals) * 0.1);
      reasoning.push(`${sellSignals} bearish signals detected`);
    }

    // Add trend analysis to reasoning
    if (trend.shortTerm === 'bullish' && trend.mediumTerm === 'bullish') {
      reasoning.push('Strong bullish trend across timeframes');
      if (action === 'buy') confidence += 0.1;
    } else if (trend.shortTerm === 'bearish' && trend.mediumTerm === 'bearish') {
      reasoning.push('Strong bearish trend across timeframes');
      if (action === 'sell') confidence += 0.1;
    }

    return {
      action,
      confidence: Math.min(0.95, confidence),
      reasoning
    };
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();
export default TechnicalAnalysisService;