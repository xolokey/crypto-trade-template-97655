using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StockTracker.Core.Interfaces;

namespace StockTracker.Infrastructure.Services;

/// <summary>
/// Background service that continuously fetches data for actively subscribed symbols
/// </summary>
public class ActiveSymbolsBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ActiveSymbolsBackgroundService> _logger;
    private readonly IConfiguration _configuration;
    private readonly int _updateIntervalMs;
    private int _consecutiveErrors = 0;
    private const int MaxConsecutiveErrors = 10;
    private DateTime _lastSuccessfulUpdate = DateTime.UtcNow;

    public ActiveSymbolsBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ActiveSymbolsBackgroundService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        
        // Get update interval from configuration, default to 2 seconds
        _updateIntervalMs = _configuration.GetValue<int>("BackgroundServices:ActiveSymbolsUpdateIntervalMs", 2000);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "ActiveSymbolsBackgroundService started with update interval: {Interval}ms",
            _updateIntervalMs
        );

        // Wait a bit before starting to allow services to initialize
        await Task.Delay(5000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await FetchAndPublishActiveSymbolsAsync(stoppingToken);
                
                // Wait for the configured interval before next update
                await Task.Delay(_updateIntervalMs, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Service is stopping, exit gracefully
                _logger.LogInformation("ActiveSymbolsBackgroundService is stopping");
                break;
            }
            catch (Exception ex)
            {
                _consecutiveErrors++;
                _logger.LogError(
                    ex,
                    "Error in ActiveSymbolsBackgroundService main loop (consecutive errors: {Count})",
                    _consecutiveErrors
                );
                
                // Circuit breaker: if too many consecutive errors, increase delay
                if (_consecutiveErrors >= MaxConsecutiveErrors)
                {
                    _logger.LogCritical(
                        "Circuit breaker triggered: {Count} consecutive errors. Pausing for 60 seconds.",
                        _consecutiveErrors
                    );
                    await Task.Delay(60000, stoppingToken);
                    _consecutiveErrors = 0; // Reset after long pause
                }
                else
                {
                    // Exponential backoff: wait longer with each error
                    var delayMs = Math.Min(5000 * _consecutiveErrors, 30000);
                    await Task.Delay(delayMs, stoppingToken);
                }
            }
        }

        _logger.LogInformation("ActiveSymbolsBackgroundService stopped");
    }

    private async Task FetchAndPublishActiveSymbolsAsync(CancellationToken cancellationToken)
    {
        // Create a new scope for scoped services
        using var scope = _serviceProvider.CreateScope();
        
        var subscriptionTrackingService = scope.ServiceProvider
            .GetRequiredService<ISubscriptionTrackingService>();
        var marketDataService = scope.ServiceProvider
            .GetRequiredService<IMarketDataService>();

        try
        {
            // Get list of active subscriptions
            var activeSymbols = await subscriptionTrackingService.GetActiveSubscriptionsAsync();

            if (activeSymbols.Count == 0)
            {
                _logger.LogDebug("No active subscriptions, skipping update cycle");
                return;
            }

            _logger.LogDebug(
                "Fetching data for {Count} active symbols: {Symbols}",
                activeSymbols.Count,
                string.Join(", ", activeSymbols.Take(10)) + (activeSymbols.Count > 10 ? "..." : "")
            );

            // Fetch data for each symbol
            var fetchTasks = activeSymbols.Select(symbol => 
                FetchSymbolDataAsync(symbol, marketDataService, cancellationToken)
            );

            await Task.WhenAll(fetchTasks);

            // Reset error counter on successful update
            if (_consecutiveErrors > 0)
            {
                _logger.LogInformation(
                    "Service recovered after {Count} consecutive errors",
                    _consecutiveErrors
                );
                _consecutiveErrors = 0;
            }
            
            _lastSuccessfulUpdate = DateTime.UtcNow;
            _logger.LogDebug("Completed update cycle for {Count} symbols", activeSymbols.Count);
        }
        catch (Exception ex)
        {
            _consecutiveErrors++;
            _logger.LogError(
                ex,
                "Error fetching and publishing active symbols (consecutive errors: {Count})",
                _consecutiveErrors
            );
            
            // Check if service has been failing for too long
            var timeSinceLastSuccess = DateTime.UtcNow - _lastSuccessfulUpdate;
            if (timeSinceLastSuccess.TotalMinutes > 5)
            {
                _logger.LogCritical(
                    "Service has been failing for {Minutes} minutes. Last successful update: {Time}",
                    timeSinceLastSuccess.TotalMinutes,
                    _lastSuccessfulUpdate
                );
            }
        }
    }

    private async Task FetchSymbolDataAsync(
        string symbol,
        IMarketDataService marketDataService,
        CancellationToken cancellationToken)
    {
        try
        {
            // Fetch quote - this will automatically publish to WebSocket if successful
            var quote = await marketDataService.GetStockQuoteAsync(symbol);

            if (quote == null)
            {
                _logger.LogWarning("Failed to fetch data for symbol: {Symbol}", symbol);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error fetching data for symbol: {Symbol}", symbol);
        }

        // Small delay between symbols to avoid overwhelming APIs
        if (!cancellationToken.IsCancellationRequested)
        {
            await Task.Delay(100, cancellationToken);
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("ActiveSymbolsBackgroundService is stopping...");
        await base.StopAsync(cancellationToken);
    }
}
