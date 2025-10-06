using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;

namespace StockTracker.Infrastructure.Services;

public class TwelveDataService : ITwelveDataService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TwelveDataService> _logger;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public TwelveDataService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<TwelveDataService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = configuration["ExternalAPIs:TwelveData:ApiKey"] ?? "";
        _baseUrl = configuration["ExternalAPIs:TwelveData:BaseUrl"] ?? "https://api.twelvedata.com";
    }

    public async Task<StockQuote?> GetQuoteAsync(string symbol)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Twelve Data API key not configured");
            return null;
        }

        try
        {
            var url = $"{_baseUrl}/quote?symbol={symbol}&apikey={_apiKey}";
            var response = await _httpClient.GetStringAsync(url);
            var json = JObject.Parse(response);

            if (json["status"]?.ToString() == "error")
            {
                _logger.LogWarning("Twelve Data API error for {Symbol}: {Message}", symbol, json["message"]);
                return null;
            }

            return new StockQuote
            {
                Symbol = json["symbol"]?.ToString() ?? symbol,
                Name = json["name"]?.ToString(),
                Price = decimal.Parse(json["close"]?.ToString() ?? "0"),
                Change = decimal.Parse(json["change"]?.ToString() ?? "0"),
                ChangePercent = decimal.Parse(json["percent_change"]?.ToString() ?? "0"),
                Volume = long.Parse(json["volume"]?.ToString() ?? "0"),
                High = decimal.Parse(json["high"]?.ToString() ?? "0"),
                Low = decimal.Parse(json["low"]?.ToString() ?? "0"),
                Open = decimal.Parse(json["open"]?.ToString() ?? "0"),
                PreviousClose = decimal.Parse(json["previous_close"]?.ToString() ?? "0"),
                Timestamp = DateTime.Parse(json["timestamp"]?.ToString() ?? DateTime.UtcNow.ToString()),
                Exchange = json["exchange"]?.ToString(),
                Currency = json["currency"]?.ToString(),
                Source = "Twelve Data"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching quote from Twelve Data for {Symbol}", symbol);
            return null;
        }
    }

    public async Task<List<StockQuote>> GetMultipleQuotesAsync(List<string> symbols)
    {
        var tasks = symbols.Select(s => GetQuoteAsync(s));
        var results = await Task.WhenAll(tasks);
        return results.Where(q => q != null).ToList()!;
    }

    public async Task<List<HistoricalData>> GetTimeSeriesAsync(string symbol, string interval, int outputSize)
    {
        // Implementation for time series
        return new List<HistoricalData>();
    }
}
