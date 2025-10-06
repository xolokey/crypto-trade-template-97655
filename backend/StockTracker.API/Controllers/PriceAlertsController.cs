using Microsoft.AspNetCore.Mvc;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;

namespace StockTracker.API.Controllers;

[ApiController]
[Route("api/alerts")]
public class PriceAlertsController : ControllerBase
{
    private readonly IPriceAlertService _alertService;
    private readonly ILogger<PriceAlertsController> _logger;

    public PriceAlertsController(
        IPriceAlertService alertService,
        ILogger<PriceAlertsController> logger)
    {
        _alertService = alertService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAlerts([FromQuery] Guid userId)
    {
        try
        {
            var alerts = await _alertService.GetUserAlertsAsync(userId);
            return Ok(new ApiResponse<List<PriceAlert>>
            {
                Success = true,
                Data = alerts,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching alerts for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<List<PriceAlert>>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAlert([FromBody] CreateAlertDto dto, [FromQuery] Guid userId)
    {
        try
        {
            var alert = new PriceAlert
            {
                UserId = userId,
                StockSymbol = dto.StockSymbol,
                StockName = dto.StockName,
                AlertType = dto.AlertType,
                TargetPrice = dto.TargetPrice,
                TargetPercent = dto.TargetPercent,
                CurrentPrice = dto.CurrentPrice
            };

            var created = await _alertService.CreateAlertAsync(alert);
            
            return CreatedAtAction(nameof(GetAlerts), new { userId }, new ApiResponse<PriceAlert>
            {
                Success = true,
                Data = created,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating alert");
            return StatusCode(500, new ApiResponse<PriceAlert>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAlert(Guid id, [FromBody] UpdateAlertDto dto, [FromQuery] Guid userId)
    {
        try
        {
            var existing = await _alertService.GetAlertByIdAsync(id, userId);
            if (existing == null)
            {
                return NotFound(new ApiResponse<PriceAlert>
                {
                    Success = false,
                    Error = "Alert not found"
                });
            }

            if (dto.IsActive.HasValue) existing.IsActive = dto.IsActive.Value;
            if (dto.TargetPrice.HasValue) existing.TargetPrice = dto.TargetPrice.Value;
            if (dto.TargetPercent.HasValue) existing.TargetPercent = dto.TargetPercent.Value;

            var updated = await _alertService.UpdateAlertAsync(id, userId, existing);
            
            return Ok(new ApiResponse<PriceAlert>
            {
                Success = true,
                Data = updated,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating alert {AlertId}", id);
            return StatusCode(500, new ApiResponse<PriceAlert>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAlert(Guid id, [FromQuery] Guid userId)
    {
        try
        {
            var deleted = await _alertService.DeleteAlertAsync(id, userId);
            if (!deleted)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Error = "Alert not found"
                });
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting alert {AlertId}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }
}
