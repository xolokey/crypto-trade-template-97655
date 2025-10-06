using System.Net.WebSockets;
using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface IMarketDataService
{
    Task<StockQuote?> GetStockQuoteAsync(string symbol);
    Task<List<StockQuote>> GetMultipleQuotesAsync(List<string> symbols);
    Task<List<IndexData>> GetMarketIndicesAsync();
    Task<List<HistoricalData>> GetHistoricalDataAsync(string symbol, string interval, int outputSize);
    Task HandleWebSocketConnection(WebSocket webSocket);
}
