using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface ITwelveDataService
{
    Task<StockQuote?> GetQuoteAsync(string symbol);
    Task<List<StockQuote>> GetMultipleQuotesAsync(List<string> symbols);
    Task<List<HistoricalData>> GetTimeSeriesAsync(string symbol, string interval, int outputSize);
}
