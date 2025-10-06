// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } else {
    fn();
  }
};

export const logWebVitals = (metric: any) => {
  if (import.meta.env.PROD) {
    // In production, you might want to send these to an analytics service
    console.log(metric);
  }
};

// Report Core Web Vitals
export const reportWebVitals = async () => {
  if (import.meta.env.PROD) {
    try {
      // @ts-ignore - web-vitals is optional
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      getCLS(logWebVitals);
      getFID(logWebVitals);
      getFCP(logWebVitals);
      getLCP(logWebVitals);
      getTTFB(logWebVitals);
    } catch (error) {
      console.warn('Web Vitals not available:', error);
    }
  }
};