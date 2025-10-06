import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveMarketIndices from '@/components/market/LiveMarketIndices';
import LiveStockTicker from '@/components/market/LiveStockTicker';
import { getNifty50Stocks } from '@/data/nseStocks';
import { ConnectionStatusIndicator } from '@/components/realtime/ConnectionStatusIndicator';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';

interface LiveStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sector: string;
}

const LiveMarket = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveStocks, setLiveStocks] = useState<LiveStock[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Use real-time connection for connection status
  const { isConnected, isRealTime, connectionState, lastUpdate, latency } = useRealTimeStock({
    symbol: 'NIFTY',
    enableWebSocket: true,
    fallbackToPolling: true
  });

  // Initialize stocks
  useEffect(() => {
    const stocks = getNifty50Stocks().slice(0, 20);
    const initialStocks = stocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      price: Math.random() * 5000 + 100,
      change: (Math.random() - 0.5) * 100,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 10000000),
      sector: stock.sector
    }));
    setLiveStocks(initialStocks);
  }, []);

  // Update prices
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStocks(prev => prev.map(stock => {
        const volatility = stock.price * 0.002;
        const priceChange = (Math.random() - 0.5) * volatility;
        const newPrice = stock.price + priceChange;
        const newChange = stock.change + priceChange;
        const newChangePercent = (newChange / (newPrice - newChange)) * 100;

        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          volume: stock.volume + Math.floor(Math.random() * 10000)
        };
      }));
      setCurrentTime(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <h1 className="text-xl font-bold">Live Market View</h1>
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {currentTime.toLocaleTimeString('en-IN')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white border-white/20"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Ticker */}
      <LiveStockTicker />

      {/* Main Content */}
      <div className="container px-4 py-6 space-y-6">
        {/* Market Indices */}
        <LiveMarketIndices />

        {/* Live Stock Grid */}
        <Card className="bg-black/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Top Nifty 50 Stocks - Live</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveStocks.map((stock) => {
                const isPositive = stock.changePercent >= 0;
                return (
                  <Card
                    key={stock.symbol}
                    className={`bg-gradient-to-br ${
                      isPositive
                        ? 'from-green-900/20 to-green-950/10 border-green-500/20'
                        : 'from-red-900/20 to-red-950/10 border-red-500/20'
                    } transition-all duration-300 hover:scale-105`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-white">{stock.symbol}</h3>
                            <p className="text-xs text-gray-400 truncate max-w-[150px]">
                              {stock.name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isPositive
                                ? 'border-green-500/50 text-green-400'
                                : 'border-red-500/50 text-red-400'
                            }`}
                          >
                            {stock.sector}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-white">
                            ₹{stock.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isPositive ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {isPositive ? '+' : ''}
                              {stock.change.toFixed(2)}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                isPositive ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              ({isPositive ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%)
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Vol: {(stock.volume / 1000000).toFixed(2)}M
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Live market data updates every 2 seconds • Based on NSE real-time simulation
          </p>
          <p className="mt-1">
            Market hours: 9:15 AM - 3:30 PM IST (Mon-Fri)
          </p>
        </div>
      </div>
      
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator
        isConnected={isConnected}
        isRealTime={isRealTime}
        connectionState={connectionState}
        lastUpdate={lastUpdate}
        latency={latency}
        showDetails={true}
        position="top-right"
      />
    </div>
  );
};

export default LiveMarket;
