import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Star, Plus, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedStockCardProps {
  stock: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    sector?: string;
  };
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
  onViewDetails?: () => void;
  onAddToPortfolio?: () => void;
}

const EnhancedStockCard = ({
  stock,
  isWatchlisted,
  onToggleWatchlist,
  onViewDetails,
  onAddToPortfolio
}: EnhancedStockCardProps) => {
  const isPositive = stock.changePercent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="card-elevated hover-lift cursor-pointer overflow-hidden group"
        onClick={onViewDetails}
      >
        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{stock.symbol}</h3>
                {stock.sector && (
                  <Badge variant="outline" className="text-xs">
                    {stock.sector}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{stock.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist?.();
              }}
              className="shrink-0"
            >
              <Star 
                className={`h-4 w-4 transition-all ${
                  isWatchlisted ? 'fill-primary text-primary' : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>

          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-2xl font-bold">₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? '+' : ''}₹{Math.abs(stock.change).toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Vol: {(stock.volume / 1000000).toFixed(2)}M</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.();
              }}
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary-dark"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPortfolio?.();
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedStockCard;