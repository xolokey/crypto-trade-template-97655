import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  Star,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Search,
  Plus,
  LineChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import EnhancedStockCard from '@/components/stocks/EnhancedStockCard';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import PortfolioInsights from '@/components/ai/PortfolioInsights';
import AdvancedStockSearch from '@/components/search/AdvancedStockSearch';
import AddToPortfolioDialog from '@/components/portfolio/AddToPortfolioDialog';
import APIStatusIndicator from '@/components/debug/APIStatusIndicator';
import DatabaseSetupBanner from '@/components/setup/DatabaseSetupBanner';
import { SeedDatabaseButton } from '@/components/setup/SeedDatabaseButton';
import LiveMarketIndices from '@/components/market/LiveMarketIndices';
import LiveStockTicker from '@/components/market/LiveStockTicker';
import { LiveIndexCard } from '@/components/market/LiveIndexCard';
import { isGeminiAvailable } from '@/lib/gemini';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePortfolio } from '@/hooks/usePortfolio';
import { NSEStock } from '@/data/nseStocks';
import { env } from '@/config/env';
import PortfolioAnalytics from './PortfolioAnalytics';
import StockChart from '@/components/charts/StockChart';

// Mock data - replace with real data from your API
const mockStocks = [
  {
    id: '1',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    price: 2456.75,
    change: 23.45,
    changePercent: 0.96,
    volume: 1234567,
    marketCap: '₹16.6L Cr',
    sector: 'Oil & Gas',
    high52w: 2856.15,
    low52w: 2220.30
  },
  {
    id: '2',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3890.20,
    change: -45.80,
    changePercent: -1.16,
    volume: 987654,
    marketCap: '₹14.2L Cr',
    sector: 'IT Services',
    high52w: 4592.25,
    low52w: 3311.00
  },
  {
    id: '3',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    price: 1678.90,
    change: 12.35,
    changePercent: 0.74,
    volume: 2345678,
    marketCap: '₹12.8L Cr',
    sector: 'Banking',
    high52w: 1794.50,
    low52w: 1363.55
  }
];

const mockPortfolio = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    price: 2456.75,
    change: 0.96,
    quantity: 10,
    sector: 'Oil & Gas'
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3890.20,
    change: -1.16,
    quantity: 5,
    sector: 'IT Services'
  }
];

const AIEnhancedDashboard = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAddToPortfolio, setShowAddToPortfolio] = useState(false);
  const [portfolioStock, setPortfolioStock] = useState<NSEStock | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Use hooks for watchlist and portfolio
  const {
    watchlist,
    toggleWatchlist,
    getWatchlistedSymbols,
    loading: watchlistLoading
  } = useWatchlist(user?.id);

  const {
    portfolio,
    addToPortfolio,
    getPortfolioMetrics,
    loading: portfolioLoading
  } = usePortfolio(user?.id);

  const portfolioMetrics = getPortfolioMetrics();

  const handleToggleWatchlist = async (stock: NSEStock) => {
    await toggleWatchlist(stock);
  };

  const handleViewDetails = (stock: any) => {
    setSelectedStock(stock);
    setShowAIPanel(true);
  };

  const handleAIAnalysis = (stock: any) => {
    setSelectedStock(stock);
    setShowAIPanel(true);
  };

  const handleAddToPortfolio = (stock: NSEStock) => {
    setPortfolioStock(stock);
    setShowAddToPortfolio(true);
  };

  const handleConfirmAddToPortfolio = async (data: { stock: NSEStock; quantity: number; price: number }) => {
    await addToPortfolio(data);
  };

  const marketStats = [
    {
      label: 'Nifty 50',
      value: '19,674.25',
      change: '+0.85%',
      isPositive: true,
      icon: TrendingUp
    },
    {
      label: 'Sensex',
      value: '65,953.48',
      change: '+0.72%',
      isPositive: true,
      icon: BarChart3
    },
    {
      label: 'Portfolio Value',
      value: portfolioMetrics.currentValue.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }),
      change: `${portfolioMetrics.totalGainLossPercent >= 0 ? '+' : ''}${portfolioMetrics.totalGainLossPercent.toFixed(2)}%`,
      isPositive: portfolioMetrics.totalGainLoss >= 0,
      icon: Wallet
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI-Powered Stock Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time market data with intelligent insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SeedDatabaseButton />
            {isGeminiAvailable() ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enabled
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                AI Disabled
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Database Setup Banner */}
        <DatabaseSetupBanner />

        {/* AI Availability Alert */}
        {!isGeminiAvailable() && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              AI features are disabled. Configure VITE_GEMINI_API_KEY to enable AI-powered analysis and insights.
            </AlertDescription>
          </Alert>
        )}

        {/* Live Market Data Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <CardTitle className="text-xl">Live Market Data</CardTitle>
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground hidden sm:block">Updates every 3s</p>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live NSE Index */}
            <LiveIndexCard />

            {/* Live Stock Ticker */}
            <LiveStockTicker />

            {/* Live Market Indices */}
            <LiveMarketIndices />
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search, Watchlist and Portfolio */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 glass">
                <TabsTrigger value="search" className="data-[state=active]:bg-primary/20">
                  <Search className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger value="watchlist" className="data-[state=active]:bg-primary/20">
                  <Star className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Watchlist</span> ({watchlist.length})
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary/20">
                  <Wallet className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Portfolio</span> ({portfolio.length})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20">
                  <LineChart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-primary/20">
                  <Brain className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">AI</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <AdvancedStockSearch
                  onAddToWatchlist={handleToggleWatchlist}
                  onAddToPortfolio={handleAddToPortfolio}
                  onViewDetails={handleAIAnalysis}
                  watchlistedStocks={getWatchlistedSymbols()}
                />
              </TabsContent>

              <TabsContent value="watchlist" className="space-y-4">
                {watchlistLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading watchlist...
                  </div>
                ) : watchlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {watchlist.map((item) => {
                      if (!item.stocks) return null;
                      
                      const mockData = {
                        id: item.stocks.symbol,
                        symbol: item.stocks.symbol,
                        name: item.stocks.name,
                        price: Math.random() * 5000 + 100,
                        change: (Math.random() - 0.5) * 100,
                        changePercent: (Math.random() - 0.5) * 10,
                        volume: Math.floor(Math.random() * 10000000),
                        marketCap: '₹1.2L Cr',
                        sector: item.stocks.sector,
                        high52w: Math.random() * 6000 + 100,
                        low52w: Math.random() * 2000 + 50
                      };
                      
                      return (
                        <EnhancedStockCard
                          key={item.id}
                          stock={mockData}
                          isWatchlisted={true}
                          onToggleWatchlist={() => handleToggleWatchlist({ 
                            symbol: item.stocks.symbol, 
                            name: item.stocks.name, 
                            sector: item.stocks.sector 
                          } as NSEStock)}
                          onViewDetails={() => handleViewDetails(mockData)}
                          onAIAnalysis={() => handleAIAnalysis(mockData)}
                          onAddToPortfolio={() => handleAddToPortfolio({ 
                            symbol: item.stocks.symbol, 
                            name: item.stocks.name, 
                            sector: item.stocks.sector 
                          } as NSEStock)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stocks in your watchlist</p>
                    <p className="text-sm">Search and add stocks to your watchlist to track them</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('search')}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search Stocks
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-4">
                {portfolioLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Loading portfolio...
                    </div>
                  </div>
                ) : portfolio.length > 0 ? (
                  <div className="space-y-4">
                    {/* Quick Portfolio Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card className="card-elevated hover-lift">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">Invested</div>
                          <div className="text-lg font-bold">
                            ₹{(portfolioMetrics.totalInvested / 1000).toFixed(1)}K
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="card-elevated hover-lift">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">Current</div>
                          <div className="text-lg font-bold">
                            ₹{(portfolioMetrics.currentValue / 1000).toFixed(1)}K
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="card-elevated hover-lift">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">P&L</div>
                          <div className={`text-lg font-bold ${
                            portfolioMetrics.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {portfolioMetrics.totalGainLoss >= 0 ? '+' : ''}
                            ₹{(Math.abs(portfolioMetrics.totalGainLoss) / 1000).toFixed(1)}K
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="card-elevated hover-lift">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">Stocks</div>
                          <div className="text-lg font-bold">{portfolioMetrics.totalStocks}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Portfolio Holdings */}
                    <div className="grid grid-cols-1 gap-3">
                      {portfolio.map((item, index) => (
                        <Card key={item.id} className="card-elevated hover-lift scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{item.stock_symbol}</h3>
                                  <Badge variant="outline" className="text-xs">{item.sector}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.stock_name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.quantity} shares @ ₹{item.average_price.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg">
                                  ₹{item.total_invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStock({ symbol: item.stock_symbol, name: item.stock_name });
                                    setShowAIPanel(true);
                                  }}
                                  className="mt-2"
                                >
                                  <LineChart className="h-3 w-3 mr-1" />
                                  View Chart
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stocks in your portfolio</p>
                    <p className="text-sm">Add stocks to your portfolio to track your investments</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('search')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stocks
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                {portfolio.length > 0 ? (
                  <PortfolioAnalytics portfolio={portfolio} metrics={portfolioMetrics} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No portfolio data available</p>
                    <p className="text-sm">Add stocks to your portfolio to see analytics</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('search')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stocks
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <PortfolioInsights 
                  portfolioData={portfolio.map(item => ({
                    symbol: item.stock_symbol,
                    name: item.stock_name,
                    price: item.average_price,
                    change: (Math.random() - 0.5) * 10,
                    quantity: item.quantity,
                    sector: item.sector
                  }))} 
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - AI Analysis & Charts */}
          <div className="space-y-6 scale-in" style={{ animationDelay: '0.2s' }}>
            {/* API Status Indicator (Dev Only) */}
            {env.IS_DEVELOPMENT && <APIStatusIndicator />}
            
            {/* Featured Stock Chart */}
            {selectedStock && (
              <StockChart 
                symbol={selectedStock.symbol} 
                name={selectedStock.name}
              />
            )}

            {/* Market Stats */}
            <Card className="glass border-primary/20 hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {marketStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg glass-hover fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 pulse-glow">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={stat.isPositive ? "default" : "destructive"} 
                        className="text-sm"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {showAIPanel && selectedStock ? (
              <AIAnalysisPanel
                stockData={selectedStock}
                newsItems={[
                  { title: 'Company reports strong Q3 earnings' },
                  { title: 'New product launch announced' }
                ]}
              />
            ) : (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Analysis
                  </CardTitle>
                  <CardDescription>
                    Select a stock to get AI-powered insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click on any stock to view detailed AI analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add to Portfolio Dialog */}
        <AddToPortfolioDialog
          open={showAddToPortfolio}
          onOpenChange={setShowAddToPortfolio}
          stock={portfolioStock}
          onConfirm={handleConfirmAddToPortfolio}
          currentPrice={portfolioStock ? Math.random() * 5000 + 100 : 0}
        />
      </div>
    </div>
  );
};

export default AIEnhancedDashboard;