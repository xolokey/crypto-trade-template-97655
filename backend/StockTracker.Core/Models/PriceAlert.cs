namespace StockTracker.Core.Models;

public class PriceAlert
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StockSymbol { get; set; } = string.Empty;
    public string? StockName { get; set; }
    public AlertType AlertType { get; set; }
    public decimal? TargetPrice { get; set; }
    public decimal? TargetPercent { get; set; }
    public decimal? CurrentPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsTriggered { get; set; } = false;
    public DateTime? TriggeredAt { get; set; }
    public bool NotificationSent { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum AlertType
{
    Above,
    Below,
    ChangeUp,
    ChangeDown
}

public class CreateAlertDto
{
    public string StockSymbol { get; set; } = string.Empty;
    public string? StockName { get; set; }
    public AlertType AlertType { get; set; }
    public decimal? TargetPrice { get; set; }
    public decimal? TargetPercent { get; set; }
    public decimal? CurrentPrice { get; set; }
}

public class UpdateAlertDto
{
    public bool? IsActive { get; set; }
    public decimal? TargetPrice { get; set; }
    public decimal? TargetPercent { get; set; }
}
