using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using StockTracker.Core.Constants;
using StockTracker.Core.Interfaces;
using StockTracker.Core.Models;
using StockTracker.Infrastructure.Services;
using Xunit;

namespace StockTracker.Tests.Services;

/// <summary>
/// Unit tests for WebSocketNotificationService
/// Tests cover: successful message publishing, error handling when Redis is unavailable, and message serialization
/// Requirements: 4.1, 4.2
/// </summary>
public class WebSocketNotificationServiceTests
{
    private readonly Mock<IConnectionMultiplexer> _mockRedis;
    private readonly Mock<ISubscriber> _mockSubscriber;
    private readonly Mock<ILogger<WebSocketNotificationService>> _mockLogger;
    private readonly IWebSocketNotificationService _service;

    public WebSocketNotificationServiceTests()
    {
        _mockRedis = new Mock<IConnectionMultiplexer>();
        _mockSubscriber = new Mock<ISubscriber>();
        _mockLogger = new Mock<ILogger<WebSocketNotificationService>>();

        _mockRedis.Setup(r => r.GetSubscriber(It.IsAny<object>()))
            .Returns(_mockSubscriber.Object);

        _service = new WebSocketNotificationService(
            _mockRedis.Object,
            _mockLogger.Object
        );
    }

    #region PublishPriceUpdateAsync Tests

    [Fact]
    public async Task PublishPriceUpdateAsync_WithValidData_ShouldPublishSuccessfully()
    {
        // Arrange
        var symbol = "RELIANCE";
        var quote = CreateTestStockQuote(symbol);
        
        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataUpdates),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(5); // 5 subscribers received the message

        // Act
        var result = await _service.PublishPriceUpdateAsync(symbol, quote);

        // Assert
        result.Should().BeTrue();
        
        _mockSubscriber.Verify(
            s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataUpdates),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()),
            Times.Once);
    }

    [Fact]
    public async Task PublishPriceUpdateAsync_ShouldSerializeMessageCorrectly()
    {
        // Arrange
        var symbol = "TCS";
        var quote = CreateTestStockQuote(symbol);
        RedisValue capturedMessage = default;

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .Callback<RedisChannel, RedisValue, CommandFlags>((_, msg, _) => capturedMessage = msg)
            .ReturnsAsync(1);

        // Act
        await _service.PublishPriceUpdateAsync(symbol, quote);

        // Assert
        capturedMessage.HasValue.Should().BeTrue();
        
        var deserializedMessage = JsonSerializer.Deserialize<JsonElement>(capturedMessage.ToString());
        deserializedMessage.GetProperty("type").GetString().Should().Be("price_update");
        deserializedMessage.GetProperty("symbol").GetString().Should().Be(symbol);
        
        var data = deserializedMessage.GetProperty("data");
        data.GetProperty("Symbol").GetString().Should().Be(symbol);
        data.GetProperty("Price").GetDecimal().Should().Be(quote.Price);
        data.GetProperty("Change").GetDecimal().Should().Be(quote.Change);
        data.GetProperty("ChangePercent").GetDecimal().Should().Be(quote.ChangePercent);
    }

    [Fact]
    public async Task PublishPriceUpdateAsync_WhenNoSubscribers_ShouldReturnFalse()
    {
        // Arrange
        var symbol = "INFY";
        var quote = CreateTestStockQuote(symbol);
        
        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(0); // No subscribers

        // Act
        var result = await _service.PublishPriceUpdateAsync(symbol, quote);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task PublishPriceUpdateAsync_WhenRedisThrowsException_ShouldReturnFalseAndLogError()
    {
        // Arrange
        var symbol = "HDFC";
        var quote = CreateTestStockQuote(symbol);
        
        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(new RedisConnectionException(ConnectionFailureType.UnableToConnect, "Connection failed"));

        // Act
        var result = await _service.PublishPriceUpdateAsync(symbol, quote);

        // Assert
        result.Should().BeFalse();
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Failed to publish price update for {symbol}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region PublishBatchUpdatesAsync Tests

    [Fact]
    public async Task PublishBatchUpdatesAsync_WithValidData_ShouldPublishSuccessfully()
    {
        // Arrange
        var updates = new Dictionary<string, StockQuote>
        {
            { "RELIANCE", CreateTestStockQuote("RELIANCE") },
            { "TCS", CreateTestStockQuote("TCS") },
            { "INFY", CreateTestStockQuote("INFY") }
        };

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataUpdates),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(3);

        // Act
        var result = await _service.PublishBatchUpdatesAsync(updates);

        // Assert
        result.Should().Be(3);
        
        _mockSubscriber.Verify(
            s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataUpdates),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()),
            Times.Once);
    }

    [Fact]
    public async Task PublishBatchUpdatesAsync_ShouldSerializeBatchMessageCorrectly()
    {
        // Arrange
        var updates = new Dictionary<string, StockQuote>
        {
            { "RELIANCE", CreateTestStockQuote("RELIANCE") },
            { "TCS", CreateTestStockQuote("TCS") }
        };
        RedisValue capturedMessage = default;

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .Callback<RedisChannel, RedisValue, CommandFlags>((_, msg, _) => capturedMessage = msg)
            .ReturnsAsync(1);

        // Act
        await _service.PublishBatchUpdatesAsync(updates);

        // Assert
        capturedMessage.HasValue.Should().BeTrue();
        
        var deserializedMessage = JsonSerializer.Deserialize<JsonElement>(capturedMessage.ToString());
        deserializedMessage.GetProperty("type").GetString().Should().Be("batch_update");
        
        var updatesArray = deserializedMessage.GetProperty("updates");
        updatesArray.GetArrayLength().Should().Be(2);
        
        var firstUpdate = updatesArray[0];
        firstUpdate.GetProperty("symbol").GetString().Should().Be("RELIANCE");
        firstUpdate.GetProperty("data").GetProperty("Symbol").GetString().Should().Be("RELIANCE");
    }

    [Fact]
    public async Task PublishBatchUpdatesAsync_WithEmptyDictionary_ShouldReturnZero()
    {
        // Arrange
        var updates = new Dictionary<string, StockQuote>();

        // Act
        var result = await _service.PublishBatchUpdatesAsync(updates);

        // Assert
        result.Should().Be(0);
        
        _mockSubscriber.Verify(
            s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()),
            Times.Never);
    }

    [Fact]
    public async Task PublishBatchUpdatesAsync_WithNullDictionary_ShouldReturnZero()
    {
        // Act
        var result = await _service.PublishBatchUpdatesAsync(null!);

        // Assert
        result.Should().Be(0);
        
        _mockSubscriber.Verify(
            s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()),
            Times.Never);
    }

    [Fact]
    public async Task PublishBatchUpdatesAsync_WhenRedisThrowsException_ShouldReturnZeroAndLogError()
    {
        // Arrange
        var updates = new Dictionary<string, StockQuote>
        {
            { "RELIANCE", CreateTestStockQuote("RELIANCE") }
        };

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(new TimeoutException("Redis timeout"));

        // Act
        var result = await _service.PublishBatchUpdatesAsync(updates);

        // Assert
        result.Should().Be(0);
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to publish batch updates")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region NotifySubscriptionChangeAsync Tests

    [Fact]
    public async Task NotifySubscriptionChangeAsync_WithValidData_ShouldPublishSuccessfully()
    {
        // Arrange
        var action = "subscribe";
        var symbols = new List<string> { "RELIANCE", "TCS", "INFY" };

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataSubscriptions),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(2);

        // Act
        var result = await _service.NotifySubscriptionChangeAsync(action, symbols);

        // Assert
        result.Should().BeTrue();
        
        _mockSubscriber.Verify(
            s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataSubscriptions),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifySubscriptionChangeAsync_ShouldSerializeMessageCorrectly()
    {
        // Arrange
        var action = "unsubscribe";
        var symbols = new List<string> { "HDFC", "ICICI" };
        RedisValue capturedMessage = default;

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .Callback<RedisChannel, RedisValue, CommandFlags>((_, msg, _) => capturedMessage = msg)
            .ReturnsAsync(1);

        // Act
        await _service.NotifySubscriptionChangeAsync(action, symbols);

        // Assert
        capturedMessage.HasValue.Should().BeTrue();
        
        var deserializedMessage = JsonSerializer.Deserialize<JsonElement>(capturedMessage.ToString());
        deserializedMessage.GetProperty("action").GetString().Should().Be(action);
        
        var symbolsArray = deserializedMessage.GetProperty("symbols");
        symbolsArray.GetArrayLength().Should().Be(2);
        symbolsArray[0].GetString().Should().Be("HDFC");
        symbolsArray[1].GetString().Should().Be("ICICI");
    }

    [Fact]
    public async Task NotifySubscriptionChangeAsync_WhenRedisUnavailable_ShouldReturnFalseAndLogError()
    {
        // Arrange
        var action = "subscribe";
        var symbols = new List<string> { "RELIANCE" };

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(new RedisConnectionException(ConnectionFailureType.SocketClosed, "Socket closed"));

        // Act
        var result = await _service.NotifySubscriptionChangeAsync(action, symbols);

        // Assert
        result.Should().BeFalse();
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to notify subscription change")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region IsWebSocketServerHealthyAsync Tests

    [Fact]
    public async Task IsWebSocketServerHealthyAsync_WhenRedisConnected_ShouldReturnTrue()
    {
        // Arrange
        var mockDatabase = new Mock<IDatabase>();
        
        _mockRedis.Setup(r => r.IsConnected).Returns(true);
        _mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);
        
        mockDatabase.Setup(d => d.PingAsync(It.IsAny<CommandFlags>()))
            .ReturnsAsync(TimeSpan.FromMilliseconds(50));

        // Act
        var result = await _service.IsWebSocketServerHealthyAsync();

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsWebSocketServerHealthyAsync_WhenRedisNotConnected_ShouldReturnFalse()
    {
        // Arrange
        _mockRedis.Setup(r => r.IsConnected).Returns(false);

        // Act
        var result = await _service.IsWebSocketServerHealthyAsync();

        // Assert
        result.Should().BeFalse();
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Redis connection is not active")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task IsWebSocketServerHealthyAsync_WhenPingThrowsException_ShouldReturnFalse()
    {
        // Arrange
        var mockDatabase = new Mock<IDatabase>();
        
        _mockRedis.Setup(r => r.IsConnected).Returns(true);
        _mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);
        
        mockDatabase.Setup(d => d.PingAsync(It.IsAny<CommandFlags>()))
            .ThrowsAsync(new RedisConnectionException(ConnectionFailureType.UnableToConnect, "Ping failed"));

        // Act
        var result = await _service.IsWebSocketServerHealthyAsync();

        // Assert
        result.Should().BeFalse();
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Health check failed")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task IsWebSocketServerHealthyAsync_WhenPingIsHigh_ShouldLogWarningButReturnTrue()
    {
        // Arrange
        var mockDatabase = new Mock<IDatabase>();
        
        _mockRedis.Setup(r => r.IsConnected).Returns(true);
        _mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);
        
        mockDatabase.Setup(d => d.PingAsync(It.IsAny<CommandFlags>()))
            .ReturnsAsync(TimeSpan.FromMilliseconds(1500)); // High ping time

        // Act
        var result = await _service.IsWebSocketServerHealthyAsync();

        // Assert
        result.Should().BeTrue();
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Redis ping time is high")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region PublishControlMessageAsync Tests

    [Fact]
    public async Task PublishControlMessageAsync_WithValidAction_ShouldPublishSuccessfully()
    {
        // Arrange
        var action = "pause";
        var data = new { reason = "maintenance" };

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataControl),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.PublishControlMessageAsync(action, data);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task PublishControlMessageAsync_WithNullData_ShouldPublishSuccessfully()
    {
        // Arrange
        var action = "resume";

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.PublishControlMessageAsync(action, null);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task PublishControlMessageAsync_WhenRedisUnavailable_ShouldReturnFalse()
    {
        // Arrange
        var action = "pause";

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(new RedisException("Redis error"));

        // Act
        var result = await _service.PublishControlMessageAsync(action);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region PublishErrorAsync Tests

    [Fact]
    public async Task PublishErrorAsync_WithValidError_ShouldPublishSuccessfully()
    {
        // Arrange
        var symbol = "INVALID";
        var errorMessage = "Symbol not found";

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == RedisChannels.MarketDataUpdates),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ReturnsAsync(2);

        // Act
        var result = await _service.PublishErrorAsync(symbol, errorMessage);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task PublishErrorAsync_ShouldSerializeErrorMessageCorrectly()
    {
        // Arrange
        var symbol = "BADSTOCK";
        var errorMessage = "API rate limit exceeded";
        RedisValue capturedMessage = default;

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .Callback<RedisChannel, RedisValue, CommandFlags>((_, msg, _) => capturedMessage = msg)
            .ReturnsAsync(1);

        // Act
        await _service.PublishErrorAsync(symbol, errorMessage);

        // Assert
        capturedMessage.HasValue.Should().BeTrue();
        
        var deserializedMessage = JsonSerializer.Deserialize<JsonElement>(capturedMessage.ToString());
        deserializedMessage.GetProperty("type").GetString().Should().Be("error");
        deserializedMessage.GetProperty("symbol").GetString().Should().Be(symbol);
        deserializedMessage.GetProperty("error").GetString().Should().Be(errorMessage);
    }

    [Fact]
    public async Task PublishErrorAsync_WhenRedisUnavailable_ShouldReturnFalse()
    {
        // Arrange
        var symbol = "TEST";
        var errorMessage = "Test error";

        _mockSubscriber
            .Setup(s => s.PublishAsync(
                It.IsAny<RedisChannel>(),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(new RedisTimeoutException("Timeout", CommandStatus.Unknown));

        // Act
        var result = await _service.PublishErrorAsync(symbol, errorMessage);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Constructor Tests

    [Fact]
    public void Constructor_WithNullRedis_ShouldThrowArgumentNullException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentNullException>(() =>
            new WebSocketNotificationService(null!, _mockLogger.Object));
        
        exception.ParamName.Should().Be("redis");
    }

    [Fact]
    public void Constructor_WithNullLogger_ShouldThrowArgumentNullException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentNullException>(() =>
            new WebSocketNotificationService(_mockRedis.Object, null!));
        
        exception.ParamName.Should().Be("logger");
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
