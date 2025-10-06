using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using StockTracker.Core.Constants;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;

namespace StockTracker.Infrastructure.Services;

/// <summary>
/// Service for publishing real-time updates to WebSocket clients via Redis PubSub
/// </summary>
public class WebSocketNotificationService : IWebSocketNotificationService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<WebSocketNotificationService> _logger;
    private readonly ISubscriber _subscriber;

    public WebSocketNotificationService(
        IConnectionMultiplexer redis,
        ILogger<WebSocketNotificationService> logger)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _subscriber = _redis.GetSubscriber();
    }

    /// <inheritdoc/>
    public async Task<bool> PublishPriceUpdateAsync(string symbol, StockQuote quote)
    {
        try
        {
            var message = new
            {
                type = "price_update",
                symbol = symbol,
                data = quote,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(message);
            var subscribers = await _subscriber.PublishAsync(
                RedisChannels.MarketDataUpdates, 
                json
            );

            _logger.LogDebug(
                "Published price update for {Symbol} to {Subscribers} subscribers",
                symbol,
                subscribers
            );

            return subscribers > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish price update for {Symbol}",
                symbol
            );
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<int> PublishBatchUpdatesAsync(Dictionary<string, StockQuote> updates)
    {
        if (updates == null || updates.Count == 0)
        {
            return 0;
        }

        var successCount = 0;

        try
        {
            var message = new
            {
                type = "batch_update",
                updates = updates.Select(kvp => new
                {
                    symbol = kvp.Key,
                    data = kvp.Value
                }).ToList(),
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(message);
            var subscribers = await _subscriber.PublishAsync(
                RedisChannels.MarketDataUpdates,
                json
            );

            if (subscribers > 0)
            {
                successCount = updates.Count;
                _logger.LogDebug(
                    "Published batch update with {Count} symbols to {Subscribers} subscribers",
                    updates.Count,
                    subscribers
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish batch updates for {Count} symbols",
                updates.Count
            );
        }

        return successCount;
    }

    /// <inheritdoc/>
    public async Task<bool> NotifySubscriptionChangeAsync(string action, List<string> symbols)
    {
        try
        {
            var message = new
            {
                action = action,
                symbols = symbols,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(message);
            var subscribers = await _subscriber.PublishAsync(
                RedisChannels.MarketDataSubscriptions,
                json
            );

            _logger.LogInformation(
                "Notified subscription change: {Action} for {Count} symbols to {Subscribers} subscribers",
                action,
                symbols.Count,
                subscribers
            );

            return subscribers > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to notify subscription change: {Action} for {Symbols}",
                action,
                string.Join(", ", symbols)
            );
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsWebSocketServerHealthyAsync()
    {
        try
        {
            // Check if Redis connection is alive
            if (!_redis.IsConnected)
            {
                _logger.LogWarning("Redis connection is not active");
                return false;
            }

            // Ping Redis to verify connectivity
            var database = _redis.GetDatabase();
            var pingTime = await database.PingAsync();

            if (pingTime.TotalMilliseconds > 1000)
            {
                _logger.LogWarning(
                    "Redis ping time is high: {PingTime}ms",
                    pingTime.TotalMilliseconds
                );
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for WebSocket notification service");
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> PublishControlMessageAsync(string action, object? data = null)
    {
        try
        {
            var message = new
            {
                action = action,
                data = data,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(message);
            var subscribers = await _subscriber.PublishAsync(
                RedisChannels.MarketDataControl,
                json
            );

            _logger.LogInformation(
                "Published control message: {Action} to {Subscribers} subscribers",
                action,
                subscribers
            );

            return subscribers > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish control message: {Action}",
                action
            );
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> PublishErrorAsync(string symbol, string errorMessage)
    {
        try
        {
            var message = new
            {
                type = "error",
                symbol = symbol,
                error = errorMessage,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(message);
            var subscribers = await _subscriber.PublishAsync(
                RedisChannels.MarketDataUpdates,
                json
            );

            _logger.LogWarning(
                "Published error for {Symbol}: {Error} to {Subscribers} subscribers",
                symbol,
                errorMessage,
                subscribers
            );

            return subscribers > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish error for {Symbol}: {Error}",
                symbol,
                errorMessage
            );
            return false;
        }
    }
}
