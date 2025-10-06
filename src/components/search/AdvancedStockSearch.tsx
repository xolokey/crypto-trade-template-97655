import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Star, 
  Plus, 
  TrendingUp, 
  Building2, 
  Factory,
  X,
  Eye
} from 'lucide-react';
import { 
  searchStocks, 
  getAllSectors, 
  getAllIndustries, 
  getNifty50Stocks,
  getSensex30Stocks,
  getNiftyNext50Stocks,
  getMidCapStocks,
  getSmallCapStocks,
  NSEStock 
} from '@/data/nseStocks';
import EnhancedStockCard from '@/components/stocks/EnhancedStockCard';

interface AdvancedStockSearchProps {
  onAddToWatchlist?: (stock: NSEStock) => void;
  onAddToPortfolio?: (stock: NSEStock) => void;
  onViewDetails?: (stock: NSEStock) => void;
  watchlistedStocks?: string[];
}

const AdvancedStockSearch = ({
  onAddToWatchlist,
  onAddToPortfolio,
  onViewDetails,
  watchlistedStocks = []
}: AdvancedStockSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const sectors = getAllSectors();
  const industries = getAllIndustries();

  // Filter stocks based on search and filters
  const filteredStocks = useMemo(() => {
    let stocks: NSEStock[] = [];

    // Get stocks based on active tab
    switch (activeTab) {
      case 'nifty50':
        stocks = getNifty50Stocks();
        break;
      case 'sensex30':
        stocks = getSensex30Stocks();
        break;
      case 'niftynext50':
        stocks = getNiftyNext50Stocks();
        break;
      case 'midcap':
        stocks = getMidCapStocks();
        break;
      case 'smallcap':
        stocks = getSmallCapStocks();
        break;
      default:
        stocks = searchQuery ? searchStocks(searchQuery) : [];
    }

    // Apply sector filter
    if (selectedSector !== 'all') {
      stocks = stocks.filter(stock => stock.sector === selectedSector);
    }

    // Apply industry filter
    if (selectedIndustry !== 'all') {
      stocks = stocks.filter(stock => stock.industry === selectedIndustry);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'nifty50':
          stocks = stocks.filter(stock => stock.isNifty50);
          break;
        case 'sensex30':
          stocks = stocks.filter(stock => stock.isSensex30);
          break;
        case 'midcap':
          stocks = stocks.filter(stock => stock.isNiftyMidcap);
          break;
        case 'smallcap':
          stocks = stocks.filter(stock => stock.isNiftySmallcap);
          break;
      }
    }

    return stocks.slice(0, 50); // Limit results for performance
  }, [searchQuery, selectedSector, selectedIndustry, selectedCategory, activeTab]);

  const clearFilters = () => {
    setSelectedSector('all');
    setSelectedIndustry('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedSector !== 'all' || selectedIndustry !== 'all' || selectedCategory !== 'all';

  // Mock stock data generator for display
  const generateMockStockData = (stock: NSEStock) => ({
    id: stock.symbol,
    symbol: stock.symbol,
    name: stock.name,
    price: Math.random() * 5000 + 100,
    change: (Math.random() - 0.5) * 100,
    changePercent: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000),
    marketCap: stock.marketCap,
    sector: stock.sector,
    high52w: Math.random() * 6000 + 100,
    low52w: Math.random() * 2000 + 50
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Stock Search & Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks by name, symbol, sector, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Sector</label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="nifty50">Nifty 50</SelectItem>
                    <SelectItem value="sensex30">Sensex 30</SelectItem>
                    <SelectItem value="midcap">Mid Cap</SelectItem>
                    <SelectItem value="smallcap">Small Cap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Categories Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="nifty50">Nifty 50</TabsTrigger>
          <TabsTrigger value="sensex30">Sensex 30</TabsTrigger>
          <TabsTrigger value="niftynext50">Next 50</TabsTrigger>
          <TabsTrigger value="midcap">Mid Cap</TabsTrigger>
          <TabsTrigger value="smallcap">Small Cap</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              {filteredStocks.length} results for "{searchQuery}"
            </div>
          )}
          
          {!searchQuery && activeTab === 'search' && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Search NSE Stocks</p>
              <p>Enter a stock name, symbol, sector, or industry to search</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="nifty50" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {filteredStocks.length} Nifty 50 stocks
          </div>
        </TabsContent>

        <TabsContent value="sensex30" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {filteredStocks.length} Sensex 30 stocks
          </div>
        </TabsContent>

        <TabsContent value="niftynext50" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {filteredStocks.length} Nifty Next 50 stocks
          </div>
        </TabsContent>

        <TabsContent value="midcap" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Factory className="h-4 w-4" />
            {filteredStocks.length} Mid Cap stocks
          </div>
        </TabsContent>

        <TabsContent value="smallcap" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Factory className="h-4 w-4" />
            {filteredStocks.length} Small Cap stocks
          </div>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {filteredStocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => {
            const mockData = generateMockStockData(stock);
            return (
              <EnhancedStockCard
                key={stock.symbol}
                stock={mockData}
                isWatchlisted={watchlistedStocks.includes(stock.symbol)}
                onToggleWatchlist={() => onAddToWatchlist?.(stock)}
                onViewDetails={() => onViewDetails?.(stock)}
                onAIAnalysis={() => onViewDetails?.(stock)}
                onAddToPortfolio={() => onAddToPortfolio?.(stock)}
              />
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredStocks.length === 0 && (searchQuery || activeTab !== 'search') && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No stocks found</p>
          <p>Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedStockSearch;