using System.Text.RegularExpressions;
using StockTracker.Core.Exceptions;

namespace StockTracker.Core.Validation;

/// <summary>
/// Provides input validation and sanitization methods
/// </summary>
public static class InputValidator
{
    private static readonly Regex StockSymbolRegex = new(@"^[A-Z0-9]{1,10}$", RegexOptions.Compiled);
    private static readonly Regex AlphanumericRegex = new(@"^[a-zA-Z0-9\s\-_.]+$", RegexOptions.Compiled);

    /// <summary>
    /// Validates a stock symbol
    /// </summary>
    public static string ValidateStockSymbol(string symbol, string fieldName = "symbol")
    {
        if (string.IsNullOrWhiteSpace(symbol))
        {
            throw new ValidationException(fieldName, "Stock symbol is required");
        }

        var sanitized = symbol.Trim().ToUpperInvariant();

        if (!StockSymbolRegex.IsMatch(sanitized))
        {
            throw new ValidationException(fieldName, "Stock symbol must be 1-10 alphanumeric characters");
        }

        return sanitized;
    }

    /// <summary>
    /// Validates a price value
    /// </summary>
    public static decimal ValidatePrice(decimal price, string fieldName = "price")
    {
        if (price <= 0)
        {
            throw new ValidationException(fieldName, "Price must be greater than 0");
        }

        if (price > 10000000)
        {
            throw new ValidationException(fieldName, "Price exceeds maximum allowed value");
        }

        return price;
    }

    /// <summary>
    /// Validates a quantity value
    /// </summary>
    public static int ValidateQuantity(int quantity, string fieldName = "quantity")
    {
        if (quantity <= 0)
        {
            throw new ValidationException(fieldName, "Quantity must be greater than 0");
        }

        if (quantity > 1000000)
        {
            throw new ValidationException(fieldName, "Quantity exceeds maximum allowed value");
        }

        return quantity;
    }

    /// <summary>
    /// Validates a percentage value
    /// </summary>
    public static decimal ValidatePercentage(decimal percentage, string fieldName = "percentage")
    {
        if (percentage <= 0)
        {
            throw new ValidationException(fieldName, "Percentage must be greater than 0");
        }

        if (percentage > 100)
        {
            throw new ValidationException(fieldName, "Percentage cannot exceed 100");
        }

        return percentage;
    }

    /// <summary>
    /// Validates a GUID
    /// </summary>
    public static Guid ValidateGuid(string guidString, string fieldName = "id")
    {
        if (string.IsNullOrWhiteSpace(guidString))
        {
            throw new ValidationException(fieldName, "ID is required");
        }

        if (!Guid.TryParse(guidString, out var guid))
        {
            throw new ValidationException(fieldName, "Invalid ID format");
        }

        if (guid == Guid.Empty)
        {
            throw new ValidationException(fieldName, "ID cannot be empty");
        }

        return guid;
    }

    /// <summary>
    /// Sanitizes a string to prevent injection attacks
    /// </summary>
    public static string SanitizeString(string input, int maxLength = 255)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        // Trim and limit length
        var sanitized = input.Trim();
        if (sanitized.Length > maxLength)
        {
            sanitized = sanitized.Substring(0, maxLength);
        }

        // Remove potentially dangerous characters
        sanitized = sanitized
            .Replace("<", "")
            .Replace(">", "")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace(";", "")
            .Replace("--", "")
            .Replace("/*", "")
            .Replace("*/", "")
            .Replace("xp_", "")
            .Replace("sp_", "");

        return sanitized;
    }

    /// <summary>
    /// Validates an alphanumeric string
    /// </summary>
    public static string ValidateAlphanumeric(string input, string fieldName = "value", int maxLength = 255)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            throw new ValidationException(fieldName, $"{fieldName} is required");
        }

        var sanitized = input.Trim();

        if (sanitized.Length > maxLength)
        {
            throw new ValidationException(fieldName, $"{fieldName} exceeds maximum length of {maxLength}");
        }

        if (!AlphanumericRegex.IsMatch(sanitized))
        {
            throw new ValidationException(fieldName, $"{fieldName} contains invalid characters");
        }

        return sanitized;
    }

    /// <summary>
    /// Validates a list of stock symbols
    /// </summary>
    public static List<string> ValidateStockSymbols(string symbolsString, int maxCount = 50)
    {
        if (string.IsNullOrWhiteSpace(symbolsString))
        {
            throw new ValidationException("symbols", "At least one symbol is required");
        }

        var symbols = symbolsString
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        if (symbols.Count == 0)
        {
            throw new ValidationException("symbols", "At least one valid symbol is required");
        }

        if (symbols.Count > maxCount)
        {
            throw new ValidationException("symbols", $"Maximum {maxCount} symbols allowed");
        }

        foreach (var symbol in symbols)
        {
            if (!StockSymbolRegex.IsMatch(symbol))
            {
                throw new ValidationException("symbols", $"Invalid symbol format: {symbol}");
            }
        }

        return symbols;
    }
}
