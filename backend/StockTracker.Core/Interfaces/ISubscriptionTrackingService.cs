namespace StockTracker.Core.Interfaces;

/// <summary>
/// Service for tracking active WebSocket subscriptions
/// </summary>
public interface ISubscriptionTrackingService
{
    /// <summary>
    /// Add symbols to active subscriptions
    /// </summary>
    Task AddSubscriptionsAsync(List<string> symbols);

    /// <summary>
    /// Remove symbols from active subscriptions
    /// </summary>
    Task RemoveSubscriptionsAsync(List<string> symbols);

    /// <summary>
    /// Check if a symbol is actively subscribed
    /// </summary>
    Task<bool> IsSymbolSubscribedAsync(string symbol);

    /// <summary>
    /// Get all actively subscribed symbols
    /// </summary>
    Task<HashSet<string>> GetActiveSubscriptionsAsync();

    /// <summary>
    /// Increment subscription count for a symbol
    /// </summary>
    Task IncrementSubscriptionCountAsync(string symbol);

    /// <summary>
    /// Decrement subscription count for a symbol
    /// </summary>
    Task DecrementSubscriptionCountAsync(string symbol);

    /// <summary>
    /// Get subscription count for a symbol
    /// </summary>
    Task<int> GetSubscriptionCountAsync(string symbol);

    /// <summary>
    /// Clear all subscriptions (for maintenance/reset)
    /// </summary>
    Task ClearAllSubscriptionsAsync();
}
