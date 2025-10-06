import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp } from 'lucide-react';
import { NSEStock } from '@/data/nseStocks';
import { useFormValidation } from '@/hooks/useFormValidation';
import { portfolioValidationSchema, PortfolioFormValues } from '@/utils/validationSchemas';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface AddToPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: NSEStock | null;
  onConfirm: (data: { stock: NSEStock; quantity: number; price: number }) => void;
  currentPrice?: number;
}

const AddToPortfolioDialog = ({
  open,
  onOpenChange,
  stock,
  onConfirm,
  currentPrice = 0
}: AddToPortfolioDialogProps) => {
  const [loading, setLoading] = useState(false);

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues
  } = useFormValidation<PortfolioFormValues>(
    { quantity: '', price: currentPrice.toString() },
    portfolioValidationSchema
  );

  // Update price when currentPrice changes
  useEffect(() => {
    if (currentPrice > 0) {
      setValues({ ...values, price: currentPrice.toString() });
    }
  }, [currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock) return;

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    const quantityNum = parseInt(values.quantity);
    const priceNum = parseFloat(values.price);

    setLoading(true);
    try {
      onConfirm({
        stock,
        quantity: quantityNum,
        price: priceNum
      });
      
      // Reset form
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalInvestment = values.quantity && values.price ? 
    (parseInt(values.quantity) * parseFloat(values.price)).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    }) : '₹0';

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  if (!stock) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Add to Portfolio
          </DialogTitle>
          <DialogDescription>
            Add {stock.symbol} to your investment portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stock Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{stock.symbol}</h3>
              <Badge variant="outline">{stock.sector}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {stock.name}
            </p>
            {currentPrice > 0 && (
              <p className="text-sm font-medium mt-2">
                Current Price: ₹{currentPrice.toLocaleString()}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Shares)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="Enter number of shares"
                value={values.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                onBlur={() => handleBlur('quantity')}
                className={touched.quantity && errors.quantity ? 'border-destructive' : ''}
              />
              {touched.quantity && <ErrorMessage error={errors.quantity} />}
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="price">Price per Share (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter purchase price"
                value={values.price}
                onChange={(e) => handleChange('price', e.target.value)}
                onBlur={() => handleBlur('price')}
                className={touched.price && errors.price ? 'border-destructive' : ''}
              />
              {touched.price && <ErrorMessage error={errors.price} />}
              <p className="text-xs text-muted-foreground">
                Enter the price at which you bought or plan to buy the shares
              </p>
            </div>

            <Separator />

            {/* Investment Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Investment Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{values.quantity || '0'} shares</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price per Share</p>
                  <p className="font-medium">₹{values.price || '0'}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Investment</span>
                  <span className="text-lg font-bold text-primary">
                    {totalInvestment}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !values.quantity || !values.price}
                className="min-w-[100px]"
              >
                {loading ? 'Adding...' : 'Add to Portfolio'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPortfolioDialog;