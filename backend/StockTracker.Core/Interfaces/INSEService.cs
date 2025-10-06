using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface INSEService
{
    Task<IndexData?> GetNifty50Async();
    Task<List<IndexData>> GetAllIndicesAsync();
    Task<StockQuote?> GetStockQuoteAsync(string symbol);
}
