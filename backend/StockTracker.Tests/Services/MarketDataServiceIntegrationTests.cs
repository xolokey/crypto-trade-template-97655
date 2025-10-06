using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;
using StockTracker.Infrastructure.Services;
using Xunit;

namespace StockTracker.Tests.Services;

/// <summary>
/// Integration tests for MarketDataService WebSocket notification integration
/// Tests cover: updates published after fetching data, updates only for subscribed symbols, error handling when publishing fails
/// Requirements: 4.1, 4.3
/// </summary>
public class MarketDataServiceIntegrationTests
{
    private readonly Mock<IAlphaVantageService> _mockAlphaVantageService;
    private readonly Mock<ITwelveDataService> _mockTwelveDataService;
    private readonly Mock<INSEService> _mockNSEService;
    private readonly Mock<ICacheService> _mockCacheService;
    private readonly Mock<IWebSocketNotificationService> _mockWsNotificationService;
    private readonly Mock<ISubscriptionTrackingService> _mockSubscriptionTrackingService;
    private readonly Mock<ILogger<MarketDataService>> _mockLogger;
    private readonly IMarketDataService _service;

    public MarketDataServiceIntegrationTests()
    {
        _mockAlphaVantageService = new Mock<IAlphaVantageService>();
        _mockTwelveDataService = new Mock<ITwelveDataService>();
        _mockNSEService = new Mock<INSEService>();
        _mockCacheService = new Mock<ICacheService>();
        _mockWsNotificationService = new Mock<IWebSocketNotificationService>();
        _mockSubscriptionTrackingService = new Mock<ISubscriptionTrackingService>();
        _mockLogger = new Mock<ILogger<MarketDataService>>();

        _service = new MarketDataService(
            _mockAlphaVantageService.Object,
            _mockTwelveDataService.Object,
            _mockNSEService.Object,
            _mockCacheService.Object,
            _mockWsNotificationService.Object,
            _mockSubscriptionTrackingService.Object,
            _mockLogger.Object
        );
    }

    #region Test that updates are published after fetching data

    [Fact]
    public async Task GetStockQuoteAsync_WhenSymbolIsSubscribed_ShouldPublishUpdateAfterFetching()
    {
        // Arrange
        var symbol = "RELIANCE";
        var quote = CreateTestStockQuote(symbol);

        // Cache miss
        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        // Alpha Vantage returns data
        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        // Symbol is subscribed
        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        // WebSocket notification succeeds
        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, quote))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert
        result.Should().NotBeNull();
        result!.Symbol.Should().Be(symbol);

        // Verify data was cached
        _mockCacheService.Verify(
            c => c.SetAsync(
                $"quote:{symbol}",
                It.IsAny<StockQuote>(),
                It.IsAny<TimeSpan>()),
            Times.Once);

        // Verify WebSocket update was published
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol, quote),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenFetchedFromTwelveData_ShouldPublishUpdate()
    {
        // Arrange
        var symbol = "TCS";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        // Alpha Vantage fails
        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync((StockQuote?)null);

        // Twelve Data succeeds
        _mockTwelveDataService
            .Setup(t => t.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, quote))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert
        result.Should().NotBeNull();
        
        // Verify WebSocket update was published
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol, It.IsAny<StockQuote>()),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenFetchedFromNSE_ShouldPublishUpdate()
    {
        // Arrange
        var symbol = "INFY";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        // Alpha Vantage and Twelve Data fail
        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync((StockQuote?)null);

        _mockTwelveDataService
            .Setup(t => t.GetQuoteAsync(symbol))
            .ReturnsAsync((StockQuote?)null);

        // NSE succeeds
        _mockNSEService
            .Setup(n => n.GetStockQuoteAsync(symbol))
            .ReturnsAsync(quote);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, quote))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert
        result.Should().NotBeNull();
        
        // Verify WebSocket update was published
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol, It.IsAny<StockQuote>()),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenAllAPIsFail_ShouldPublishMockDataUpdate()
    {
        // Arrange
        var symbol = "HDFC";

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        // All APIs fail
        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync((StockQuote?)null);

        _mockTwelveDataService
            .Setup(t => t.GetQuoteAsync(symbol))
            .ReturnsAsync((StockQuote?)null);

        _mockNSEService
            .Setup(n => n.GetStockQuoteAsync(symbol))
            .ReturnsAsync((StockQuote?)null);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, It.IsAny<StockQuote>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert
        result.Should().NotBeNull();
        result!.Symbol.Should().Be(symbol);
        result.Source.Should().Contain("Mock");
        
        // Verify WebSocket update was published even for mock data
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol, It.IsAny<StockQuote>()),
            Times.Once);
    }

    #endregion

    #region Test that updates are only published for subscribed symbols

    [Fact]
    public async Task GetStockQuoteAsync_WhenSymbolIsNotSubscribed_ShouldNotPublishUpdate()
    {
        // Arrange
        var symbol = "UNSUBSCRIBED";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        // Symbol is NOT subscribed
        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert
        result.Should().NotBeNull();
        
        // Verify data was cached
        _mockCacheService.Verify(
            c => c.SetAsync(
                $"quote:{symbol}",
                It.IsAny<StockQuote>(),
                It.IsAny<TimeSpan>()),
            Times.Once);

        // Verify WebSocket update was NOT published
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(It.IsAny<string>(), It.IsAny<StockQuote>()),
            Times.Never);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenCacheHit_ShouldNotPublishUpdate()
    {
        // Arrange
        var symbol = "CACHED";
        var cachedQuote = CreateTestStockQuote(symbol);

        // Cache hit
        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>($"quote:{symbol}"))
            .ReturnsAsync(cachedQuote);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert
        result.Should().NotBeNull();
        result.Should().Be(cachedQuote);
        
        // Verify no API calls were made
        _mockAlphaVantageService.Verify(
            a => a.GetQuoteAsync(It.IsAny<string>()),
            Times.Never);

        // Verify WebSocket update was NOT published (data from cache)
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(It.IsAny<string>(), It.IsAny<StockQuote>()),
            Times.Never);
    }

    [Fact]
    public async Task GetStockQuoteAsync_MultipleSymbols_ShouldOnlyPublishForSubscribed()
    {
        // Arrange
        var subscribedSymbol = "SUBSCRIBED";
        var unsubscribedSymbol = "UNSUBSCRIBED";
        
        var subscribedQuote = CreateTestStockQuote(subscribedSymbol);
        var unsubscribedQuote = CreateTestStockQuote(unsubscribedSymbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(subscribedSymbol))
            .ReturnsAsync(subscribedQuote);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(unsubscribedSymbol))
            .ReturnsAsync(unsubscribedQuote);

        // First symbol is subscribed
        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(subscribedSymbol))
            .ReturnsAsync(true);

        // Second symbol is not subscribed
        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(unsubscribedSymbol))
            .ReturnsAsync(false);

        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(It.IsAny<string>(), It.IsAny<StockQuote>()))
            .ReturnsAsync(true);

        // Act
        var result1 = await _service.GetStockQuoteAsync(subscribedSymbol);
        var result2 = await _service.GetStockQuoteAsync(unsubscribedSymbol);

        // Assert
        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
        
        // Verify WebSocket update was published only for subscribed symbol
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(subscribedSymbol, subscribedQuote),
            Times.Once);

        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(unsubscribedSymbol, It.IsAny<StockQuote>()),
            Times.Never);
    }

    #endregion

    #region Test error handling when publishing fails

    [Fact]
    public async Task GetStockQuoteAsync_WhenPublishFails_ShouldStillReturnData()
    {
        // Arrange
        var symbol = "RELIANCE";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        // WebSocket notification fails
        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, quote))
            .ThrowsAsync(new Exception("Redis connection failed"));

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert - Main operation should still succeed
        result.Should().NotBeNull();
        result!.Symbol.Should().Be(symbol);
        
        // Verify data was still cached
        _mockCacheService.Verify(
            c => c.SetAsync(
                $"quote:{symbol}",
                It.IsAny<StockQuote>(),
                It.IsAny<TimeSpan>()),
            Times.Once);

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Failed to publish WebSocket update for {symbol}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenPublishReturnsFalse_ShouldStillSucceed()
    {
        // Arrange
        var symbol = "TCS";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        // WebSocket notification returns false (no subscribers received)
        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, quote))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert - Main operation should still succeed
        result.Should().NotBeNull();
        result!.Symbol.Should().Be(symbol);
        
        // Verify publish was attempted
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol, quote),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenSubscriptionCheckFails_ShouldNotPublish()
    {
        // Arrange
        var symbol = "INFY";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        // Subscription check throws exception
        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ThrowsAsync(new Exception("Redis unavailable"));

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert - Main operation should still succeed
        result.Should().NotBeNull();
        result!.Symbol.Should().Be(symbol);
        
        // Verify publish was not attempted
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(It.IsAny<string>(), It.IsAny<StockQuote>()),
            Times.Never);

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Failed to publish WebSocket update for {symbol}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_WhenPublishTimesOut_ShouldNotBlockMainOperation()
    {
        // Arrange
        var symbol = "HDFC";
        var quote = CreateTestStockQuote(symbol);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol))
            .ReturnsAsync(quote);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(symbol))
            .ReturnsAsync(true);

        // WebSocket notification times out
        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol, quote))
            .ThrowsAsync(new TimeoutException("Publish timeout"));

        // Act
        var result = await _service.GetStockQuoteAsync(symbol);

        // Assert - Main operation should complete successfully
        result.Should().NotBeNull();
        result!.Symbol.Should().Be(symbol);
        
        // Verify data was cached despite publish failure
        _mockCacheService.Verify(
            c => c.SetAsync(
                $"quote:{symbol}",
                It.IsAny<StockQuote>(),
                It.IsAny<TimeSpan>()),
            Times.Once);
    }

    [Fact]
    public async Task GetStockQuoteAsync_ConcurrentRequests_ShouldHandlePublishFailuresIndependently()
    {
        // Arrange
        var symbol1 = "SYMBOL1";
        var symbol2 = "SYMBOL2";
        var quote1 = CreateTestStockQuote(symbol1);
        var quote2 = CreateTestStockQuote(symbol2);

        _mockCacheService
            .Setup(c => c.GetAsync<StockQuote>(It.IsAny<string>()))
            .ReturnsAsync((StockQuote?)null);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol1))
            .ReturnsAsync(quote1);

        _mockAlphaVantageService
            .Setup(a => a.GetQuoteAsync(symbol2))
            .ReturnsAsync(quote2);

        _mockSubscriptionTrackingService
            .Setup(s => s.IsSymbolSubscribedAsync(It.IsAny<string>()))
            .ReturnsAsync(true);

        // First publish succeeds
        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol1, quote1))
            .ReturnsAsync(true);

        // Second publish fails
        _mockWsNotificationService
            .Setup(w => w.PublishPriceUpdateAsync(symbol2, quote2))
            .ThrowsAsync(new Exception("Publish failed"));

        // Act
        var task1 = _service.GetStockQuoteAsync(symbol1);
        var task2 = _service.GetStockQuoteAsync(symbol2);
        var results = await Task.WhenAll(task1, task2);

        // Assert - Both operations should succeed
        results[0].Should().NotBeNull();
        results[0]!.Symbol.Should().Be(symbol1);
        results[1].Should().NotBeNull();
        results[1]!.Symbol.Should().Be(symbol2);
        
        // Verify both publish attempts were made
        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol1, quote1),
            Times.Once);

        _mockWsNotificationService.Verify(
            w => w.PublishPriceUpdateAsync(symbol2, quote2),
            Times.Once);
    }

    #endregion

    #region Helper Methods

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
