// Advanced Trading Chart Component
// Professional-grade interactive charts with technical indicators

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Maximize2, 
  Settings,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { technicalAnalysisService, OHLCV, TechnicalIndicators } from '@/services/technicalAnalysisService';

export interface ChartData extends OHLCV {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
}

interface AdvancedTradingChartProps {
  symbol: string;
  data: OHLCV[];
  realTimePrice?: number;
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
}

type ChartType = 'candlestick' | 'line' | 'area' | 'heikin-ashi';
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
type Indicator = 'sma20' | 'sma50' | 'sma200' | 'ema12' | 'ema26' | 'bollinger' | 'rsi' | 'macd' | 'volume';

const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({
  symbol,
  data,
  realTimePrice,
  height = 600,
  showVolume = true,
  showIndicators = true,
  onTimeframeChange
}) => {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(
    new Set(['sma20', 'sma50', 'volume'])
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [technicalData, setTechnicalData] = useState<TechnicalIndicators | null>(null);
  const [crosshairData, setCrosshairData] = useState<any>(null);
  
  const chartRef = useRef<HTMLDivElement>(null);

  // Process data with technical indicators
  useEffect(() => {
    const processData = async () => {
      if (!data || data.length === 0) return;

      try {
        // Calculate technical indicators
        const prices = data.map(d => d.close);
        const sma20 = technicalAnalysisService.calculateSMA(prices, 20);
        const sma50 = technicalAnalysisService.calculateSMA(prices, 50);
        const sma200 = technicalAnalysisService.calculateSMA(prices, 200);
        const ema12 = technicalAnalysisService.calculateEMA(prices, 12);
        const ema26 = technicalAnalysisService.calculateEMA(prices, 26);
        
        const macdData = technicalAnalysisService.calculateMACD(prices);
        const bollingerBands = technicalAnalysisService.calculateBollingerBands(prices);
        
        // Combine data with indicators
        const processedData: ChartData[] = data.map((item, index) => {
          const rsi = index >= 14 ? technicalAnalysisService.calculateRSI(prices.slice(0, index + 1)) : 50;
          
          return {
            ...item,
            timestamp: item.timestamp,
            sma20: sma20[index - 19] || undefined,
            sma50: sma50[index - 49] || undefined,
            sma200: sma200[index - 199] || undefined,
            ema12: ema12[index - 11] || undefined,
            ema26: ema26[index - 25] || undefined,
            rsi,
            macd: index === data.length - 1 ? macdData.macd : undefined,
            signal: index === data.length - 1 ? macdData.signal : undefined,
            histogram: index === data.length - 1 ? macdData.histogram : undefined,
            bollingerUpper: index === data.length - 1 ? bollingerBands.upper : undefined,
            bollingerLower: index === data.length - 1 ? bollingerBands.lower : undefined,
          };
        });

        setChartData(processedData);

        // Get latest technical analysis
        const analysis = await technicalAnalysisService.analyzeTechnicals(symbol, data);
        setTechnicalData(analysis.indicators);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setChartData(data.map(item => ({ ...item })));
      }
    };

    processData();
  }, [data, symbol]);

  // Handle timeframe changes
  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    onTimeframeChange?.(newTimeframe);
  };

  // Toggle indicators
  const toggleIndicator = (indicator: Indicator) => {
    const newIndicators = new Set(activeIndicators);
    if (newIndicators.has(indicator)) {
      newIndicators.delete(indicator);
    } else {
      newIndicators.add(indicator);
    }
    setActiveIndicators(newIndicators);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">
          {new Date(label).toLocaleDateString()} {new Date(label).toLocaleTimeString()}
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span>Open:</span>
            <span className="font-mono">₹{data.open?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>High:</span>
            <span className="font-mono text-green-500">₹{data.high?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Low:</span>
            <span className="font-mono text-red-500">₹{data.low?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Close:</span>
            <span className="font-mono">₹{data.close?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Volume:</span>
            <span className="font-mono">{(data.volume / 1000000).toFixed(2)}M</span>
          </div>
          {data.rsi && (
            <div className="flex justify-between gap-4">
              <span>RSI:</span>
              <span className="font-mono">{data.rsi.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Candlestick component
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isGreen = close > open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={high}
          x2={x + width / 2}
          y2={low}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + 1}
          y={bodyY}
          width={width - 2}
          height={bodyHeight || 1}
          fill={isGreen ? color : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Main chart component
  const renderMainChart = () => {
    if (!chartData.length) return null;

    const chartHeight = showVolume ? height * 0.7 : height;

    switch (chartType) {
      case 'candlestick':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                stroke="#9ca3af"
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                stroke="#9ca3af"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Candlesticks */}
              <Bar dataKey="close" shape={<CandlestickBar />} />
              
              {/* Moving Averages */}
              {activeIndicators.has('sma20') && (
                <Line 
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              )}
              {activeIndicators.has('sma50') && (
                <Line 
                  type="monotone" 
                  dataKey="sma50" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              )}
              {activeIndicators.has('sma200') && (
                <Line 
                  type="monotone" 
                  dataKey="sma200" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {/* Bollinger Bands */}
              {activeIndicators.has('bollinger') && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="bollingerUpper" 
                    stroke="#8b5cf6" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bollingerLower" 
                    stroke="#8b5cf6" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
              
              {/* Real-time price line */}
              {realTimePrice && (
                <ReferenceLine 
                  y={realTimePrice} 
                  stroke="#22c55e" 
                  strokeDasharray="3 3"
                  label={{ value: `₹${realTimePrice.toFixed(2)}`, position: 'right' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                stroke="#9ca3af"
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                stroke="#9ca3af"
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="#3b82f6" 
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Volume chart
  const renderVolumeChart = () => {
    if (!showVolume || !chartData.length) return null;

    return (
      <ResponsiveContainer width="100%" height={height * 0.3}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
            stroke="#9ca3af"
          />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Bar dataKey="volume" fill="#6b7280" opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Technical indicators panel
  const renderIndicatorsPanel = () => {
    if (!technicalData) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card/50 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">RSI</div>
          <div className={`text-lg font-bold ${
            technicalData.rsi > 70 ? 'text-red-500' : 
            technicalData.rsi < 30 ? 'text-green-500' : 'text-foreground'
          }`}>
            {technicalData.rsi.toFixed(1)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">MACD</div>
          <div className={`text-lg font-bold ${
            technicalData.macd.histogram > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {technicalData.macd.macd.toFixed(4)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">ATR</div>
          <div className="text-lg font-bold text-foreground">
            {technicalData.atr.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Volume Ratio</div>
          <div className={`text-lg font-bold ${
            technicalData.volume.volumeRatio > 1.5 ? 'text-green-500' : 
            technicalData.volume.volumeRatio < 0.8 ? 'text-red-500' : 'text-foreground'
          }`}>
            {technicalData.volume.volumeRatio.toFixed(2)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-background/95 backdrop-blur-sm`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
            {realTimePrice && (
              <Badge variant="outline" className="animate-pulse">
                ₹{realTimePrice.toFixed(2)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Timeframe selector */}
            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
                <SelectItem value="1w">1w</SelectItem>
                <SelectItem value="1M">1M</SelectItem>
              </SelectContent>
            </Select>

            {/* Chart type selector */}
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="candlestick">📊</TabsTrigger>
                <TabsTrigger value="line">📈</TabsTrigger>
                <TabsTrigger value="area">📉</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-card/50 rounded-lg"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sma20"
                    checked={activeIndicators.has('sma20')}
                    onCheckedChange={() => toggleIndicator('sma20')}
                  />
                  <Label htmlFor="sma20" className="text-sm">SMA 20</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sma50"
                    checked={activeIndicators.has('sma50')}
                    onCheckedChange={() => toggleIndicator('sma50')}
                  />
                  <Label htmlFor="sma50" className="text-sm">SMA 50</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bollinger"
                    checked={activeIndicators.has('bollinger')}
                    onCheckedChange={() => toggleIndicator('bollinger')}
                  />
                  <Label htmlFor="bollinger" className="text-sm">Bollinger</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="volume"
                    checked={activeIndicators.has('volume')}
                    onCheckedChange={() => toggleIndicator('volume')}
                  />
                  <Label htmlFor="volume" className="text-sm">Volume</Label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="p-0">
        {/* Technical indicators panel */}
        {showIndicators && renderIndicatorsPanel()}
        
        {/* Main chart */}
        <div ref={chartRef} className="w-full">
          {renderMainChart()}
        </div>
        
        {/* Volume chart */}
        {renderVolumeChart()}
      </CardContent>
    </Card>
  );
};

export default AdvancedTradingChart;