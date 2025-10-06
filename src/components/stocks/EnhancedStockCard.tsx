import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  StarOff, 
  MoreVertical,
  Brain,
  Eye,
  Plus,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface EnhancedStockCardProps {
  stock: {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: string;
    sector?: string;
    high52w?: number;
    low52w?: number;
  };
  isWatchlisted?: boolean;
  onToggleWatchlist?: (stockId: string) => void;
  onViewDetails?: (stockId: string) => void;
  onAIAnalysis?: (stock: any) => void;
  onAddToPortfolio?: (stock: any) => void;
  className?: string;
}

const EnhancedStockCard = ({
  stock: initialStock,
  isWatchlisted = false,
  onToggleWatchlist,
  onViewDetails,
  onAIAnalysis,
  onAddToPortfolio,
  className
}: EnhancedStockCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [stock, setStock] = useState(initialStock);
  const [isUpdating, setIsUpdating] = useState(false);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setStock(prev => {
        const volatility = prev.price * 0.001; // 0.1% volatility
        const priceChange = (Math.random() - 0.5) * volatility;
        const newPrice = prev.price + priceChange;
        const newChange = prev.change + priceChange;
        const newChangePercent = (newChange / (newPrice - newChange)) * 100;

        return {
          ...prev,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent
        };
      });
      
      setTimeout(() => setIsUpdating(false), 300);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBgColor = isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
    if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(stock.id)}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{stock.symbol}</h3>
              {isUpdating && (
                <Activity className="h-3 w-3 text-green-600 animate-pulse" />
              )}
              {stock.sector && (
                <Badge variant="outline" className="text-xs">
                  {stock.sector}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {stock.name}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist?.(stock.id);
              }}
              className="h-8 w-8 p-0"
            >
              {isWatchlisted ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(stock.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAIAnalysis?.(stock)}>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToPortfolio?.(stock)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Portfolio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Price and Change */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{formatPrice(stock.price)}</p>
          </div>
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md border", changeBgColor)}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className={cn("font-semibold text-sm", changeColor)}>
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Volume</p>
            <p className="font-medium">{formatVolume(stock.volume)}</p>
          </div>
          {stock.marketCap && (
            <div>
              <p className="text-muted-foreground">Market Cap</p>
              <p className="font-medium">{stock.marketCap}</p>
            </div>
          )}
        </div>

        {/* 52W Range */}
        {stock.high52w && stock.low52w && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">52W Range</p>
            <div className="relative">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-green-400 rounded-full"
                  style={{
                    width: `${((stock.price - stock.low52w) / (stock.high52w - stock.low52w)) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatPrice(stock.low52w)}</span>
                <span>{formatPrice(stock.high52w)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAIAnalysis?.(stock);
              }}
            >
              <Brain className="h-4 w-4 mr-1" />
              AI Analysis
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPortfolio?.(stock);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Portfolio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedStockCard;