import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { marketDataService } from "@/services/marketDataService";

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export function LiveIndexCard() {
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndexData = async () => {
    try {
      const data = await marketDataService.getNSEData('index') as unknown as IndexData;
      if (data) {
        setIndexData(data);
        setError(null);
      } else {
        setError("Unable to fetch live data");
      }
    } catch (err) {
      setError("Failed to fetch index data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchIndexData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !indexData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          {error || "No data available"}
        </CardContent>
      </Card>
    );
  }

  const isPositive = indexData.change >= 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{indexData.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">
              {indexData.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{isPositive ? '+' : ''}{indexData.change.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{indexData.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
          
          {indexData.high && indexData.low && (
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground pt-2 border-t">
              <div>
                <span className="block text-xs">High</span>
                <span className="font-medium text-foreground">{indexData.high.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-xs">Low</span>
                <span className="font-medium text-foreground">{indexData.low.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
