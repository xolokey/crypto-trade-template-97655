namespace StockTracker.Core.Exceptions;

/// <summary>
/// Exception thrown when rate limit is exceeded
/// </summary>
public class RateLimitException : BaseException
{
    public int RetryAfterSeconds { get; }

    public RateLimitException(string message, int retryAfterSeconds = 60) 
        : base(message, "RATE_LIMIT_EXCEEDED", 429)
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}
