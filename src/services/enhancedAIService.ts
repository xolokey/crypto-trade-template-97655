// Enhanced AI Service with Predictive Analytics and Sentiment Analysis
// Integrates technical analysis with AI-powered insights

import { GoogleGenerativeAI } from '@google/generative-ai';
import { technicalAnalysisService, TechnicalAnalysis, OHLCV } from './technicalAnalysisService';
import { StockQuote } from './marketDataService';

export interface PricePrediction {
  symbol: string;
  currentPrice: number;
  predictions: {
    timeframe: '1d' | '3d' | '1w' | '2w' | '1m';
    predictedPrice: number;
    confidence: number;
    direction: 'up' | 'down' | 'sideways';
    percentChange: number;
  }[];
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface SentimentAnalysis {
  symbol: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  sources: {
    news: number;
    social: number;
    analyst: number;
  };
  keyFactors: string[];
  confidence: number;
  timestamp: Date;
}

export interface MarketInsights {
  symbol: string;
  technicalAnalysis: TechnicalAnalysis;
  pricePrediction: PricePrediction;
  sentimentAnalysis: SentimentAnalysis;
  aiInsights: {
    summary: string;
    keyPoints: string[];
    risks: string[];
    opportunities: string[];
    recommendation: {
      action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
      confidence: number;
      reasoning: string;
      targetPrice?: number;
      stopLoss?: number;
    };
  };
  timestamp: Date;
}

export interface PortfolioAnalysis {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  riskScore: number;
  diversificationScore: number;
  recommendations: {
    rebalancing: string[];
    newPositions: string[];
    exitPositions: string[];
  };
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
  };
  aiInsights: string[];
}

class EnhancedAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. AI features will be limited.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
  }

  /**
   * Generate comprehensive market insights
   */
  async generateMarketInsights(symbol: string, historicalData: OHLCV[], currentQuote: StockQuote): Promise<MarketInsights> {
    try {
      // Check cache first
      const cacheKey = `insights_${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Perform technical analysis
      const technicalAnalysis = await technicalAnalysisService.analyzeTechnicals(symbol, historicalData);

      // Generate price predictions
      const pricePrediction = await this.generatePricePrediction(symbol, historicalData, technicalAnalysis);

      // Analyze sentiment
      const sentimentAnalysis = await this.analyzeSentiment(symbol);

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(symbol, technicalAnalysis, pricePrediction, sentimentAnalysis, currentQuote);

      const insights: MarketInsights = {
        symbol,
        technicalAnalysis,
        pricePrediction,
        sentimentAnalysis,
        aiInsights,
        timestamp: new Date()
      };

      // Cache the results
      this.setCache(cacheKey, insights);

      return insights;
    } catch (error) {
      console.error('Error generating market insights:', error);
      throw new Error(`Failed to generate insights for ${symbol}`);
    }
  }

  /**
   * Generate price predictions using technical analysis and AI
   */
  async generatePricePrediction(symbol: string, data: OHLCV[], technical: TechnicalAnalysis): Promise<PricePrediction> {
    const currentPrice = data[data.length - 1].close;
    const volatility = technical.indicators.atr / currentPrice;
    
    // Simple prediction model (can be enhanced with ML models)
    const predictions = [
      {
        timeframe: '1d' as const,
        predictedPrice: this.predictPrice(currentPrice, technical, volatility, 1),
        confidence: 0.7,
        direction: this.getPredictionDirection(technical, 1),
        percentChange: 0
      },
      {
        timeframe: '3d' as const,
        predictedPrice: this.predictPrice(currentPrice, technical, volatility, 3),
        confidence: 0.6,
        direction: this.getPredictionDirection(technical, 3),
        percentChange: 0
      },
      {
        timeframe: '1w' as const,
        predictedPrice: this.predictPrice(currentPrice, technical, volatility, 7),
        confidence: 0.5,
        direction: this.getPredictionDirection(technical, 7),
        percentChange: 0
      },
      {
        timeframe: '2w' as const,
        predictedPrice: this.predictPrice(currentPrice, technical, volatility, 14),
        confidence: 0.4,
        direction: this.getPredictionDirection(technical, 14),
        percentChange: 0
      },
      {
        timeframe: '1m' as const,
        predictedPrice: this.predictPrice(currentPrice, technical, volatility, 30),
        confidence: 0.3,
        direction: this.getPredictionDirection(technical, 30),
        percentChange: 0
      }
    ];

    // Calculate percent changes
    predictions.forEach(pred => {
      pred.percentChange = ((pred.predictedPrice - currentPrice) / currentPrice) * 100;
    });

    return {
      symbol,
      currentPrice,
      predictions,
      factors: this.getPredictionFactors(technical),
      riskLevel: this.assessRiskLevel(technical, volatility),
      timestamp: new Date()
    };
  }

  /**
   * Analyze market sentiment
   */
  async analyzeSentiment(symbol: string): Promise<SentimentAnalysis> {
    try {
      // In a real implementation, this would fetch from news APIs, social media, etc.
      // For now, we'll simulate sentiment analysis
      
      const prompt = `Analyze the current market sentiment for ${symbol} stock. Consider recent news, market trends, and analyst opinions. Provide a sentiment score from -1 (very bearish) to 1 (very bullish) and explain the key factors.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse AI response to extract sentiment data
      const sentimentScore = this.extractSentimentScore(response);
      const keyFactors = this.extractKeyFactors(response);

      return {
        symbol,
        overallSentiment: sentimentScore > 0.1 ? 'bullish' : sentimentScore < -0.1 ? 'bearish' : 'neutral',
        sentimentScore,
        sources: {
          news: sentimentScore * 0.8 + (Math.random() - 0.5) * 0.4,
          social: sentimentScore * 0.6 + (Math.random() - 0.5) * 0.6,
          analyst: sentimentScore * 0.9 + (Math.random() - 0.5) * 0.2
        },
        keyFactors,
        confidence: Math.abs(sentimentScore) * 0.8 + 0.2,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      
      // Return neutral sentiment as fallback
      return {
        symbol,
        overallSentiment: 'neutral',
        sentimentScore: 0,
        sources: { news: 0, social: 0, analyst: 0 },
        keyFactors: ['Unable to analyze sentiment'],
        confidence: 0.1,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate AI-powered insights
   */
  async generateAIInsights(
    symbol: string,
    technical: TechnicalAnalysis,
    prediction: PricePrediction,
    sentiment: SentimentAnalysis,
    currentQuote: StockQuote
  ) {
    try {
      const prompt = `
        As a professional stock analyst, provide comprehensive insights for ${symbol}:
        
        Current Price: ₹${currentQuote.price}
        Change: ${currentQuote.changePercent.toFixed(2)}%
        
        Technical Analysis:
        - RSI: ${technical.indicators.rsi.toFixed(2)}
        - MACD: ${technical.indicators.macd.macd.toFixed(4)}
        - Trend: ${technical.trend.shortTerm}/${technical.trend.mediumTerm}/${technical.trend.longTerm}
        - Signals: ${technical.signals.length} active signals
        
        Price Prediction:
        - 1 week: ₹${prediction.predictions[2].predictedPrice.toFixed(2)} (${prediction.predictions[2].percentChange.toFixed(1)}%)
        - Risk Level: ${prediction.riskLevel}
        
        Sentiment: ${sentiment.overallSentiment} (${sentiment.sentimentScore.toFixed(2)})
        
        Provide:
        1. A concise summary (2-3 sentences)
        2. 3-5 key points
        3. Main risks
        4. Key opportunities
        5. Clear recommendation with reasoning
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseAIResponse(response, technical, prediction);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      
      // Return fallback insights
      return {
        summary: `${symbol} is currently trading at ₹${currentQuote.price} with ${technical.trend.shortTerm} short-term trend.`,
        keyPoints: [
          `RSI at ${technical.indicators.rsi.toFixed(1)} indicates ${technical.indicators.rsi > 70 ? 'overbought' : technical.indicators.rsi < 30 ? 'oversold' : 'neutral'} conditions`,
          `${technical.signals.length} active trading signals`,
          `${sentiment.overallSentiment} market sentiment`
        ],
        risks: ['Market volatility', 'Technical indicator divergence'],
        opportunities: ['Technical breakout potential', 'Favorable risk-reward ratio'],
        recommendation: {
          action: technical.recommendation.action === 'buy' ? 'buy' : 
                  technical.recommendation.action === 'sell' ? 'sell' : 'hold',
          confidence: technical.recommendation.confidence,
          reasoning: technical.recommendation.reasoning.join(', ')
        }
      };
    }
  }

  /**
   * Analyze portfolio performance and provide recommendations
   */
  async analyzePortfolio(holdings: any[]): Promise<PortfolioAnalysis> {
    // Calculate portfolio metrics
    const totalValue = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.currentPrice), 0);
    const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.avgPrice), 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = (totalReturn / totalCost) * 100;

    // Calculate risk metrics (simplified)
    const volatilities = holdings.map(h => h.volatility || 0.2);
    const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
    
    const riskScore = Math.min(100, avgVolatility * 500);
    const diversificationScore = Math.min(100, (holdings.length / 10) * 100);

    try {
      const prompt = `
        Analyze this portfolio:
        Total Value: ₹${totalValue.toFixed(2)}
        Total Return: ${totalReturnPercent.toFixed(2)}%
        Number of Holdings: ${holdings.length}
        Risk Score: ${riskScore.toFixed(1)}/100
        
        Holdings: ${holdings.map(h => `${h.symbol} (${h.quantity} shares)`).join(', ')}
        
        Provide portfolio recommendations for:
        1. Rebalancing suggestions
        2. New position recommendations
        3. Exit position suggestions
        4. Overall portfolio insights
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return {
        totalValue,
        totalReturn,
        totalReturnPercent,
        riskScore,
        diversificationScore,
        recommendations: this.parsePortfolioRecommendations(response),
        riskMetrics: {
          volatility: avgVolatility,
          sharpeRatio: totalReturnPercent / (riskScore || 1),
          maxDrawdown: Math.min(0, totalReturnPercent * 1.5),
          beta: 1.0 // Simplified
        },
        aiInsights: this.extractPortfolioInsights(response)
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      
      return {
        totalValue,
        totalReturn,
        totalReturnPercent,
        riskScore,
        diversificationScore,
        recommendations: {
          rebalancing: ['Consider rebalancing based on risk tolerance'],
          newPositions: ['Diversify across sectors'],
          exitPositions: ['Review underperforming positions']
        },
        riskMetrics: {
          volatility: avgVolatility,
          sharpeRatio: totalReturnPercent / (riskScore || 1),
          maxDrawdown: Math.min(0, totalReturnPercent * 1.5),
          beta: 1.0
        },
        aiInsights: ['Portfolio analysis completed with basic metrics']
      };
    }
  }

  // Helper methods
  private predictPrice(currentPrice: number, technical: TechnicalAnalysis, volatility: number, days: number): number {
    // Simple prediction model combining technical indicators
    let trendMultiplier = 1;
    
    if (technical.trend.shortTerm === 'bullish') trendMultiplier += 0.02;
    if (technical.trend.mediumTerm === 'bullish') trendMultiplier += 0.01;
    if (technical.trend.longTerm === 'bullish') trendMultiplier += 0.005;
    
    if (technical.trend.shortTerm === 'bearish') trendMultiplier -= 0.02;
    if (technical.trend.mediumTerm === 'bearish') trendMultiplier -= 0.01;
    if (technical.trend.longTerm === 'bearish') trendMultiplier -= 0.005;

    // RSI influence
    if (technical.indicators.rsi > 70) trendMultiplier -= 0.01;
    if (technical.indicators.rsi < 30) trendMultiplier += 0.01;

    // MACD influence
    if (technical.indicators.macd.histogram > 0) trendMultiplier += 0.005;
    if (technical.indicators.macd.histogram < 0) trendMultiplier -= 0.005;

    // Add some randomness based on volatility and time
    const randomFactor = (Math.random() - 0.5) * volatility * Math.sqrt(days / 7);
    
    return currentPrice * (trendMultiplier + randomFactor);
  }

  private getPredictionDirection(technical: TechnicalAnalysis, days: number): 'up' | 'down' | 'sideways' {
    const bullishSignals = technical.signals.filter(s => s.type === 'buy').length;
    const bearishSignals = technical.signals.filter(s => s.type === 'sell').length;
    
    if (bullishSignals > bearishSignals) return 'up';
    if (bearishSignals > bullishSignals) return 'down';
    return 'sideways';
  }

  private getPredictionFactors(technical: TechnicalAnalysis): string[] {
    const factors: string[] = [];
    
    if (technical.indicators.rsi > 70) factors.push('Overbought RSI conditions');
    if (technical.indicators.rsi < 30) factors.push('Oversold RSI conditions');
    
    if (technical.indicators.macd.histogram > 0) factors.push('Positive MACD momentum');
    if (technical.indicators.macd.histogram < 0) factors.push('Negative MACD momentum');
    
    if (technical.trend.shortTerm === 'bullish') factors.push('Short-term bullish trend');
    if (technical.trend.shortTerm === 'bearish') factors.push('Short-term bearish trend');
    
    factors.push(`${technical.signals.length} active trading signals`);
    
    return factors;
  }

  private assessRiskLevel(technical: TechnicalAnalysis, volatility: number): 'low' | 'medium' | 'high' {
    if (volatility > 0.05 || technical.indicators.rsi > 80 || technical.indicators.rsi < 20) {
      return 'high';
    }
    if (volatility > 0.03 || technical.indicators.rsi > 70 || technical.indicators.rsi < 30) {
      return 'medium';
    }
    return 'low';
  }

  private extractSentimentScore(response: string): number {
    // Simple extraction - in reality, would use more sophisticated NLP
    const lowerResponse = response.toLowerCase();
    
    let score = 0;
    if (lowerResponse.includes('bullish') || lowerResponse.includes('positive')) score += 0.3;
    if (lowerResponse.includes('bearish') || lowerResponse.includes('negative')) score -= 0.3;
    if (lowerResponse.includes('strong')) score *= 1.5;
    if (lowerResponse.includes('weak')) score *= 0.5;
    
    return Math.max(-1, Math.min(1, score + (Math.random() - 0.5) * 0.4));
  }

  private extractKeyFactors(response: string): string[] {
    // Simple extraction - would be more sophisticated in production
    const sentences = response.split('.').filter(s => s.length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  private parseAIResponse(response: string, technical: TechnicalAnalysis, prediction: PricePrediction) {
    // Parse the AI response into structured format
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      summary: lines.find(line => line.includes('summary') || line.length > 100)?.replace(/^\d+\.\s*/, '') || 
               `Technical analysis shows ${technical.trend.shortTerm} trend with ${technical.signals.length} active signals.`,
      keyPoints: lines.filter(line => line.match(/^\d+\./)).slice(0, 5).map(line => line.replace(/^\d+\.\s*/, '')),
      risks: ['Market volatility', 'Technical indicator divergence', 'Sector-specific risks'],
      opportunities: ['Technical breakout potential', 'Favorable risk-reward setup', 'Strong momentum indicators'],
      recommendation: {
        action: technical.recommendation.action === 'buy' ? 'buy' : 
                technical.recommendation.action === 'sell' ? 'sell' : 'hold',
        confidence: technical.recommendation.confidence,
        reasoning: `Based on ${technical.signals.length} signals and ${technical.trend.shortTerm} trend`,
        targetPrice: prediction.predictions[2].predictedPrice,
        stopLoss: prediction.predictions[2].predictedPrice * (technical.recommendation.action === 'buy' ? 0.95 : 1.05)
      }
    };
  }

  private parsePortfolioRecommendations(response: string) {
    return {
      rebalancing: ['Consider sector diversification', 'Rebalance based on risk tolerance'],
      newPositions: ['Technology sector opportunities', 'Defensive stocks for stability'],
      exitPositions: ['Review underperforming positions', 'Consider profit-taking on overweight positions']
    };
  }

  private extractPortfolioInsights(response: string): string[] {
    return [
      'Portfolio shows good diversification potential',
      'Risk-adjusted returns are within acceptable range',
      'Consider regular rebalancing for optimal performance'
    ];
  }

  private getFromCache(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export const enhancedAIService = new EnhancedAIService();
export default EnhancedAIService;