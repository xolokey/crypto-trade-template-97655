import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp } from 'lucide-react';
import { NSEStock } from '@/data/nseStocks';

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
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock || !quantity || !price) return;

    const quantityNum = parseInt(quantity);
    const priceNum = parseFloat(price);

    if (quantityNum <= 0 || priceNum <= 0) return;

    setLoading(true);
    try {
      await onConfirm({
        stock,
        quantity: quantityNum,
        price: priceNum
      });
      
      // Reset form
      setQuantity('');
      setPrice(currentPrice.toString());
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalInvestment = quantity && price ? 
    (parseInt(quantity) * parseFloat(price)).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    }) : '₹0';

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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
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
                  <p className="font-medium">{quantity || '0'} shares</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price per Share</p>
                  <p className="font-medium">₹{price || '0'}</p>
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
                disabled={loading || !quantity || !price}
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