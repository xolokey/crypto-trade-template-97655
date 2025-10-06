using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface IPriceAlertService
{
    Task<List<PriceAlert>> GetUserAlertsAsync(Guid userId);
    Task<PriceAlert?> GetAlertByIdAsync(Guid alertId, Guid userId);
    Task<PriceAlert> CreateAlertAsync(PriceAlert alert);
    Task<PriceAlert?> UpdateAlertAsync(Guid alertId, Guid userId, PriceAlert alert);
    Task<bool> DeleteAlertAsync(Guid alertId, Guid userId);
    Task CheckAndTriggerAlertsAsync();
}
