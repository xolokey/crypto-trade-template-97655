import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  name: string;
}

const StockChart = ({ symbol, name }: StockChartProps) => {
  const [timeframe, setTimeframe] = useState('1D');
  
  // Mock data generation for different timeframes
  const generateMockData = (points: number) => {
    const basePrice = 2500 + Math.random() * 500;
    return Array.from({ length: points }, (_, i) => {
      const variance = (Math.random() - 0.5) * 50;
      return {
        time: i,
        price: basePrice + variance + (Math.sin(i / 10) * 20),
        volume: Math.floor(Math.random() * 1000000) + 500000
      };
    });
  };

  const getDataForTimeframe = () => {
    switch(timeframe) {
      case '1D': return generateMockData(78); // 5min intervals
      case '1W': return generateMockData(35); // 30min intervals
      case '1M': return generateMockData(30); // daily
      case '3M': return generateMockData(90); // daily
      case '1Y': return generateMockData(52); // weekly
      case 'ALL': return generateMockData(100); // monthly
      default: return generateMockData(78);
    }
  };

  const data = getDataForTimeframe();
  const priceChange = data[data.length - 1].price - data[0].price;
  const priceChangePercent = (priceChange / data[0].price) * 100;

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-lg border border-primary/20">
          <p className="text-sm font-semibold">
            ₹{payload[0].value.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Volume: {payload[0].payload.volume.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol}
              {priceChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ₹{data[data.length - 1].price.toFixed(2)}
            </div>
            <div className={`text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}₹{Math.abs(priceChange).toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeframe Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className={timeframe === tf ? 'bg-primary text-primary-foreground' : ''}
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={['dataMin - 10', 'dataMax + 10']}
                tickFormatter={(value) => `₹${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#4ADE80"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-sm font-semibold">₹{data[0].price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className="text-sm font-semibold text-green-500">
                ₹{Math.max(...data.map(d => d.price)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="text-sm font-semibold text-red-500">
                ₹{Math.min(...data.map(d => d.price)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-sm font-semibold">
                {(data.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;