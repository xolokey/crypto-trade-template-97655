// Advanced Stock Screener with Multi-Criteria Filtering
// Professional-grade stock screening with technical and fundamental filters

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign,
  Percent,
  Activity,
  Target,
  Shield,
  Zap,
  Save,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStocks } from '@/hooks/useStocks';
import { getNifty50Stocks, getSensex30Stocks } from '@/data/nseStocks';

export interface ScreeningCriteria {
  // Price filters
  priceMin?: number;
  priceMax?: number;
  
  // Volume filters
  volumeMin?: number;
  volumeMax?: number;
  
  // Market cap filters
  marketCapMin?: number;
  marketCapMax?: number;
  
  // Performance filters
  changePercentMin?: number;
  changePercentMax?: number;
  
  // Technical filters
  rsiMin?: number;
  rsiMax?: number;
  
  // Fundamental filters
  peRatioMin?: number;
  peRatioMax?: number;
  
  // Sector filter
  sectors?: string[];
  
  // Index membership
  indices?: ('nifty50' | 'sensex30')[];
}

interface ScreenedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  rsi: number;
  peRatio: number;
  index: string;
  score: number;
}

interface SavedScreener {
  id: string;
  name: string;
  criteria: ScreeningCriteria;
  createdAt: Date;
}

const AdvancedStockScreener: React.FC = () => {
  const [criteria, setCriteria] = useState<ScreeningCriteria>({});
  const [screenedStocks, setScreenedStocks] = useState<ScreenedStock[]>([]);
  const [isScreening, setIsScreening] = useState(false);
  const [sortBy, setSortBy] = useState<keyof ScreenedStock>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [savedScreeners, setSavedScreeners] = useState<SavedScreener[]>([]);
  const [screenerName, setScreenerName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const { stocks } = useStocks();

  // Available sectors
  const sectors = [
    'Technology', 'Banking', 'Pharmaceuticals', 'Automotive', 'Energy',
    'FMCG', 'Metals', 'Telecom', 'Real Estate', 'Infrastructure'
  ];

  // Generate sample stock data for screening
  const generateStockData = (): ScreenedStock[] => {
    const nifty50 = getNifty50Stocks();
    const sensex30 = getSensex30Stocks();
    
    const allStocks = [...nifty50, ...sensex30].reduce((unique, stock) => {
      if (!unique.find(s => s.symbol === stock.symbol)) {
        unique.push(stock);
      }
      return unique;
    }, [] as any[]);

    return allStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      price: Math.random() * 5000 + 100,
      change: (Math.random() - 0.5) * 200,
      changePercent: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 50000000),
      marketCap: Math.random() * 500000 + 10000, // in crores
      sector: stock.sector,
      rsi: Math.random() * 100,
      peRatio: Math.random() * 50 + 5,
      index: nifty50.find(s => s.symbol === stock.symbol) ? 'NIFTY 50' : 'SENSEX 30',
      score: 0
    }));
  };

  // All available stocks
  const allStocks = useMemo(() => generateStockData(), []);

  // Apply screening criteria
  const applyScreening = () => {
    setIsScreening(true);
    
    setTimeout(() => {
      let filtered = [...allStocks];

      // Apply price filters
      if (criteria.priceMin !== undefined) {
        filtered = filtered.filter(stock => stock.price >= criteria.priceMin!);
      }
      if (criteria.priceMax !== undefined) {
        filtered = filtered.filter(stock => stock.price <= criteria.priceMax!);
      }

      // Apply volume filters
      if (criteria.volumeMin !== undefined) {
        filtered = filtered.filter(stock => stock.volume >= criteria.volumeMin!);
      }
      if (criteria.volumeMax !== undefined) {
        filtered = filtered.filter(stock => stock.volume <= criteria.volumeMax!);
      }

      // Apply market cap filters
      if (criteria.marketCapMin !== undefined) {
        filtered = filtered.filter(stock => stock.marketCap >= criteria.marketCapMin!);
      }
      if (criteria.marketCapMax !== undefined) {
        filtered = filtered.filter(stock => stock.marketCap <= criteria.marketCapMax!);
      }

      // Apply performance filters
      if (criteria.changePercentMin !== undefined) {
        filtered = filtered.filter(stock => stock.changePercent >= criteria.changePercentMin!);
      }
      if (criteria.changePercentMax !== undefined) {
        filtered = filtered.filter(stock => stock.changePercent <= criteria.changePercentMax!);
      }

      // Apply RSI filters
      if (criteria.rsiMin !== undefined) {
        filtered = filtered.filter(stock => stock.rsi >= criteria.rsiMin!);
      }
      if (criteria.rsiMax !== undefined) {
        filtered = filtered.filter(stock => stock.rsi <= criteria.rsiMax!);
      }

      // Apply P/E ratio filters
      if (criteria.peRatioMin !== undefined) {
        filtered = filtered.filter(stock => stock.peRatio >= criteria.peRatioMin!);
      }
      if (criteria.peRatioMax !== undefined) {
        filtered = filtered.filter(stock => stock.peRatio <= criteria.peRatioMax!);
      }

      // Apply sector filters
      if (criteria.sectors && criteria.sectors.length > 0) {
        filtered = filtered.filter(stock => criteria.sectors!.includes(stock.sector));
      }

      // Apply index filters
      if (criteria.indices && criteria.indices.length > 0) {
        filtered = filtered.filter(stock => {
          if (criteria.indices!.includes('nifty50') && stock.index === 'NIFTY 50') return true;
          if (criteria.indices!.includes('sensex30') && stock.index === 'SENSEX 30') return true;
          return false;
        });
      }

      // Calculate screening score
      filtered = filtered.map(stock => ({
        ...stock,
        score: calculateScreeningScore(stock, criteria)
      }));

      // Sort results
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const multiplier = sortOrder === 'desc' ? -1 : 1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * multiplier;
        }
        return String(aVal).localeCompare(String(bVal)) * multiplier;
      });

      setScreenedStocks(filtered);
      setIsScreening(false);
    }, 1000);
  };

  // Calculate screening score based on criteria match
  const calculateScreeningScore = (stock: ScreenedStock, criteria: ScreeningCriteria): number => {
    let score = 50; // Base score

    // Performance scoring
    if (stock.changePercent > 5) score += 20;
    else if (stock.changePercent > 2) score += 10;
    else if (stock.changePercent < -5) score -= 20;
    else if (stock.changePercent < -2) score -= 10;

    // RSI scoring
    if (stock.rsi < 30) score += 15; // Oversold - potential buy
    else if (stock.rsi > 70) score -= 15; // Overbought - potential sell
    else if (stock.rsi >= 40 && stock.rsi <= 60) score += 5; // Neutral zone

    // Volume scoring
    if (stock.volume > 10000000) score += 10; // High volume
    else if (stock.volume < 1000000) score -= 5; // Low volume

    // P/E ratio scoring
    if (stock.peRatio < 15) score += 10; // Undervalued
    else if (stock.peRatio > 30) score -= 10; // Overvalued

    // Market cap scoring
    if (stock.marketCap > 100000) score += 5; // Large cap stability

    return Math.max(0, Math.min(100, score));
  };

  // Save screener
  const saveScreener = () => {
    if (!screenerName.trim()) return;

    const newScreener: SavedScreener = {
      id: Date.now().toString(),
      name: screenerName,
      criteria: { ...criteria },
      createdAt: new Date()
    };

    setSavedScreeners(prev => [...prev, newScreener]);
    setScreenerName('');
    setShowSaveDialog(false);
  };

  // Load saved screener
  const loadScreener = (screener: SavedScreener) => {
    setCriteria(screener.criteria);
    applyScreening();
  };

  // Reset criteria
  const resetCriteria = () => {
    setCriteria({});
    setScreenedStocks([]);
  };

  // Export results
  const exportResults = () => {
    const csv = [
      ['Symbol', 'Name', 'Price', 'Change %', 'Volume', 'Market Cap', 'RSI', 'P/E', 'Score'].join(','),
      ...screenedStocks.map(stock => [
        stock.symbol,
        stock.name,
        stock.price.toFixed(2),
        stock.changePercent.toFixed(2),
        stock.volume,
        stock.marketCap.toFixed(0),
        stock.rsi.toFixed(1),
        stock.peRatio.toFixed(1),
        stock.score.toFixed(0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_screening_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Stock Screener</h2>
          <p className="text-muted-foreground">Filter stocks based on technical and fundamental criteria</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetCriteria}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Screener
          </Button>
          {screenedStocks.length > 0 && (
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Screening Criteria */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Screening Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="price" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="price">Price</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="fundamental">Fundamental</TabsTrigger>
                </TabsList>

                <TabsContent value="price" className="space-y-4">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Price Range (₹)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={criteria.priceMin || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          priceMin: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={criteria.priceMax || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          priceMax: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                    </div>
                  </div>

                  {/* Volume Range */}
                  <div className="space-y-2">
                    <Label>Volume Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={criteria.volumeMin || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          volumeMin: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={criteria.volumeMax || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          volumeMax: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                    </div>
                  </div>

                  {/* Market Cap Range */}
                  <div className="space-y-2">
                    <Label>Market Cap (₹ Cr)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={criteria.marketCapMin || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          marketCapMin: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={criteria.marketCapMax || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          marketCapMax: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                    </div>
                  </div>

                  {/* Change Percent Range */}
                  <div className="space-y-2">
                    <Label>Change % Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={criteria.changePercentMin || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          changePercentMin: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={criteria.changePercentMax || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          changePercentMax: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  {/* RSI Range */}
                  <div className="space-y-2">
                    <Label>RSI Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min (0-100)"
                        value={criteria.rsiMin || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          rsiMin: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max (0-100)"
                        value={criteria.rsiMax || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          rsiMax: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                    </div>
                  </div>

                  {/* Quick RSI Filters */}
                  <div className="space-y-2">
                    <Label>Quick RSI Filters</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCriteria(prev => ({ ...prev, rsiMin: 0, rsiMax: 30 }))}
                      >
                        Oversold (&lt;30)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCriteria(prev => ({ ...prev, rsiMin: 70, rsiMax: 100 }))}
                      >
                        Overbought (&gt;70)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCriteria(prev => ({ ...prev, rsiMin: 40, rsiMax: 60 }))}
                      >
                        Neutral (40-60)
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fundamental" className="space-y-4">
                  {/* P/E Ratio Range */}
                  <div className="space-y-2">
                    <Label>P/E Ratio Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={criteria.peRatioMin || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          peRatioMin: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={criteria.peRatioMax || ''}
                        onChange={(e) => setCriteria(prev => ({
                          ...prev,
                          peRatioMax: e.target.value ? Number(e.target.value) : undefined
                        }))}
                      />
                    </div>
                  </div>

                  {/* Sector Filter */}
                  <div className="space-y-2">
                    <Label>Sectors</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sectors.map(sector => (
                        <div key={sector} className="flex items-center space-x-2">
                          <Switch
                            id={sector}
                            checked={criteria.sectors?.includes(sector) || false}
                            onCheckedChange={(checked) => {
                              setCriteria(prev => ({
                                ...prev,
                                sectors: checked
                                  ? [...(prev.sectors || []), sector]
                                  : (prev.sectors || []).filter(s => s !== sector)
                              }));
                            }}
                          />
                          <Label htmlFor={sector} className="text-sm">{sector}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Index Filter */}
                  <div className="space-y-2">
                    <Label>Index Membership</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nifty50"
                          checked={criteria.indices?.includes('nifty50') || false}
                          onCheckedChange={(checked) => {
                            setCriteria(prev => ({
                              ...prev,
                              indices: checked
                                ? [...(prev.indices || []), 'nifty50']
                                : (prev.indices || []).filter(i => i !== 'nifty50')
                            }));
                          }}
                        />
                        <Label htmlFor="nifty50" className="text-sm">NIFTY 50</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="sensex30"
                          checked={criteria.indices?.includes('sensex30') || false}
                          onCheckedChange={(checked) => {
                            setCriteria(prev => ({
                              ...prev,
                              indices: checked
                                ? [...(prev.indices || []), 'sensex30']
                                : (prev.indices || []).filter(i => i !== 'sensex30')
                            }));
                          }}
                        />
                        <Label htmlFor="sensex30" className="text-sm">SENSEX 30</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />

              <Button 
                onClick={applyScreening} 
                className="w-full"
                disabled={isScreening}
              >
                {isScreening ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Screening...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Run Screening
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Saved Screeners */}
          {savedScreeners.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Saved Screeners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedScreeners.map(screener => (
                    <Button
                      key={screener.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => loadScreener(screener)}
                    >
                      {screener.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Screening Results
                  {screenedStocks.length > 0 && (
                    <Badge variant="secondary">{screenedStocks.length} stocks</Badge>
                  )}
                </CardTitle>
                
                {screenedStocks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof ScreenedStock)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Score</SelectItem>
                        <SelectItem value="changePercent">Change %</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="rsi">RSI</SelectItem>
                        <SelectItem value="peRatio">P/E Ratio</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'desc' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {screenedStocks.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No screening results</h3>
                  <p className="text-muted-foreground">
                    Set your criteria and click "Run Screening" to find matching stocks
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {screenedStocks.map((stock, index) => (
                      <motion.div
                        key={stock.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <h3 className="font-bold">{stock.symbol}</h3>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {stock.name}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{stock.sector}</Badge>
                                <Badge variant="secondary">{stock.index}</Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="font-bold">₹{stock.price.toFixed(2)}</div>
                                <div className={`text-sm ${
                                  stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">RSI</div>
                                <div className={`font-medium ${
                                  stock.rsi < 30 ? 'text-green-500' : 
                                  stock.rsi > 70 ? 'text-red-500' : 'text-foreground'
                                }`}>
                                  {stock.rsi.toFixed(1)}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">P/E</div>
                                <div className="font-medium">{stock.peRatio.toFixed(1)}</div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Score</div>
                                <Badge 
                                  variant={stock.score >= 70 ? 'default' : 
                                          stock.score >= 50 ? 'secondary' : 'outline'}
                                >
                                  {stock.score.toFixed(0)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Screener Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Save Screener</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="screener-name">Screener Name</Label>
                  <Input
                    id="screener-name"
                    value={screenerName}
                    onChange={(e) => setScreenerName(e.target.value)}
                    placeholder="Enter screener name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveScreener} disabled={!screenerName.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedStockScreener;