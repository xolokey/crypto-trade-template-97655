import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

const LiveMarketIndices = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([
    {
      name: 'Nifty 50',
      value: 19674.25,
      change: 167.35,
      changePercent: 0.86,
      lastUpdate: new Date()
    },
    {
      name: 'Sensex',
      value: 65953.48,
      change: 471.23,
      changePercent: 0.72,
      lastUpdate: new Date()
    },
    {
      name: 'Bank Nifty',
      value: 44234.50,
      change: -123.45,
      changePercent: -0.28,
      lastUpdate: new Date()
    }
  ]);

  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [flashingIndex, setFlashingIndex] = useState<string | null>(null);

  // Simulate real-time updates with more visible changes
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Pick a random index to update for visual effect
      const randomIndex = Math.floor(Math.random() * 3);
      
      setIndices(prev => prev.map((index, idx) => {
        // Simulate more visible price movements (0.1% to 0.3%)
        const volatility = index.value * 0.002; // 0.2% volatility for more visible changes
        const priceChange = (Math.random() - 0.5) * volatility;
        const newValue = index.value + priceChange;
        const newChange = index.change + priceChange;
        const newChangePercent = (newChange / (newValue - newChange)) * 100;

        // Flash the card that's updating
        if (idx === randomIndex) {
          setFlashingIndex(index.name);
          setTimeout(() => setFlashingIndex(null), 500);
        }

        return {
          ...index,
          value: newValue,
          change: newChange,
          changePercent: newChangePercent,
          lastUpdate: new Date()
        };
      }));
      setLastRefresh(new Date());
    }, 2000); // Update every 2 seconds for more frequent updates

    return () => clearInterval(interval);
  }, [isLive]);

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${isLive ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            {isLive ? 'Live Market Data' : 'Market Data Paused'}
          </span>
          <Badge variant={isLive ? 'default' : 'secondary'} className="text-xs">
            {isLive ? 'LIVE' : 'PAUSED'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated: {formatTime(lastRefresh)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLive}
            className="h-7 px-2"
          >
            {isLive ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Pause
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Resume
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indices.map((index) => {
          const isPositive = index.change >= 0;
          const Icon = isPositive ? TrendingUp : TrendingDown;
          const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
          const bgClass = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

          return (
            <Card 
              key={index.name} 
              className={`relative overflow-hidden transition-all duration-300 ${
                flashingIndex === index.name ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
            >
              <div className={`absolute inset-0 ${bgClass} opacity-30`} />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{index.name}</h3>
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {index.value.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${colorClass}`}>
                      {isPositive ? '+' : ''}{index.change.toFixed(2)}
                    </span>
                    <span className={`text-sm font-medium ${colorClass}`}>
                      ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(index.lastUpdate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>Market data updates every 3 seconds • Simulated real-time data</p>
      </div>
    </div>
  );
};

export default LiveMarketIndices;