namespace StockTracker.Core.Models;

public class WatchlistItem
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StockSymbol { get; set; } = string.Empty;
    public string StockName { get; set; } = string.Empty;
    public string? Sector { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

public class AddWatchlistDto
{
    public string StockSymbol { get; set; } = string.Empty;
    public string StockName { get; set; } = string.Empty;
    public string? Sector { get; set; }
}
