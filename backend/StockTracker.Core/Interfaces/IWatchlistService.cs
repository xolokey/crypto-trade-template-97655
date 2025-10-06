using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface IWatchlistService
{
    Task<List<WatchlistItem>> GetUserWatchlistAsync(Guid userId);
    Task<WatchlistItem> AddToWatchlistAsync(WatchlistItem item);
    Task<bool> RemoveFromWatchlistAsync(Guid itemId, Guid userId);
    Task<bool> IsInWatchlistAsync(Guid userId, string symbol);
}
