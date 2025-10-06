using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

/// <summary>
/// Service for publishing real-time updates to WebSocket clients via Redis PubSub
/// </summary>
public interface IWebSocketNotificationService
{
    /// <summary>
    /// Publish a single stock price update to WebSocket clients
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="quote">Stock quote data</param>
    /// <returns>True if published successfully</returns>
    Task<bool> PublishPriceUpdateAsync(string symbol, StockQuote quote);

    /// <summary>
    /// Publish multiple stock price updates in a batch
    /// </summary>
    /// <param name="updates">Dictionary of symbol to quote mappings</param>
    /// <returns>Number of successfully published updates</returns>
    Task<int> PublishBatchUpdatesAsync(Dictionary<string, StockQuote> updates);

    /// <summary>
    /// Notify WebSocket server of subscription changes
    /// </summary>
    /// <param name="action">Action type: "subscribe" or "unsubscribe"</param>
    /// <param name="symbols">List of symbols affected</param>
    /// <returns>True if notification sent successfully</returns>
    Task<bool> NotifySubscriptionChangeAsync(string action, List<string> symbols);

    /// <summary>
    /// Check if the WebSocket server is healthy and reachable
    /// </summary>
    /// <returns>True if WebSocket server is healthy</returns>
    Task<bool> IsWebSocketServerHealthyAsync();

    /// <summary>
    /// Publish a control message to WebSocket server
    /// </summary>
    /// <param name="action">Control action (e.g., "pause", "resume")</param>
    /// <param name="data">Additional data for the control message</param>
    /// <returns>True if published successfully</returns>
    Task<bool> PublishControlMessageAsync(string action, object? data = null);

    /// <summary>
    /// Publish an error notification to WebSocket clients
    /// </summary>
    /// <param name="symbol">Stock symbol that caused the error</param>
    /// <param name="errorMessage">Error message</param>
    /// <returns>True if published successfully</returns>
    Task<bool> PublishErrorAsync(string symbol, string errorMessage);
}
