using StockTracker.Core.Models;

namespace StockTracker.Core.Interfaces;

public interface IAlphaVantageService
{
    Task<StockQuote?> GetQuoteAsync(string symbol);
    Task<List<HistoricalData>> GetHistoricalDataAsync(string symbol, string interval, int outputSize);
}
