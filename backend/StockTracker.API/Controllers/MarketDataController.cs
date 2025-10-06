using Microsoft.AspNetCore.Mvc;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;
using StockTracker.Core.Validation;
using StockTracker.Core.Exceptions;

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
        // Validate and sanitize input
        var validatedSymbol = InputValidator.ValidateStockSymbol(symbol);
        
        var quote = await _marketDataService.GetStockQuoteAsync(validatedSymbol);
        
        if (quote == null)
        {
            throw new NotFoundException("Stock", validatedSymbol);
        }

        return Ok(new ApiResponse<StockQuote>
        {
            Success = true,
            Data = quote,
            Source = quote.Source,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get multiple stock quotes
    /// </summary>
    [HttpGet("quotes")]
    [ProducesResponseType(typeof(ApiResponse<List<StockQuote>>), 200)]
    public async Task<IActionResult> GetQuotes([FromQuery] string symbols)
    {
        // Validate and sanitize input
        var symbolList = InputValidator.ValidateStockSymbols(symbols);

        var quotes = await _marketDataService.GetMultipleQuotesAsync(symbolList);

        return Ok(new ApiResponse<List<StockQuote>>
        {
            Success = true,
            Data = quotes,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get market indices (Nifty 50, Sensex, Bank Nifty)
    /// </summary>
    [HttpGet("indices")]
    [ProducesResponseType(typeof(ApiResponse<List<IndexData>>), 200)]
    public async Task<IActionResult> GetIndices()
    {
        var indices = await _marketDataService.GetMarketIndicesAsync();

        return Ok(new ApiResponse<List<IndexData>>
        {
            Success = true,
            Data = indices,
            Timestamp = DateTime.UtcNow
        });
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
        // Validate and sanitize input
        var validatedSymbol = InputValidator.ValidateStockSymbol(symbol);
        var sanitizedInterval = InputValidator.SanitizeString(interval, 20);
        
        if (outputSize < 1 || outputSize > 365)
        {
            throw new ValidationException("outputSize", "Output size must be between 1 and 365");
        }

        var history = await _marketDataService.GetHistoricalDataAsync(validatedSymbol, sanitizedInterval, outputSize);

        return Ok(new ApiResponse<List<HistoricalData>>
        {
            Success = true,
            Data = history,
            Timestamp = DateTime.UtcNow
        });
    }
}
