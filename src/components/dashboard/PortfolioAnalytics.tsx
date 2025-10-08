import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PortfolioAnalyticsProps {
  portfolio: any[];
  metrics: {
    totalInvested: number;
    currentValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    totalStocks: number;
  };
}

const PortfolioAnalytics = ({ portfolio, metrics }: PortfolioAnalyticsProps) => {
  // Sector allocation data
  const sectorData = portfolio.reduce((acc: any[], item) => {
    const existing = acc.find(s => s.name === item.sector);
    if (existing) {
      existing.value += item.total_invested;
    } else {
      acc.push({ name: item.sector || 'Other', value: item.total_invested });
    }
    return acc;
  }, []);

  // Top performers
  const topPerformers = portfolio
    .map(item => ({
      name: item.stock_symbol,
      value: ((Math.random() * 20) - 10), // Mock gain/loss %
      invested: item.total_invested
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#4ADE80', '#22c55e', '#16a34a', '#15803d', '#166534'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-lg border border-primary/20">
          <p className="text-sm font-semibold">{payload[0].name}</p>
          <p className="text-sm text-primary">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elevated hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Invested</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {metrics.totalInvested.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {metrics.totalStocks} stocks
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Value</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {metrics.currentValue.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Live market value
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total P&L</span>
              {metrics.totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={`text-2xl font-bold ${
              metrics.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {metrics.totalGainLoss >= 0 ? '+' : ''}
              {metrics.totalGainLoss.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.totalGainLossPercent >= 0 ? '+' : ''}
              {metrics.totalGainLossPercent.toFixed(2)}% returns
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Diversification</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{sectorData.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Sectors covered
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No portfolio data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPerformers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass p-3 rounded-lg border border-primary/20">
                            <p className="text-sm font-semibold">{payload[0].payload.name}</p>
                            <p className={`text-sm ${(payload[0].value as number) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(payload[0].value as number) >= 0 ? '+' : ''}{(payload[0].value as number).toFixed(2)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#4ADE80"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holdings Details */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Holdings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolio.map((item, index) => {
              const mockGain = (Math.random() * 20) - 10;
              const mockCurrentValue = item.total_invested * (1 + mockGain / 100);
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg glass-hover fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{item.stock_symbol}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.sector}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.stock_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.quantity} shares @ ₹{item.average_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{mockCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-sm flex items-center gap-1 justify-end ${
                      mockGain >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {mockGain >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {mockGain >= 0 ? '+' : ''}{mockGain.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Invested: ₹{item.total_invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioAnalytics;