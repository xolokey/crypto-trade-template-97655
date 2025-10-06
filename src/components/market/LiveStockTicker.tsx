import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getNifty50Stocks } from '@/data/nseStocks';

interface TickerStock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const LiveStockTicker = () => {
  const [stocks, setStocks] = useState<TickerStock[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize with top stocks
  useEffect(() => {
    const niftyStocks = getNifty50Stocks().slice(0, 20); // Top 20 stocks
    const initialStocks = niftyStocks.map(stock => ({
      symbol: stock.symbol,
      price: Math.random() * 5000 + 100,
      change: (Math.random() - 0.5) * 100,
      changePercent: (Math.random() - 0.5) * 5
    }));
    setStocks(initialStocks);
  }, []);

  // Update prices in real-time
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setStocks(prev => prev.map(stock => {
        const volatility = stock.price * 0.001; // 0.1% volatility
        const priceChange = (Math.random() - 0.5) * volatility;
        const newPrice = stock.price + priceChange;
        const newChange = stock.change + priceChange;
        const newChangePercent = (newChange / (newPrice - newChange)) * 100;

        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent
        };
      }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 border-y border-primary/20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Live indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium">LIVE</span>
      </div>
      
      <div className={`flex ${isPaused ? '' : 'animate-scroll'}`}>
        {/* Duplicate stocks for seamless loop */}
        {[...stocks, ...stocks].map((stock, index) => {
          const isPositive = stock.changePercent >= 0;
          const Icon = isPositive ? TrendingUp : TrendingDown;
          const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

          return (
            <div
              key={`${stock.symbol}-${index}`}
              className="flex items-center gap-3 px-6 py-3 whitespace-nowrap border-r border-border/50"
            >
              <span className="font-semibold text-sm">{stock.symbol}</span>
              <span className="text-sm font-medium">
                ₹{stock.price.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 ${colorClass}`}>
                <Icon className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveStockTicker;