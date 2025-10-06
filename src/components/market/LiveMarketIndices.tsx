import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeIndices, updateIndexValue, isMarketOpen, getMarketStatus, NSEIndexData } from '@/data/realTimeNSEData';
import { marketDataService } from '@/services/marketDataService';
import { useToast } from '@/hooks/use-toast';

const LiveMarketIndices = () => {
  const [indices, setIndices] = useState<NSEIndexData[]>(initializeIndices());
  const [useRealData, setUseRealData] = useState(false);
  const { toast } = useToast();

  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [flashingIndex, setFlashingIndex] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  // Fetch real data from .NET backend
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE}/api/market-data/indices`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            setUseRealData(true);
            
            // Map backend data to our format
            const mappedIndices = result.data.map((index: any) => ({
              name: index.name,
              baseValue: index.currentValue,
              currentValue: index.currentValue,
              change: index.change,
              changePercent: index.changePercent,
              high: index.high,
              low: index.low,
              open: index.open,
              previousClose: index.previousClose,
              lastUpdate: new Date(index.lastUpdate)
            }));
            
            setIndices(mappedIndices);
            console.log('✅ Using real market indices from backend');
            
            toast({
              title: "Real Data Connected",
              description: `Fetched ${result.data.length} live market indices`,
              duration: 3000,
            });
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ Backend API not available, using simulated data');
      }
      
      // Fallback to simulated data
      setUseRealData(false);
      toast({
        title: "Using Simulated Data",
        description: "Start the .NET backend for real market data",
        variant: "destructive",
        duration: 5000,
      });
    };

    fetchRealData();
  }, [toast]);

  // Update with real data from backend
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      if (useRealData) {
        // Fetch real data from .NET backend
        try {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          const response = await fetch(`${API_BASE}/api/market-data/indices`);
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
              const mappedIndices = result.data.map((index: any) => ({
                name: index.name,
                baseValue: index.currentValue,
                currentValue: index.currentValue,
                change: index.change,
                changePercent: index.changePercent,
                high: index.high,
                low: index.low,
                open: index.open,
                previousClose: index.previousClose,
                lastUpdate: new Date(index.lastUpdate)
              }));
              
              setIndices(mappedIndices);
              setLastRefresh(new Date());
              setMarketStatus(getMarketStatus());
              return;
            }
          }
        } catch (error) {
          console.log('API fetch failed, switching to simulated data');
          setUseRealData(false);
        }
      }
      
      // Simulated data update (fallback)
      const randomIndex = Math.floor(Math.random() * indices.length);
      
      setIndices(prev => prev.map((index, idx) => {
        const updated = updateIndexValue(index);
        if (idx === randomIndex) {
          setFlashingIndex(index.name);
          setTimeout(() => setFlashingIndex(null), 500);
        }
        return updated;
      }));
      
      setLastRefresh(new Date());
      setMarketStatus(getMarketStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, indices.length, useRealData]);

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
          {!useRealData && (
            <Badge variant="outline" className="text-xs text-orange-600">
              Simulated
            </Badge>
          )}
          {useRealData && (
            <Badge variant="outline" className="text-xs text-green-600">
              Real Data
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