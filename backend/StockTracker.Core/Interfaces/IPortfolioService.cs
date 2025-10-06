using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface IPortfolioService
{
    Task<List<PortfolioHolding>> GetUserPortfolioAsync(Guid userId);
    Task<PortfolioHolding?> GetHoldingByIdAsync(Guid holdingId, Guid userId);
    Task<PortfolioHolding> AddHoldingAsync(PortfolioHolding holding);
    Task<PortfolioHolding?> UpdateHoldingAsync(Guid holdingId, Guid userId, PortfolioHolding holding);
    Task<bool> DeleteHoldingAsync(Guid holdingId, Guid userId);
    Task<PortfolioMetrics> GetPortfolioMetricsAsync(Guid userId);
}
