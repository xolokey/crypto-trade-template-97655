import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const DatabaseSetupBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkTables = async () => {
      try {
        // Try to query watchlists and portfolio tables
        const { error: watchlistError } = await supabase
          .from('watchlists')
          .select('id')
          .limit(1);

        const { error: portfolioError } = await supabase
          .from('portfolio')
          .select('id')
          .limit(1);

        // If either table doesn't exist, show banner
        if ((watchlistError && watchlistError.code === 'PGRST205') || 
            (portfolioError && portfolioError.code === 'PGRST205')) {
          setShowBanner(true);
        }
      } catch (error) {
        console.error('Error checking tables:', error);
      }
    };

    checkTables();
  }, []);

  if (!showBanner || dismissed) return null;

  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <Database className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
        <span>Database Setup Required</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <p className="mb-2">
          Watchlist and Portfolio features require database tables to be created.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/msesvmlvhrhdipfbhvub/editor', '_blank')}
            className="text-yellow-800 border-yellow-600 hover:bg-yellow-100"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open Supabase Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/SETUP_DATABASE.md', '_blank')}
            className="text-yellow-800 border-yellow-600 hover:bg-yellow-100"
          >
            View Setup Instructions
          </Button>
        </div>
        <p className="text-xs mt-2">
          This only needs to be done once. See SETUP_DATABASE.md for detailed instructions.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseSetupBanner;