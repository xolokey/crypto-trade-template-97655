import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Loader2, Newspaper, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  stockId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
}

export const AIInsights = ({ stockId, symbol, name, currentPrice, changePercent }: AIInsightsProps) => {
  const [newsLoading, setNewsLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-analysis', {
        body: { 
          stockSymbol: symbol, 
          stockName: name, 
          currentPrice,
          changePercent,
          analysisType: 'news' 
        }
      });

      if (error) throw error;
      
      const parsedNews = JSON.parse(data.analysis);
      setNews(parsedNews);
    } catch (error: any) {
      toast({
        title: "Error fetching news",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchPrediction = async () => {
    setPredictionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-analysis', {
        body: { 
          stockSymbol: symbol, 
          stockName: name,
          currentPrice,
          changePercent,
          analysisType: 'prediction' 
        }
      });

      if (error) throw error;
      
      const parsedPrediction = JSON.parse(data.analysis);
      setPrediction(parsedPrediction);
    } catch (error: any) {
      toast({
        title: "Error fetching prediction",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button 
          onClick={fetchNews} 
          disabled={newsLoading}
          className="flex-1"
        >
          {newsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Newspaper className="mr-2 h-4 w-4" />}
          Get Latest News
        </Button>
        <Button 
          onClick={fetchPrediction} 
          disabled={predictionLoading}
          className="flex-1"
        >
          {predictionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
          AI Prediction
        </Button>
      </div>

      {news.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Latest News & Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {news.map((item, index) => (
              <div key={index} className="border-l-2 border-primary pl-4 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <Badge variant={
                        item.sentiment === 'positive' ? 'default' : 
                        item.sentiment === 'negative' ? 'destructive' : 
                        'secondary'
                      }>
                        {item.sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {prediction && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI-Powered Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Support Level</p>
                <p className="text-2xl font-bold text-green-500">₹{prediction.supportLevel}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Resistance Level</p>
                <p className="text-2xl font-bold text-red-500">₹{prediction.resistanceLevel}</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Prediction ({prediction.timeframe})</p>
              <p className="text-sm">{prediction.prediction}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Technical Signals</p>
              <div className="flex flex-wrap gap-2">
                {prediction.technicalSignals?.map((signal: string, index: number) => (
                  <Badge key={index} variant="outline">{signal}</Badge>
                ))}
              </div>
            </div>

            {prediction.riskFactors && (
              <div className="p-4 bg-muted rounded-lg border-l-2 border-destructive">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Factors
                </p>
                <ul className="text-sm space-y-1">
                  {prediction.riskFactors.map((risk: string, index: number) => (
                    <li key={index}>• {risk}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <span className="text-sm font-semibold">Confidence Score</span>
              <span className="text-2xl font-bold">{prediction.confidenceScore}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};