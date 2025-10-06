// Hook for managing price alerts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PriceAlert {
  id: string;
  user_id: string;
  stock_symbol: string;
  stock_name?: string;
  alert_type: 'above' | 'below' | 'change_up' | 'change_down';
  target_price?: number;
  target_percent?: number;
  current_price?: number;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at?: string;
  notification_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export function usePriceAlerts(userId?: string) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch alerts
  const fetchAlerts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use type assertion since the table isn't in generated types yet
      const { data, error } = await (supabase as any)
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAlerts((data || []) as PriceAlert[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
      toast({
        title: 'Error',
        description: 'Failed to load price alerts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create alert
  const createAlert = async (alert: Omit<PriceAlert, 'id' | 'user_id' | 'is_triggered' | 'triggered_at' | 'notification_sent' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create alerts',
        variant: 'destructive'
      });
      return null;
    }

    try {
      // Use type assertion since the table isn't in generated types yet
      const { data, error } = await (supabase as any)
        .from('price_alerts')
        .insert([{ ...alert, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      setAlerts(prev => [data as PriceAlert, ...prev]);
      
      toast({
        title: 'Alert Created',
        description: `Price alert set for ${alert.stock_symbol}`,
      });

      return data as PriceAlert;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create alert',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Update alert
  const updateAlert = async (id: string, updates: Partial<PriceAlert>) => {
    try {
      // Use type assertion since the table isn't in generated types yet
      const { data, error } = await (supabase as any)
        .from('price_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAlerts(prev => prev.map(alert => alert.id === id ? data as PriceAlert : alert));
      
      toast({
        title: 'Alert Updated',
        description: 'Price alert has been updated',
      });

      return data as PriceAlert;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update alert',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Delete alert
  const deleteAlert = async (id: string) => {
    try {
      // Use type assertion since the table isn't in generated types yet
      const { error } = await (supabase as any)
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== id));
      
      toast({
        title: 'Alert Deleted',
        description: 'Price alert has been removed',
      });

      return true;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Toggle alert active status
  const toggleAlert = async (id: string, isActive: boolean) => {
    return updateAlert(id, { is_active: isActive });
  };

  // Get active alerts for a stock
  const getAlertsForStock = (symbol: string) => {
    return alerts.filter(alert => 
      alert.stock_symbol === symbol && alert.is_active && !alert.is_triggered
    );
  };

  // Get triggered alerts
  const getTriggeredAlerts = () => {
    return alerts.filter(alert => alert.is_triggered);
  };

  // Get active alerts count
  const getActiveAlertsCount = () => {
    return alerts.filter(alert => alert.is_active && !alert.is_triggered).length;
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time updates
    if (userId) {
      const subscription = supabase
        .channel('price_alerts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'price_alerts',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setAlerts(prev => [payload.new as PriceAlert, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setAlerts(prev => prev.map(alert => 
                alert.id === payload.new.id ? payload.new as PriceAlert : alert
              ));
            } else if (payload.eventType === 'DELETE') {
              setAlerts(prev => prev.filter(alert => alert.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    getAlertsForStock,
    getTriggeredAlerts,
    getActiveAlertsCount,
    refetch: fetchAlerts
  };
}
