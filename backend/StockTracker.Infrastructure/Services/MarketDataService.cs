using System.Net.WebSockets;
using System.Text;
using Microsoft.Extensions.Logging;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;

namespace StockTracker.Infrastructure.Services;

public class MarketDataService : IMarketDataService
{
    private readonly IAlphaVantageService _alphaVantageService;
    private readonly ITwelveDataService _twelveDataService;
    private readonly INSEService _nseService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<MarketDataService> _logger;

    public MarketDataService(
        IAlphaVantageService alphaVantageService,
        ITwelveDataService twelveDataService,
        INSEService nseService,
        ICacheService cacheService,
        ILogger<MarketDataService> logger)
    {
        _alphaVantageService = alphaVantageService;
        _twelveDataService = twelveDataService;
        _nseService = nseService;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<StockQuote?> GetStockQuoteAsync(string symbol)
    {
        // Check cache first
        var cacheKey = $"quote:{symbol}";
        var cached = await _cacheService.GetAsync<StockQuote>(cacheKey);
        if (cached != null)
        {
            _logger.LogInformation("Cache hit for {Symbol}", symbol);
            return cached;
        }

        // Try Alpha Vantage first
        var quote = await _alphaVantageService.GetQuoteAsync(symbol);
        if (quote != null)
        {
            await _cacheService.SetAsync(cacheKey, quote, TimeSpan.FromSeconds(10));
            return quote;
        }

        // Try Twelve Data
        quote = await _twelveDataService.GetQuoteAsync(symbol);
        if (quote != null)
        {
            await _cacheService.SetAsync(cacheKey, quote, TimeSpan.FromSeconds(10));
            return quote;
        }

        // Try NSE
        quote = await _nseService.GetStockQuoteAsync(symbol);
        if (quote != null)
        {
            await _cacheService.SetAsync(cacheKey, quote, TimeSpan.FromSeconds(10));
            return quote;
        }

        // Generate mock data as fallback
        _logger.LogWarning("All APIs failed for {Symbol}, generating mock data", symbol);
        return GenerateMockQuote(symbol);
    }

    public async Task<List<StockQuote>> GetMultipleQuotesAsync(List<string> symbols)
    {
        var tasks = symbols.Select(symbol => GetStockQuoteAsync(symbol));
        var results = await Task.WhenAll(tasks);
        return results.Where(q => q != null).ToList()!;
    }

    public async Task<List<IndexData>> GetMarketIndicesAsync()
    {
        var cacheKey = "indices:all";
        var cached = await _cacheService.GetAsync<List<IndexData>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        // Fetch real index data from Alpha Vantage or Twelve Data
        var indices = new List<IndexData>();
        
        // Nifty 50 (^NSEI)
        var niftyQuote = await GetStockQuoteAsync("^NSEI");
        if (niftyQuote != null)
        {
            indices.Add(new IndexData
            {
                Name = "Nifty 50",
                CurrentValue = niftyQuote.Price,
                Change = niftyQuote.Change,
                ChangePercent = niftyQuote.ChangePercent,
                High = niftyQuote.High,
                Low = niftyQuote.Low,
                Open = niftyQuote.Open,
                PreviousClose = niftyQuote.PreviousClose,
                LastUpdate = niftyQuote.Timestamp
            });
        }

        // Sensex (^BSESN)
        var sensexQuote = await GetStockQuoteAsync("^BSESN");
        if (sensexQuote != null)
        {
            indices.Add(new IndexData
            {
                Name = "Sensex",
                CurrentValue = sensexQuote.Price,
                Change = sensexQuote.Change,
                ChangePercent = sensexQuote.ChangePercent,
                High = sensexQuote.High,
                Low = sensexQuote.Low,
                Open = sensexQuote.Open,
                PreviousClose = sensexQuote.PreviousClose,
                LastUpdate = sensexQuote.Timestamp
            });
        }

        // Bank Nifty (^NSEBANK)
        var bankNiftyQuote = await GetStockQuoteAsync("^NSEBANK");
        if (bankNiftyQuote != null)
        {
            indices.Add(new IndexData
            {
                Name = "Bank Nifty",
                CurrentValue = bankNiftyQuote.Price,
                Change = bankNiftyQuote.Change,
                ChangePercent = bankNiftyQuote.ChangePercent,
                High = bankNiftyQuote.High,
                Low = bankNiftyQuote.Low,
                Open = bankNiftyQuote.Open,
                PreviousClose = bankNiftyQuote.PreviousClose,
                LastUpdate = bankNiftyQuote.Timestamp
            });
        }

        // If we got real data, cache it
        if (indices.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, indices, TimeSpan.FromSeconds(10));
            _logger.LogInformation("Fetched {Count} real market indices", indices.Count);
            return indices;
        }

        // Fallback to mock data
        _logger.LogWarning("Failed to fetch real indices, using mock data");
        return GenerateMockIndices();
    }

    public async Task<List<HistoricalData>> GetHistoricalDataAsync(string symbol, string interval, int outputSize)
    {
        var data = await _alphaVantageService.GetHistoricalDataAsync(symbol, interval, outputSize);
        if (data.Count > 0) return data;

        data = await _twelveDataService.GetTimeSeriesAsync(symbol, interval, outputSize);
        return data;
    }

    public async Task HandleWebSocketConnection(WebSocket webSocket)
    {
        var buffer = new byte[1024 * 4];
        var subscriptions = new HashSet<string>();

        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by client", CancellationToken.None);
                    break;
                }

                var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                _logger.LogInformation("WebSocket message received: {Message}", message);

                // Handle subscription messages
                // Parse and add to subscriptions
                // Send updates periodically
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebSocket error");
        }
    }

    private StockQuote GenerateMockQuote(string symbol)
    {
        var random = new Random();
        var basePrice = random.Next(100, 5000);
        var changePercent = (decimal)(random.NextDouble() - 0.5) * 5;
        var change = basePrice * changePercent / 100;

        return new StockQuote
        {
            Symbol = symbol,
            Price = basePrice,
            Change = change,
            ChangePercent = changePercent,
            Volume = random.Next(1000000, 10000000),
            High = basePrice * 1.02m,
            Low = basePrice * 0.98m,
            Open = basePrice * 0.99m,
            PreviousClose = basePrice - change,
            Timestamp = DateTime.UtcNow,
            Source = "Mock (Simulated)"
        };
    }

    private List<IndexData> GenerateMockIndices()
    {
        return new List<IndexData>
        {
            new IndexData
            {
                Name = "Nifty 50",
                CurrentValue = 19674.25m,
                Change = 167.25m,
                ChangePercent = 0.85m,
                High = 19750.00m,
                Low = 19500.00m,
                Open = 19507.00m,
                PreviousClose = 19507.00m,
                LastUpdate = DateTime.UtcNow
            },
            new IndexData
            {
                Name = "Sensex",
                CurrentValue = 65953.48m,
                Change = 472.35m,
                ChangePercent = 0.72m,
                High = 66100.00m,
                Low = 65700.00m,
                Open = 65481.13m,
                PreviousClose = 65481.13m,
                LastUpdate = DateTime.UtcNow
            },
            new IndexData
            {
                Name = "Bank Nifty",
                CurrentValue = 44123.50m,
                Change = 542.80m,
                ChangePercent = 1.23m,
                High = 44300.00m,
                Low = 43800.00m,
                Open = 43580.70m,
                PreviousClose = 43580.70m,
                LastUpdate = DateTime.UtcNow
            }
        };
    }
}
