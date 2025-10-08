// Enhanced AI Dashboard with Predictive Analytics and Market Insights
// Comprehensive AI-powered analysis and recommendations

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancedAIService, MarketInsights, PricePrediction, SentimentAnalysis } from '@/services/enhancedAIService';
import { useStocks } from '@/hooks/useStocks';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import AdvancedTradingChart from '@/components/charts/AdvancedTradingChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface AIInsightCard {
  symbol: string;
  insights: MarketInsights;
  isLoading: boolean;
}

const EnhancedAIDashboard: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [aiInsights, setAIInsights] = useState<Map<string, MarketInsights>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);
  const [marketOverview, setMarketOverview] = useState<any>(null);
  
  const { stocks } = useStocks();
  const { data: realTimeData } = useRealTimeStock({ symbol: selectedSymbol });

  // Top performing stocks for analysis
  const topStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC', 'LT'];

  // Load AI insights for top stocks
  useEffect(() => {
    const loadAIInsights = async () => {
      setIsLoading(true);
      
      try {
        const insightsMap = new Map<string, MarketInsights>();
        
        // Generate sample historical data for demonstration
        const generateSampleData = (symbol: string) => {
          const data = [];
          const basePrice = Math.random() * 2000 + 500;
          
          for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * volatility;
            const price = basePrice * (1 + change);
            
            data.push({
              timestamp: date,
              open: price * (1 + (Math.random() - 0.5) * 0.01),
              high: price * (1 + Math.random() * 0.02),
              low: price * (1 - Math.random() * 0.02),
              close: price,
              volume: Math.floor(Math.random() * 10000000)
            });
          }
          
          return data;
        };

        // Load insights for selected stocks
        for (const symbol of topStocks.slice(0, 4)) { // Limit to 4 for performance
          try {
            const historicalData = generateSampleData(symbol);
            const currentQuote = {
              symbol,
              price: historicalData[historicalData.length - 1].close,
              change: Math.random() * 100 - 50,
              changePercent: (Math.random() - 0.5) * 10,
              volume: Math.floor(Math.random() * 10000000),
              high: historicalData[historicalData.length - 1].high,
              low: historicalData[historicalData.length - 1].low,
              open: historicalData[historicalData.length - 1].open,
              previousClose: historicalData[historicalData.length - 2]?.close || 0
            };

            const insights = await enhancedAIService.generateMarketInsights(
              symbol,
              historicalData,
              currentQuote
            );
            
            insightsMap.set(symbol, insights);
          } catch (error) {
            console.error(`Error loading insights for ${symbol}:`, error);
          }
        }
        
        setAIInsights(insightsMap);
      } catch (error) {
        console.error('Error loading AI insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAIInsights();
  }, []);

  // Generate market overview
  useEffect(() => {
    const generateMarketOverview = () => {
      const insights = Array.from(aiInsights.values());
      if (insights.length === 0) return;

      const bullishCount = insights.filter(i => i.sentimentAnalysis.overallSentiment === 'bullish').length;
      const bearishCount = insights.filter(i => i.sentimentAnalysis.overallSentiment === 'bearish').length;
      const neutralCount = insights.length - bullishCount - bearishCount;

      const avgSentiment = insights.reduce((sum, i) => sum + i.sentimentAnalysis.sentimentScore, 0) / insights.length;
      
      setMarketOverview({
        totalAnalyzed: insights.length,
        bullishCount,
        bearishCount,
        neutralCount,
        avgSentiment,
        marketMood: avgSentiment > 0.2 ? 'Bullish' : avgSentiment < -0.2 ? 'Bearish' : 'Neutral'
      });
    };

    generateMarketOverview();
  }, [aiInsights]);

  // Render prediction chart
  const renderPredictionChart = (prediction: PricePrediction) => {
    const chartData = [
      { name: 'Current', price: prediction.currentPrice, confidence: 100 },
      ...prediction.predictions.map(p => ({
        name: p.timeframe,
        price: p.predictedPrice,
        confidence: p.confidence * 100
      }))
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            formatter={(value: any, name: string) => [
              name === 'price' ? `₹${value.toFixed(2)}` : `${value.toFixed(1)}%`,
              name === 'price' ? 'Price' : 'Confidence'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke="#10b981" 
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render sentiment pie chart
  const renderSentimentChart = () => {
    if (!marketOverview) return null;

    const data = [
      { name: 'Bullish', value: marketOverview.bullishCount, color: '#22c55e' },
      { name: 'Bearish', value: marketOverview.bearishCount, color: '#ef4444' },
      { name: 'Neutral', value: marketOverview.neutralCount, color: '#6b7280' }
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  // Render AI insight card
  const renderInsightCard = (symbol: string, insights: MarketInsights) => {
    const { technicalAnalysis, pricePrediction, sentimentAnalysis, aiInsights: ai } = insights;
    
    return (
      <motion.div
        key={symbol}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{symbol}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={sentimentAnalysis.overallSentiment === 'bullish' ? 'default' : 
                          sentimentAnalysis.overallSentiment === 'bearish' ? 'destructive' : 'secondary'}
                >
                  {sentimentAnalysis.overallSentiment}
                </Badge>
                <Badge variant="outline">
                  {ai.recommendation.action.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* AI Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{ai.summary}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {technicalAnalysis.indicators.rsi.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">RSI</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(ai.recommendation.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
            </div>

            {/* Price Prediction */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">1 Week Prediction</span>
                <span className={`text-sm font-bold ${
                  pricePrediction.predictions[2].direction === 'up' ? 'text-green-500' : 
                  pricePrediction.predictions[2].direction === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {pricePrediction.predictions[2].direction === 'up' ? '↗' : 
                   pricePrediction.predictions[2].direction === 'down' ? '↘' : '→'}
                  {pricePrediction.predictions[2].percentChange.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={pricePrediction.predictions[2].confidence * 100} 
                className="h-2"
              />
            </div>

            {/* Key Points */}
            <div>
              <h4 className="text-sm font-medium mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {ai.keyPoints.slice(0, 3).map((point, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <Button 
              size="sm" 
              className="w-full"
              variant={ai.recommendation.action === 'buy' ? 'default' : 
                      ai.recommendation.action === 'sell' ? 'destructive' : 'outline'}
              onClick={() => setSelectedSymbol(symbol)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      {marketOverview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{marketOverview.totalAnalyzed}</div>
                  <div className="text-xs text-muted-foreground">Stocks Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-500">{marketOverview.bullishCount}</div>
                  <div className="text-xs text-muted-foreground">Bullish Signals</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-500">{marketOverview.bearishCount}</div>
                  <div className="text-xs text-muted-foreground">Bearish Signals</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{marketOverview.marketMood}</div>
                  <div className="text-xs text-muted-foreground">Market Mood</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">AI Market Insights</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Refresh Analysis
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(aiInsights.entries()).map(([symbol, insights]) =>
                renderInsightCard(symbol, insights)
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Sentiment */}
          {marketOverview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                {renderSentimentChart()}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Sentiment</span>
                    <Badge variant={marketOverview.avgSentiment > 0 ? 'default' : 'destructive'}>
                      {(marketOverview.avgSentiment * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={(marketOverview.avgSentiment + 1) * 50} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Stock Details */}
          {selectedSymbol && aiInsights.has(selectedSymbol) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedSymbol} Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                {renderPredictionChart(aiInsights.get(selectedSymbol)!.pricePrediction)}
                <div className="mt-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Predictions are based on technical analysis and AI models. 
                      Past performance doesn't guarantee future results.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(aiInsights.entries())
                  .sort(([,a], [,b]) => b.aiInsights.recommendation.confidence - a.aiInsights.recommendation.confidence)
                  .slice(0, 3)
                  .map(([symbol, insights]) => (
                    <div key={symbol} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <div className="font-medium text-sm">{symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {insights.aiInsights.recommendation.action.toUpperCase()}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {(insights.aiInsights.recommendation.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIDashboard;