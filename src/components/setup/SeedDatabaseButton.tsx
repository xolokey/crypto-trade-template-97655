import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedStocksDatabase } from '@/utils/seedStocks';

export const SeedDatabaseButton = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const { toast } = useToast();

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    
    try {
      const result = await seedStocksDatabase();
      
      if (result.success) {
        setIsSeeded(true);
        toast({
          title: 'Database Seeded Successfully',
          description: result.message,
        });
      } else {
        toast({
          title: 'Seeding Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed database',
        variant: 'destructive'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isSeeded) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        Database Seeded
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSeedDatabase}
      disabled={isSeeding}
      className="gap-2"
    >
      {isSeeding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Seeding Database...
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Seed Stock Database
        </>
      )}
    </Button>
  );
};
