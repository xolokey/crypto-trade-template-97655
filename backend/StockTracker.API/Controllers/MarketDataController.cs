using Microsoft.AspNetCore.Mvc;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;

namespace StockTracker.API.Controllers;

[ApiController]
[Route("api/market-data")]
public class MarketDataController : ControllerBase
{
    private readonly IMarketDataService _marketDataService;
    private readonly ILogger<MarketDataController> _logger;

    public MarketDataController(
        IMarketDataService marketDataService,
        ILogger<MarketDataController> logger)
    {
        _marketDataService = marketDataService;
        _logger = logger;
    }

    /// <summary>
    /// Get single stock quote
    /// </summary>
    [HttpGet("quote/{symbol}")]
    [ProducesResponseType(typeof(ApiResponse<StockQuote>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetQuote(string symbol)
    {
        try
        {
            var quote = await _marketDataService.GetStockQuoteAsync(symbol);
            
            if (quote == null)
            {
                return NotFound(new ApiResponse<StockQuote>
                {
                    Success = false,
                    Error = $"Stock {symbol} not found"
                });
            }

            return Ok(new ApiResponse<StockQuote>
            {
                Success = true,
                Data = quote,
                Source = quote.Source,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching quote for {Symbol}", symbol);
            return StatusCode(500, new ApiResponse<StockQuote>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get multiple stock quotes
    /// </summary>
    [HttpGet("quotes")]
    [ProducesResponseType(typeof(ApiResponse<List<StockQuote>>), 200)]
    public async Task<IActionResult> GetQuotes([FromQuery] string symbols)
    {
        try
        {
            var symbolList = symbols.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                   .Select(s => s.Trim())
                                   .ToList();

            if (!symbolList.Any())
            {
                return BadRequest(new ApiResponse<List<StockQuote>>
                {
                    Success = false,
                    Error = "No symbols provided"
                });
            }

            var quotes = await _marketDataService.GetMultipleQuotesAsync(symbolList);

            return Ok(new ApiResponse<List<StockQuote>>
            {
                Success = true,
                Data = quotes,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching multiple quotes");
            return StatusCode(500, new ApiResponse<List<StockQuote>>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get market indices (Nifty 50, Sensex, Bank Nifty)
    /// </summary>
    [HttpGet("indices")]
    [ProducesResponseType(typeof(ApiResponse<List<IndexData>>), 200)]
    public async Task<IActionResult> GetIndices()
    {
        try
        {
            var indices = await _marketDataService.GetMarketIndicesAsync();

            return Ok(new ApiResponse<List<IndexData>>
            {
                Success = true,
                Data = indices,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching market indices");
            return StatusCode(500, new ApiResponse<List<IndexData>>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get historical data for a stock
    /// </summary>
    [HttpGet("history/{symbol}")]
    [ProducesResponseType(typeof(ApiResponse<List<HistoricalData>>), 200)]
    public async Task<IActionResult> GetHistory(
        string symbol,
        [FromQuery] string interval = "1day",
        [FromQuery] int outputSize = 30)
    {
        try
        {
            var history = await _marketDataService.GetHistoricalDataAsync(symbol, interval, outputSize);

            return Ok(new ApiResponse<List<HistoricalData>>
            {
                Success = true,
                Data = history,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching history for {Symbol}", symbol);
            return StatusCode(500, new ApiResponse<List<HistoricalData>>
            {
                Success = false,
                Error = "Internal server error"
            });
        }
    }
}
