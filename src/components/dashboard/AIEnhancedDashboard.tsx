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
  Plus
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
import { isGeminiAvailable } from '@/lib/gemini';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePortfolio } from '@/hooks/usePortfolio';
import { NSEStock } from '@/data/nseStocks';
import { env } from '@/config/env';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Live Stock Ticker */}
        <LiveStockTicker />

        {/* Live Market Indices */}
        <LiveMarketIndices />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search, Watchlist and Portfolio */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="watchlist">
                  <Star className="h-4 w-4 mr-2" />
                  Watchlist ({watchlist.length})
                </TabsTrigger>
                <TabsTrigger value="portfolio">
                  <Wallet className="h-4 w-4 mr-2" />
                  Portfolio ({portfolio.length})
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Insights
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
                    Loading portfolio...
                  </div>
                ) : portfolio.length > 0 ? (
                  <div className="space-y-6">
                    {/* Portfolio Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Total Invested</div>
                          <div className="text-2xl font-bold">
                            {portfolioMetrics.totalInvested.toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Current Value</div>
                          <div className="text-2xl font-bold">
                            {portfolioMetrics.currentValue.toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Total P&L</div>
                          <div className={`text-2xl font-bold ${
                            portfolioMetrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {portfolioMetrics.totalGainLoss >= 0 ? '+' : ''}
                            {portfolioMetrics.totalGainLoss.toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Holdings</div>
                          <div className="text-2xl font-bold">{portfolioMetrics.totalStocks}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Portfolio Holdings */}
                    <div className="space-y-4">
                      {portfolio.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{item.stock_symbol}</h3>
                                <p className="text-sm text-muted-foreground">{item.stock_name}</p>
                                <Badge variant="outline" className="mt-1">{item.sector}</Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  {item.quantity} shares @ ₹{item.average_price}
                                </div>
                                <div className="font-semibold">
                                  ₹{item.total_invested.toLocaleString()}
                                </div>
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

          {/* Right Column - AI Analysis */}
          <div className="space-y-6">
            {/* API Status Indicator (Dev Only) */}
            {env.IS_DEVELOPMENT && <APIStatusIndicator />}
            
            {showAIPanel && selectedStock ? (
              <AIAnalysisPanel
                stockData={selectedStock}
                newsItems={[
                  { title: 'Company reports strong Q3 earnings' },
                  { title: 'New product launch announced' }
                ]}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis
                  </CardTitle>
                  <CardDescription>
                    Select a stock to get AI-powered insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click on any stock card to view AI analysis</p>
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