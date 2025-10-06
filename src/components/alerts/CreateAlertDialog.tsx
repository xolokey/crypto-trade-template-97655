import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { alertValidationSchema, AlertFormValues } from '@/utils/validationSchemas';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

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
  const [loading, setLoading] = useState(false);

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
    reset
  } = useFormValidation<AlertFormValues>(
    { targetPrice: '', targetPercent: '' },
    alertValidationSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    setLoading(true);

    try {
      const isPriceAlert = alertType === 'above' || alertType === 'below';
      
      const alert = {
        stock_symbol: stockSymbol,
        stock_name: stockName,
        alert_type: alertType,
        current_price: currentPrice,
        is_active: true,
        ...(isPriceAlert
          ? { target_price: parseFloat(values.targetPrice) }
          : { target_percent: parseFloat(values.targetPercent) }
        )
      };

      await onCreateAlert(alert);
      onOpenChange(false);
      
      // Reset form
      reset();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPriceAlert = alertType === 'above' || alertType === 'below';

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setAlertType('above');
    }
  }, [open, reset]);

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
                value={values.targetPrice}
                onChange={(e) => handleChange('targetPrice', e.target.value)}
                onBlur={() => handleBlur('targetPrice')}
                className={touched.targetPrice && errors.targetPrice ? 'border-destructive' : ''}
              />
              {touched.targetPrice && <ErrorMessage error={errors.targetPrice} />}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="target-percent">Target Percentage (%)</Label>
              <Input
                id="target-percent"
                type="number"
                step="0.1"
                placeholder="Enter percentage"
                value={values.targetPercent}
                onChange={(e) => handleChange('targetPercent', e.target.value)}
                onBlur={() => handleBlur('targetPercent')}
                className={touched.targetPercent && errors.targetPercent ? 'border-destructive' : ''}
              />
              {touched.targetPercent && <ErrorMessage error={errors.targetPercent} />}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (isPriceAlert ? !values.targetPrice : !values.targetPercent)} 
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
