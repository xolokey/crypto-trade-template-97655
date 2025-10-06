using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using StockTracker.Core.Constants;
using StockTracker.Core.Interfaces;

namespace StockTracker.Infrastructure.Services;

/// <summary>
/// Service for tracking active WebSocket subscriptions using Redis
/// </summary>
public class SubscriptionTrackingService : ISubscriptionTrackingService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<SubscriptionTrackingService> _logger;
    private readonly IDatabase _database;

    public SubscriptionTrackingService(
        IConnectionMultiplexer redis,
        ILogger<SubscriptionTrackingService> logger)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _database = _redis.GetDatabase();
    }

    public async Task AddSubscriptionsAsync(List<string> symbols)
    {
        if (symbols == null || symbols.Count == 0)
            return;

        try
        {
            var key = RedisKeys.ActiveSubscriptions;
            var values = symbols.Select(s => (RedisValue)s).ToArray();
            
            await _database.SetAddAsync(key, values);
            
            // Increment counts for each symbol
            foreach (var symbol in symbols)
            {
                await IncrementSubscriptionCountAsync(symbol);
            }

            _logger.LogInformation(
                "Added {Count} symbols to active subscriptions: {Symbols}",
                symbols.Count,
                string.Join(", ", symbols)
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add subscriptions for {Count} symbols", symbols.Count);
            throw;
        }
    }

    public async Task RemoveSubscriptionsAsync(List<string> symbols)
    {
        if (symbols == null || symbols.Count == 0)
            return;

        try
        {
            var key = RedisKeys.ActiveSubscriptions;
            
            foreach (var symbol in symbols)
            {
                // Decrement count
                var count = await DecrementSubscriptionCountAsync(symbol);
                
                // Remove from active set if count reaches zero
                if (count <= 0)
                {
                    await _database.SetRemoveAsync(key, symbol);
                    _logger.LogDebug("Removed {Symbol} from active subscriptions (count: 0)", symbol);
                }
            }

            _logger.LogInformation(
                "Processed removal of {Count} symbols from subscriptions",
                symbols.Count
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove subscriptions for {Count} symbols", symbols.Count);
            throw;
        }
    }

    public async Task<bool> IsSymbolSubscribedAsync(string symbol)
    {
        try
        {
            var key = RedisKeys.ActiveSubscriptions;
            return await _database.SetContainsAsync(key, symbol);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check subscription status for {Symbol}", symbol);
            return false;
        }
    }

    public async Task<HashSet<string>> GetActiveSubscriptionsAsync()
    {
        try
        {
            var key = RedisKeys.ActiveSubscriptions;
            var values = await _database.SetMembersAsync(key);
            
            var subscriptions = new HashSet<string>(
                values.Select(v => v.ToString())
            );

            _logger.LogDebug("Retrieved {Count} active subscriptions", subscriptions.Count);
            return subscriptions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get active subscriptions");
            return new HashSet<string>();
        }
    }

    public async Task IncrementSubscriptionCountAsync(string symbol)
    {
        try
        {
            var key = $"{RedisKeys.SubscriptionCountPrefix}{symbol}";
            await _database.StringIncrementAsync(key);
            
            // Set expiration to clean up stale counts (24 hours)
            await _database.KeyExpireAsync(key, TimeSpan.FromHours(24));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to increment subscription count for {Symbol}", symbol);
        }
    }

    public async Task<int> DecrementSubscriptionCountAsync(string symbol)
    {
        try
        {
            var key = $"{RedisKeys.SubscriptionCountPrefix}{symbol}";
            var count = await _database.StringDecrementAsync(key);
            
            // Ensure count doesn't go negative
            if (count < 0)
            {
                await _database.StringSetAsync(key, 0);
                return 0;
            }

            return (int)count;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to decrement subscription count for {Symbol}", symbol);
            return 0;
        }
    }

    public async Task<int> GetSubscriptionCountAsync(string symbol)
    {
        try
        {
            var key = $"{RedisKeys.SubscriptionCountPrefix}{symbol}";
            var value = await _database.StringGetAsync(key);
            
            if (value.IsNullOrEmpty)
                return 0;

            return (int)value;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get subscription count for {Symbol}", symbol);
            return 0;
        }
    }

    public async Task ClearAllSubscriptionsAsync()
    {
        try
        {
            var key = RedisKeys.ActiveSubscriptions;
            await _database.KeyDeleteAsync(key);
            
            _logger.LogWarning("Cleared all active subscriptions");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear all subscriptions");
            throw;
        }
    }
}
