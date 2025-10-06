import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { env } from '@/config/env';
import { isGeminiAvailable } from '@/lib/gemini';
import { isRealTimeDataAvailable } from '@/lib/marketData';

const APIStatusIndicator = () => {
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    gemini: false,
    alphaVantage: false,
    twelveData: false
  });

  const checkAPIs = async () => {
    setTesting(true);
    
    const status = {
      gemini: isGeminiAvailable(),
      alphaVantage: !!env.ALPHA_VANTAGE_API_KEY,
      twelveData: !!env.TWELVE_DATA_API_KEY
    };

    // Test Twelve Data
    if (env.TWELVE_DATA_API_KEY) {
      try {
        const response = await fetch(
          `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${env.TWELVE_DATA_API_KEY}`,
          { mode: 'cors' }
        );
        const data = await response.json();
        status.twelveData = !!data.symbol && data.status !== 'error';
        if (data.status === 'error') {
          console.warn('Twelve Data API Error:', data.message);
        }
      } catch (error) {
        console.warn('Twelve Data test failed:', error);
        status.twelveData = false;
      }
    }

    // Test Alpha Vantage
    if (env.ALPHA_VANTAGE_API_KEY) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${env.ALPHA_VANTAGE_API_KEY}`,
          { mode: 'cors' }
        );
        const data = await response.json();
        status.alphaVantage = !!data['Global Quote'] && !data.Note;
        if (data.Note) {
          console.warn('Alpha Vantage rate limit:', data.Note);
        }
      } catch (error) {
        console.warn('Alpha Vantage test failed:', error);
        status.alphaVantage = false;
      }
    }

    setApiStatus(status);
    setTesting(false);
  };

  useEffect(() => {
    checkAPIs();
  }, []);

  const StatusIcon = ({ status }: { status: boolean }) => {
    if (status) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const hasAnyAPI = apiStatus.gemini || apiStatus.alphaVantage || apiStatus.twelveData;

  if (!env.IS_DEVELOPMENT) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">API Status (Dev Only)</CardTitle>
            <CardDescription className="text-xs">
              Check if your API keys are working
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkAPIs}
            disabled={testing}
          >
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <StatusIcon status={apiStatus.gemini} />
            Gemini AI
          </span>
          <Badge variant={apiStatus.gemini ? 'default' : 'secondary'}>
            {apiStatus.gemini ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <StatusIcon status={apiStatus.twelveData} />
            Twelve Data
          </span>
          <Badge variant={apiStatus.twelveData ? 'default' : 'secondary'}>
            {apiStatus.twelveData ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <StatusIcon status={apiStatus.alphaVantage} />
            Alpha Vantage
          </span>
          <Badge variant={apiStatus.alphaVantage ? 'default' : 'secondary'}>
            {apiStatus.alphaVantage ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {!hasAnyAPI && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mt-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">No API keys detected</p>
              <p className="mt-1">Add API keys to .env file and restart the server</p>
            </div>
          </div>
        )}

        {(!apiStatus.alphaVantage || !apiStatus.twelveData) && (apiStatus.gemini) && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md mt-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium">Market Data APIs Inactive</p>
              <p className="mt-1">This is normal - NSE stocks may have CORS restrictions. The app will use mock data for prices and charts.</p>
              <p className="mt-1">AI features are working! ✅</p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>Environment: {env.IS_DEVELOPMENT ? 'Development' : 'Production'}</p>
          <p className="mt-1">
            Keys configured: {[
              env.GEMINI_API_KEY && 'Gemini',
              env.ALPHA_VANTAGE_API_KEY && 'Alpha Vantage',
              env.TWELVE_DATA_API_KEY && 'Twelve Data'
            ].filter(Boolean).join(', ') || 'None'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIStatusIndicator;