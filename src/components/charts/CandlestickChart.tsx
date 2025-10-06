import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  fetchHistoricalDataMultiSource, 
  TimeFrame, 
  HistoricalData,
  isRealTimeDataAvailable 
} from '@/lib/marketData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface CandlestickChartProps {
  symbol: string;
  stockName: string;
}

const CandlestickChart = ({ symbol, stockName }: CandlestickChartProps) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1d');
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: '1m', label: '1 Min' },
    { value: '5m', label: '5 Min' },
    { value: '15m', label: '15 Min' },
    { value: '30m', label: '30 Min' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hour' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
    { value: '1M', label: '1 Month' }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const historicalData = await fetchHistoricalDataMultiSource(symbol, timeframe, 100);
      setData(historicalData);
    } catch (err) {
      setError('Failed to fetch chart data');
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, timeframe]);

  // Transform data for recharts
  const chartData = data?.data.map(candle => ({
    timestamp: new Date(candle.timestamp).toLocaleDateString(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    // For candlestick visualization
    range: [candle.low, candle.high],
    body: candle.close >= candle.open ? [candle.open, candle.close] : [candle.close, candle.open],
    isGreen: candle.close >= candle.open
  })).reverse() || [];

  // Calculate price change
  const priceChange = data && data.data.length > 1 ? 
    ((data.data[0].close - data.data[data.data.length - 1].close) / data.data[data.data.length - 1].close) * 100 : 0;

  const isPositive = priceChange >= 0;

  // Custom candlestick renderer
  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;

    const isGreen = payload.isGreen;
    const color = isGreen ? '#10b981' : '#ef4444';
    const wickX = x + width / 2;

    return (
      <g>
        {/* Wick (high-low line) */}
        <line
          x1={wickX}
          y1={y}
          x2={wickX}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body (open-close rectangle) */}
        <rect
          x={x}
          y={isGreen ? y + height * 0.3 : y}
          width={width}
          height={height * 0.4}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {symbol} Chart
            </CardTitle>
            <CardDescription>{stockName}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isRealTimeDataAvailable() && (
              <Badge variant="secondary">Mock Data</Badge>
            )}
            {data && (
              <Badge variant={isPositive ? 'default' : 'destructive'}>
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeframe Selector */}
        <div className="flex flex-wrap gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={timeframe === tf.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf.value)}
              disabled={loading}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Chart Tabs */}
        <Tabs defaultValue="candlestick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value="candlestick" className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `₹${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="high" 
                    fill="#10b981" 
                    name="High"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="low" 
                    fill="#ef4444" 
                    name="Low"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#8b5cf6" 
                    name="Close"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="line" className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `₹${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#8b5cf6" 
                    name="Close Price"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="open" 
                    stroke="#3b82f6" 
                    name="Open Price"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="volume" className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => value.toLocaleString()}
                  />
                  <Legend />
                  <Bar 
                    dataKey="volume" 
                    fill="#8b5cf6" 
                    name="Volume"
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Chart Info */}
        {data && data.data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Open</p>
              <p className="font-semibold">₹{data.data[0].open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">High</p>
              <p className="font-semibold text-green-600">₹{data.data[0].high.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Low</p>
              <p className="font-semibold text-red-600">₹{data.data[0].low.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Close</p>
              <p className="font-semibold">₹{data.data[0].close.toFixed(2)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandlestickChart;