namespace StockTracker.Core.Models;

public class PortfolioHolding
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StockSymbol { get; set; } = string.Empty;
    public string StockName { get; set; } = string.Empty;
    public string? Sector { get; set; }
    public int Quantity { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal TotalInvested { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PortfolioMetrics
{
    public decimal TotalInvested { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal TotalGainLoss { get; set; }
    public decimal TotalGainLossPercent { get; set; }
    public int TotalStocks { get; set; }
    public Dictionary<string, decimal> SectorAllocation { get; set; } = new();
}

public class AddPortfolioDto
{
    public string StockSymbol { get; set; } = string.Empty;
    public string StockName { get; set; } = string.Empty;
    public string? Sector { get; set; }
    public int Quantity { get; set; }
    public decimal AveragePrice { get; set; }
}

public class UpdateHoldingDto
{
    public int? Quantity { get; set; }
    public decimal? AveragePrice { get; set; }
}
