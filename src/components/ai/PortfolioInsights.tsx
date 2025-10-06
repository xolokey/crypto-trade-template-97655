import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, AlertCircle, TrendingUp, Shield, Target } from 'lucide-react';
import { generatePortfolioInsights, isGeminiAvailable } from '@/lib/gemini';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PortfolioInsightsProps {
  portfolioData: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    quantity: number;
    sector?: string;
  }>;
}

const PortfolioInsights = ({ portfolioData }: PortfolioInsightsProps) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const totalValue = portfolioData.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0);
  const totalGainLoss = portfolioData.reduce((sum, stock) => sum + (stock.change * stock.quantity), 0);

  const handleGenerateInsights = async () => {
    if (!isGeminiAvailable()) {
      setError('AI insights are not available. Please configure Gemini API key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await generatePortfolioInsights(portfolioData);
      setInsights(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const portfolioStats = [
    {
      label: 'Total Value',
      value: `₹${totalValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      label: 'Total P&L',
      value: `₹${totalGainLoss.toLocaleString()}`,
      icon: totalGainLoss >= 0 ? TrendingUp : Shield,
      color: totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Holdings',
      value: portfolioData.length.toString(),
      icon: Target,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI Portfolio Insights</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            Powered by Gemini
          </Badge>
        </div>
        <CardDescription>
          Get personalized AI analysis of your portfolio performance and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {portfolioStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center p-4">
                  <Icon className={`h-8 w-8 ${stat.color} mr-3`} />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Generate Insights Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Portfolio Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered insights on diversification, risk, and recommendations
            </p>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={loading || portfolioData.length === 0}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Insights Display */}
        {insights && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {insights}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!insights && !error && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No insights generated yet</p>
            <p className="text-xs">
              {portfolioData.length === 0 
                ? 'Add stocks to your portfolio to get AI insights'
                : 'Click "Generate Insights" to analyze your portfolio'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioInsights;