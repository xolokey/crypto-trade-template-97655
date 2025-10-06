namespace StockTracker.Core.Constants;

/// <summary>
/// Redis PubSub channel names for WebSocket communication
/// </summary>
public static class RedisChannels
{
    /// <summary>
    /// Channel for real-time price updates
    /// </summary>
    public const string MarketDataUpdates = "market-data:updates";
    
    /// <summary>
    /// Channel for subscription change notifications
    /// </summary>
    public const string MarketDataSubscriptions = "market-data:subscriptions";
    
    /// <summary>
    /// Channel for control messages (pause, resume, etc.)
    /// </summary>
    public const string MarketDataControl = "market-data:control";
}

/// <summary>
/// Redis key prefixes for data storage
/// </summary>
public static class RedisKeys
{
    /// <summary>
    /// Set of actively subscribed symbols
    /// Key format: subscriptions:active
    /// </summary>
    public const string ActiveSubscriptions = "subscriptions:active";
    
    /// <summary>
    /// Hash of subscription counts per symbol
    /// Key format: subscriptions:count:{symbol}
    /// </summary>
    public const string SubscriptionCountPrefix = "subscriptions:count:";
    
    /// <summary>
    /// Cache key prefix for stock quotes
    /// Key format: quote:{symbol}
    /// </summary>
    public const string QuotePrefix = "quote:";
}
