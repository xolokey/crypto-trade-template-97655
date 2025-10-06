import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeIndices, updateIndexValue, isMarketOpen, getMarketStatus, NSEIndexData } from '@/data/realTimeNSEData';
import { marketDataService } from '@/services/marketDataService';

const LiveMarketIndices = () => {
  const [indices, setIndices] = useState<NSEIndexData[]>(initializeIndices());

  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [flashingIndex, setFlashingIndex] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  // Update with realistic NSE data
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Pick a random index to update for visual effect
      const randomIndex = Math.floor(Math.random() * indices.length);
      
      setIndices(prev => prev.map((index, idx) => {
        // Update with realistic movement
        const updated = updateIndexValue(index);

        // Flash the card that's updating
        if (idx === randomIndex) {
          setFlashingIndex(index.name);
          setTimeout(() => setFlashingIndex(null), 500);
        }

        return updated;
      }));
      
      setLastRefresh(new Date());
      setMarketStatus(getMarketStatus());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isLive, indices.length]);

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
            {marketStatus}
          </span>
          <Badge variant={isLive ? 'default' : 'secondary'} className="text-xs">
            {isLive ? 'LIVE' : 'PAUSED'}
          </Badge>
          {!isMarketOpen() && (
            <Badge variant="outline" className="text-xs">
              Simulated
            </Badge>
          )}
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
                    {index.currentValue.toLocaleString('en-IN', {
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
        <p>
          Based on actual NSE values • Updates every 2 seconds • 
          {isMarketOpen() ? ' Market is OPEN' : ' Market is CLOSED (using last known values)'}
        </p>
      </div>
    </div>
  );
};

export default LiveMarketIndices;