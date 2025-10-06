using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;

namespace StockTracker.Infrastructure.Services;

public class AlphaVantageService : IAlphaVantageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AlphaVantageService> _logger;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public AlphaVantageService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<AlphaVantageService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = configuration["ExternalAPIs:AlphaVantage:ApiKey"] ?? "";
        _baseUrl = configuration["ExternalAPIs:AlphaVantage:BaseUrl"] ?? "https://www.alphavantage.co/query";
    }

    public async Task<StockQuote?> GetQuoteAsync(string symbol)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Alpha Vantage API key not configured");
            return null;
        }

        try
        {
            var url = $"{_baseUrl}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={_apiKey}";
            var response = await _httpClient.GetStringAsync(url);
            var json = JObject.Parse(response);

            var globalQuote = json["Global Quote"];
            if (globalQuote == null || !globalQuote.HasValues)
            {
                _logger.LogWarning("No data returned from Alpha Vantage for {Symbol}", symbol);
                return null;
            }

            return new StockQuote
            {
                Symbol = globalQuote["01. symbol"]?.ToString() ?? symbol,
                Price = decimal.Parse(globalQuote["05. price"]?.ToString() ?? "0"),
                Change = decimal.Parse(globalQuote["09. change"]?.ToString() ?? "0"),
                ChangePercent = decimal.Parse(globalQuote["10. change percent"]?.ToString()?.Replace("%", "") ?? "0"),
                Volume = long.Parse(globalQuote["06. volume"]?.ToString() ?? "0"),
                High = decimal.Parse(globalQuote["03. high"]?.ToString() ?? "0"),
                Low = decimal.Parse(globalQuote["04. low"]?.ToString() ?? "0"),
                Open = decimal.Parse(globalQuote["02. open"]?.ToString() ?? "0"),
                PreviousClose = decimal.Parse(globalQuote["08. previous close"]?.ToString() ?? "0"),
                Timestamp = DateTime.Parse(globalQuote["07. latest trading day"]?.ToString() ?? DateTime.UtcNow.ToString()),
                Source = "Alpha Vantage"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching quote from Alpha Vantage for {Symbol}", symbol);
            return null;
        }
    }

    public async Task<List<HistoricalData>> GetHistoricalDataAsync(string symbol, string interval, int outputSize)
    {
        // Implementation for historical data
        return new List<HistoricalData>();
    }
}
