namespace StockTracker.Core.Models;

public class StockQuote
{
    public string Symbol { get; set; } = string.Empty;
    public string? Name { get; set; }
    public decimal Price { get; set; }
    public decimal Change { get; set; }
    public decimal ChangePercent { get; set; }
    public long Volume { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Open { get; set; }
    public decimal PreviousClose { get; set; }
    public DateTime? Timestamp { get; set; }
    public string? Exchange { get; set; }
    public string? Currency { get; set; }
    public string Source { get; set; } = "Unknown";
}

public class IndexData
{
    public string Name { get; set; } = string.Empty;
    public decimal CurrentValue { get; set; }
    public decimal Change { get; set; }
    public decimal ChangePercent { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Open { get; set; }
    public decimal PreviousClose { get; set; }
    public DateTime LastUpdate { get; set; }
}

public class HistoricalData
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Source { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; }
}
