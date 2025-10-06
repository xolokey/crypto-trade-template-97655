import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  onCreateAlert: (alert: any) => Promise<void>;
}

export function CreateAlertDialog({
  open,
  onOpenChange,
  stockSymbol,
  stockName,
  currentPrice,
  onCreateAlert
}: CreateAlertDialogProps) {
  const [alertType, setAlertType] = useState<'above' | 'below' | 'change_up' | 'change_down'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetPercent, setTargetPercent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const alert = {
        stock_symbol: stockSymbol,
        stock_name: stockName,
        alert_type: alertType,
        current_price: currentPrice,
        is_active: true,
        ...(alertType === 'above' || alertType === 'below' 
          ? { target_price: parseFloat(targetPrice) }
          : { target_percent: parseFloat(targetPercent) }
        )
      };

      await onCreateAlert(alert);
      onOpenChange(false);
      
      // Reset form
      setTargetPrice('');
      setTargetPercent('');
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPriceAlert = alertType === 'above' || alertType === 'below';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when {stockSymbol} reaches your target
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Stock</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-semibold">{stockSymbol}</p>
              <p className="text-sm text-muted-foreground">{stockName}</p>
              <p className="text-sm">Current: ₹{currentPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-type">Alert Type</Label>
            <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
              <SelectTrigger id="alert-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Price goes above</SelectItem>
                <SelectItem value="below">Price goes below</SelectItem>
                <SelectItem value="change_up">Increases by %</SelectItem>
                <SelectItem value="change_down">Decreases by %</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isPriceAlert ? (
            <div className="space-y-2">
              <Label htmlFor="target-price">Target Price (₹)</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                placeholder="Enter target price"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="target-percent">Target Percentage (%)</Label>
              <Input
                id="target-percent"
                type="number"
                step="0.1"
                placeholder="Enter percentage"
                value={targetPercent}
                onChange={(e) => setTargetPercent(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
