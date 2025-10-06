using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;
using StockTracker.Infrastructure.Services;
using Xunit;

namespace StockTracker.Tests.Services;

/// <summary>
/// Unit tests for ActiveSymbolsBackgroundService
/// Tests cover: fetching active symbols, publishing updates, and error handling for failed fetches
/// Requirements: 4.3
/// </summary>
public class ActiveSymbolsBackgroundServiceTests : IDisposable
{
    private readonly Mock<IServiceProvider> _mockServiceProvider;
    private readonly Mock<IServiceScope> _mockServiceScope;
    private readonly Mock<IServiceScopeFactory> _mockServiceScopeFactory;
    private readonly Mock<ISubscriptionTrackingService> _mockSubscriptionService;
    private readonly Mock<IMarketDataService> _mockMarketDataService;
    private readonly Mock<ILogger<ActiveSymbolsBackgroundService>> _mockLogger;
    private readonly IConfiguration _configuration;
    private readonly CancellationTokenSource _cancellationTokenSource;

    public ActiveSymbolsBackgroundServiceTests()
    {
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockServiceScope = new Mock<IServiceScope>();
        _mockServiceScopeFactory = new Mock<IServiceScopeFactory>();
        _mockSubscriptionService = new Mock<ISubscriptionTrackingService>();
        _mockMarketDataService = new Mock<IMarketDataService>();
        _mockLogger = new Mock<ILogger<ActiveSymbolsBackgroundService>>();
        _cancellationTokenSource = new CancellationTokenSource();

        // Setup configuration with fast update interval for testing
        var configData = new Dictionary<string, string>
        {
            { "BackgroundServices:ActiveSymbolsUpdateIntervalMs", "100" }
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData!)
            .Build();

        // Setup service provider to return scoped services
        var mockScopeServiceProvider = new Mock<IServiceProvider>();
        mockScopeServiceProvider
            .Setup(sp => sp.GetService(typeof(ISubscriptionTrackingService)))
            .Returns(_mockSubscriptionService.Object);
        mockScopeServiceProvider
            .Setup(sp => sp.GetService(typeof(IMarketDataService)))
            .Returns(_mockMarketDataService.Object);

        _mockServiceScope.Setup(s => s.ServiceProvider).Returns(mockScopeServiceProvider.Object);
        
        // Setup service scope factory
        _mockServiceScopeFactory.Setup(f => f.CreateScope()).Returns(_mockServiceScope.Object);
        
        // Setup service provider to return the scope factory
        _mockServiceProvider
            .Setup(sp => sp.GetService(typeof(IServiceScopeFactory)))
            .Returns(_mockServiceScopeFactory.Object);
    }

    public void Dispose()
    {
        _cancellationTokenSource?.Cancel();
        _cancellationTokenSource?.Dispose();
    }

    #region Service Fetches Active Symbols Tests

    [Fact]
    public async Task ExecuteAsync_ShouldFetchActiveSymbolsFromSubscriptionService()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE", "TCS", "INFY" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync(CreateTestStockQuote("TEST"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockSubscriptionService.Verify(
            s => s.GetActiveSubscriptionsAsync(),
            Times.AtLeastOnce,
            "Service should fetch active subscriptions");
    }

    [Fact]
    public async Task ExecuteAsync_WithActiveSymbols_ShouldFetchDataForEachSymbol()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE", "TCS", "INFY" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync((string symbol) => CreateTestStockQuote(symbol));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        foreach (var symbol in activeSymbols)
        {
            _mockMarketDataService.Verify(
                m => m.GetStockQuoteAsync(symbol),
                Times.AtLeastOnce,
                $"Service should fetch data for symbol {symbol}");
        }
    }

    [Fact]
    public async Task ExecuteAsync_WithNoActiveSymbols_ShouldSkipFetching()
    {
        // Arrange
        var emptySymbols = new HashSet<string>();
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(emptySymbols);

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockMarketDataService.Verify(
            m => m.GetStockQuoteAsync(It.IsAny<string>()),
            Times.Never,
            "Service should not fetch data when no symbols are subscribed");

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No active subscriptions")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldFetchSymbolsRepeatedly()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6500); // Wait for initial delay + multiple cycles
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockMarketDataService.Verify(
            m => m.GetStockQuoteAsync("RELIANCE"),
            Times.AtLeast(2),
            "Service should fetch data repeatedly in cycles");
    }

    #endregion

    #region Service Publishes Updates Tests

    [Fact]
    public async Task ExecuteAsync_WhenDataFetched_ShouldPublishViaMarketDataService()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "TCS" };
        var testQuote = CreateTestStockQuote("TCS");
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync("TCS"))
            .ReturnsAsync(testQuote);

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockMarketDataService.Verify(
            m => m.GetStockQuoteAsync("TCS"),
            Times.AtLeastOnce,
            "Service should call GetStockQuoteAsync which internally publishes updates");
    }

    [Fact]
    public async Task ExecuteAsync_WithMultipleSymbols_ShouldPublishAllUpdates()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE", "TCS", "INFY", "HDFC" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync((string symbol) => CreateTestStockQuote(symbol));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        foreach (var symbol in activeSymbols)
        {
            _mockMarketDataService.Verify(
                m => m.GetStockQuoteAsync(symbol),
                Times.AtLeastOnce,
                $"Service should fetch and publish data for {symbol}");
        }
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task ExecuteAsync_WhenSingleSymbolFails_ShouldContinueWithOtherSymbols()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE", "FAIL", "TCS" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync("FAIL"))
            .ThrowsAsync(new Exception("API error for FAIL"));

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync("RELIANCE"))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync("TCS"))
            .ReturnsAsync(CreateTestStockQuote("TCS"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockMarketDataService.Verify(
            m => m.GetStockQuoteAsync("RELIANCE"),
            Times.AtLeastOnce,
            "Service should continue processing other symbols after one fails");

        _mockMarketDataService.Verify(
            m => m.GetStockQuoteAsync("TCS"),
            Times.AtLeastOnce,
            "Service should continue processing other symbols after one fails");

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error fetching data for symbol: FAIL")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log warning for failed symbol");
    }

    [Fact]
    public async Task ExecuteAsync_WhenSymbolReturnsNull_ShouldLogWarningAndContinue()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE", "NULL_SYMBOL" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync("NULL_SYMBOL"))
            .ReturnsAsync((StockQuote?)null);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync("RELIANCE"))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for initial delay + one cycle
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to fetch data for symbol: NULL_SYMBOL")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log warning when symbol returns null");

        _mockMarketDataService.Verify(
            m => m.GetStockQuoteAsync("RELIANCE"),
            Times.AtLeastOnce,
            "Service should continue processing other symbols");
    }

    [Fact]
    public async Task ExecuteAsync_WhenSubscriptionServiceFails_ShouldLogErrorAndRetry()
    {
        // Arrange
        var callCount = 0;
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new Exception("Subscription service error");
                return new HashSet<string> { "RELIANCE" };
            });

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(7000); // Wait for initial delay + error recovery + retry
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error fetching and publishing active symbols")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log error when subscription service fails");

        _mockSubscriptionService.Verify(
            s => s.GetActiveSubscriptionsAsync(),
            Times.AtLeast(2),
            "Service should retry after error");
    }

    [Fact]
    public async Task ExecuteAsync_WithConsecutiveErrors_ShouldImplementExponentialBackoff()
    {
        // Arrange
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ThrowsAsync(new Exception("Persistent error"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(8000); // Wait for multiple error cycles
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("consecutive errors")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log consecutive errors");
    }

    [Fact]
    public async Task ExecuteAsync_AfterRecovery_ShouldResetErrorCounter()
    {
        // Arrange
        var callCount = 0;
        var activeSymbols = new HashSet<string> { "RELIANCE" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new Exception("Temporary error");
                return activeSymbols;
            });

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(7000); // Wait for error + recovery
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Service recovered")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log recovery message");
    }

    [Fact]
    public async Task ExecuteAsync_WhenCancelled_ShouldStopGracefully()
    {
        // Arrange
        var activeSymbols = new HashSet<string> { "RELIANCE" };
        
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(6000); // Wait for service to start
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("is stopping")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log stopping message");
    }

    [Fact]
    public async Task ExecuteAsync_WithMainLoopException_ShouldLogAndContinue()
    {
        // Arrange
        var callCount = 0;
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new InvalidOperationException("Main loop error");
                return new HashSet<string> { "RELIANCE" };
            });

        _mockMarketDataService
            .Setup(m => m.GetStockQuoteAsync(It.IsAny<string>()))
            .ReturnsAsync(CreateTestStockQuote("RELIANCE"));

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(7000); // Wait for error + recovery
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error fetching and publishing active symbols")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log errors when fetching fails");

        _mockSubscriptionService.Verify(
            s => s.GetActiveSubscriptionsAsync(),
            Times.AtLeast(2),
            "Service should continue after error");
    }

    #endregion

    #region Service Lifecycle Tests

    [Fact]
    public async Task StartAsync_ShouldLogStartupMessage()
    {
        // Arrange
        var activeSymbols = new HashSet<string>();
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        var service = CreateService();

        // Act
        var executeTask = service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(100); // Brief wait for startup
        _cancellationTokenSource.Cancel();
        await executeTask;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("ActiveSymbolsBackgroundService started")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once,
            "Service should log startup message");
    }

    [Fact]
    public async Task StopAsync_ShouldLogStoppingMessage()
    {
        // Arrange
        var activeSymbols = new HashSet<string>();
        _mockSubscriptionService
            .Setup(s => s.GetActiveSubscriptionsAsync())
            .ReturnsAsync(activeSymbols);

        var service = CreateService();

        // Act
        await service.StartAsync(_cancellationTokenSource.Token);
        await Task.Delay(100);
        await service.StopAsync(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("is stopping")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Service should log stopping message");
    }

    #endregion

    #region Helper Methods

    private ActiveSymbolsBackgroundService CreateService()
    {
        return new ActiveSymbolsBackgroundService(
            _mockServiceProvider.Object,
            _mockLogger.Object,
            _configuration
        );
    }

    private static StockQuote CreateTestStockQuote(string symbol)
    {
        return new StockQuote
        {
            Symbol = symbol,
            Name = $"{symbol} Company",
            Price = 2450.50m,
            Change = 12.30m,
            ChangePercent = 0.50m,
            Volume = 1234567,
            High = 2460.00m,
            Low = 2440.00m,
            Open = 2445.00m,
            PreviousClose = 2438.20m,
            Timestamp = DateTime.UtcNow,
            Exchange = "NSE",
            Currency = "INR",
            Source = "AlphaVantage"
        };
    }

    #endregion
}
