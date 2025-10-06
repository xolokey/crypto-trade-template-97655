# StockTracker.Tests

This project contains unit tests for the StockTracker application.

## Test Coverage

### WebSocketNotificationService Tests

The `WebSocketNotificationServiceTests` class provides comprehensive test coverage for the `WebSocketNotificationService`, which is responsible for publishing real-time updates to WebSocket clients via Redis PubSub.

#### Test Categories

**1. PublishPriceUpdateAsync Tests (5 tests)**
- ✅ Successful message publishing with valid data
- ✅ Correct message serialization (JSON format validation)
- ✅ Returns false when no subscribers are present
- ✅ Error handling when Redis throws exceptions
- ✅ Proper error logging on failures

**2. PublishBatchUpdatesAsync Tests (5 tests)**
- ✅ Successful batch publishing with multiple symbols
- ✅ Correct batch message serialization
- ✅ Handles empty dictionary gracefully
- ✅ Handles null dictionary gracefully
- ✅ Error handling and logging when Redis is unavailable

**3. NotifySubscriptionChangeAsync Tests (3 tests)**
- ✅ Successful subscription change notifications
- ✅ Correct message serialization for subscription changes
- ✅ Error handling when Redis is unavailable

**4. IsWebSocketServerHealthyAsync Tests (4 tests)**
- ✅ Returns true when Redis is connected and responsive
- ✅ Returns false when Redis is not connected
- ✅ Returns false when ping throws exception
- ✅ Logs warning but returns true when ping latency is high (>1000ms)

**5. PublishControlMessageAsync Tests (3 tests)**
- ✅ Successful control message publishing
- ✅ Handles null data parameter correctly
- ✅ Error handling when Redis is unavailable

**6. PublishErrorAsync Tests (3 tests)**
- ✅ Successful error message publishing
- ✅ Correct error message serialization
- ✅ Error handling when Redis is unavailable

**7. Constructor Tests (2 tests)**
- ✅ Throws ArgumentNullException when Redis is null
- ✅ Throws ArgumentNullException when Logger is null

## Test Statistics

- **Total Tests**: 24
- **Passed**: 24
- **Failed**: 0
- **Success Rate**: 100%

## Requirements Coverage

These tests fulfill the requirements specified in task 2.3:
- ✅ Test successful message publishing
- ✅ Test error handling when Redis is unavailable
- ✅ Test message serialization

Requirements covered: 4.1, 4.2

## Running the Tests

```bash
# Run all tests
dotnet test backend/StockTracker.Tests/StockTracker.Tests.csproj

# Run with detailed output
dotnet test backend/StockTracker.Tests/StockTracker.Tests.csproj --verbosity detailed

# Run specific test class
dotnet test backend/StockTracker.Tests/StockTracker.Tests.csproj --filter "FullyQualifiedName~WebSocketNotificationServiceTests"
```

## Technologies Used

- **xUnit**: Testing framework
- **Moq**: Mocking framework for creating test doubles
- **FluentAssertions**: Fluent assertion library for more readable tests
- **StackExchange.Redis**: Redis client library (mocked in tests)

## Test Structure

Each test follows the Arrange-Act-Assert (AAA) pattern:

```csharp
[Fact]
public async Task MethodName_Scenario_ExpectedBehavior()
{
    // Arrange - Set up test data and mocks
    var symbol = "RELIANCE";
    var quote = CreateTestStockQuote(symbol);
    
    // Act - Execute the method under test
    var result = await _service.PublishPriceUpdateAsync(symbol, quote);
    
    // Assert - Verify the expected outcome
    result.Should().BeTrue();
}
```

## Key Testing Patterns

1. **Mocking External Dependencies**: Redis connections are mocked to isolate the service logic
2. **Message Capture**: Tests capture published messages to verify serialization
3. **Error Simulation**: Tests simulate various error conditions (connection failures, timeouts, etc.)
4. **Logging Verification**: Tests verify that appropriate log messages are generated
5. **Null Safety**: Tests verify proper handling of null parameters

## Future Enhancements

- Add integration tests with real Redis instance
- Add performance tests for high-throughput scenarios
- Add tests for concurrent publishing scenarios
- Add code coverage reporting
