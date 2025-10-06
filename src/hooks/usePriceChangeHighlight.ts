import { useState, useEffect, useRef } from 'react';

export type PriceChangeDirection = 'up' | 'down' | 'none';

interface UsePriceChangeHighlightOptions {
  price: number | null | undefined;
  duration?: number; // Duration of highlight in ms
}

export function usePriceChangeHighlight({ 
  price, 
  duration = 2000 
}: UsePriceChangeHighlightOptions) {
  const [direction, setDirection] = useState<PriceChangeDirection>('none');
  const previousPriceRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (price === null || price === undefined) return;

    const previousPrice = previousPriceRef.current;

    if (previousPrice !== null && previousPrice !== price) {
      // Determine direction
      const newDirection: PriceChangeDirection = price > previousPrice ? 'up' : 'down';
      setDirection(newDirection);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset direction after duration
      timeoutRef.current = setTimeout(() => {
        setDirection('none');
      }, duration);
    }

    previousPriceRef.current = price;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [price, duration]);

  // Get CSS classes for highlighting
  const getHighlightClass = () => {
    switch (direction) {
      case 'up':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 transition-colors duration-300';
      case 'down':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 transition-colors duration-300';
      default:
        return 'transition-colors duration-300';
    }
  };

  return {
    direction,
    highlightClass: getHighlightClass(),
    isHighlighting: direction !== 'none'
  };
}
