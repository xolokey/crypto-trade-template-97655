/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  // Network errors are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // Check HTTP status codes
  if (error.response?.status) {
    return retryableStatusCodes.includes(error.response.status);
  }

  // Check for specific error types
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry and exponential backoff
 * 
 * @example
 * ```typescript
 * const data = await fetchWithRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx except specific ones)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (!config.retryableStatusCodes.includes(error.response.status)) {
          throw error;
        }
      }

      // Check if error is retryable
      if (!isRetryableError(error, config.retryableStatusCodes)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      console.warn(
        `Request failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
        `Retrying in ${delay}ms...`,
        error.message
      );

      // Call retry callback
      config.onRetry(attempt + 1, error);

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Fetch with retry specifically for HTTP requests
 * 
 * @example
 * ```typescript
 * const response = await fetchWithRetryHttp('/api/stocks/RELIANCE', {
 *   method: 'GET',
 *   headers: { 'Content-Type': 'application/json' }
 * });
 * ```
 */
export async function fetchWithRetryHttp(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return fetchWithRetry(async () => {
    const response = await fetch(url, init);

    // Throw error for non-ok responses so retry logic can handle them
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = response;
      throw error;
    }

    return response;
  }, retryOptions);
}

/**
 * Fetch JSON with retry
 * 
 * @example
 * ```typescript
 * const data = await fetchJsonWithRetry<StockQuote>('/api/stocks/RELIANCE');
 * ```
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetryHttp(url, init, retryOptions);
  return response.json();
}

/**
 * Create a retry wrapper for any async function
 * 
 * @example
 * ```typescript
 * const retryableGetStock = withRetry(getStockQuote, { maxRetries: 3 });
 * const stock = await retryableGetStock('RELIANCE');
 * ```
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options?: RetryOptions
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => fetchWithRetry(() => fn(...args), options);
}
