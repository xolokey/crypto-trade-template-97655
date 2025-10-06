import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, BarChart3, Newspaper, Loader2, AlertCircle } from 'lucide-react';
import { generateStockAnalysis, isGeminiAvailable } from '@/lib/gemini';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIAnalysisPanelProps {
  stockData: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    volume: number;
    high52w: number;
    low52w: number;
    marketCap?: string;
    pe?: number;
    sector?: string;
  };
  newsItems?: Array<{ title: string; summary?: string }>;
}

const AIAnalysisPanel = ({ stockData, newsItems = [] }: AIAnalysisPanelProps) => {
  const [activeTab, setActiveTab] = useState('technical');
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAnalysis = async (type: 'technical' | 'fundamental' | 'news', retryCount = 0) => {
    if (!isGeminiAvailable()) {
      setErrors(prev => ({
        ...prev,
        [type]: 'AI analysis is not available. Please configure Gemini API key in .env file.'
      }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: '' }));

    try {
      console.log(`Attempting ${type} analysis for ${stockData.symbol}...`);
      const result = await generateStockAnalysis(type, stockData, newsItems);
      setAnalysis(prev => ({ ...prev, [type]: result }));
      console.log(`${type} analysis completed successfully`);
    } catch (error) {
      console.error(`${type} analysis failed:`, error);
      
      // Retry once if it's a network error
      if (retryCount === 0 && error instanceof Error && 
          (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log('Retrying analysis...');
        setTimeout(() => handleAnalysis(type, 1), 1000);
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      setErrors(prev => ({
        ...prev,
        [type]: errorMessage
      }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const analysisTypes = [
    {
      id: 'technical',
      label: 'Technical',
      icon: TrendingUp,
      description: 'Price trends, support/resistance levels'
    },
    {
      id: 'fundamental',
      label: 'Fundamental',
      icon: BarChart3,
      description: 'Financial health, growth prospects'
    },
    {
      id: 'news',
      label: 'News Impact',
      icon: Newspaper,
      description: 'Recent news sentiment analysis'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI Stock Analysis</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            Powered by Gemini
          </Badge>
        </div>
        <CardDescription>
          Get AI-powered insights for {stockData.symbol} using advanced analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {type.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {analysisTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{type.label} Analysis</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Button
                  onClick={() => handleAnalysis(type.id as any)}
                  disabled={loading[type.id]}
                  size="sm"
                >
                  {loading[type.id] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </Button>
              </div>

              {errors[type.id] && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors[type.id]}</AlertDescription>
                </Alert>
              )}

              {analysis[type.id] && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {analysis[type.id]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!analysis[type.id] && !errors[type.id] && !loading[type.id] && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Generate Analysis" to get AI-powered insights</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIAnalysisPanel;