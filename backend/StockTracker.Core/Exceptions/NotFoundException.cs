namespace StockTracker.Core.Exceptions;

/// <summary>
/// Exception thrown when a requested resource is not found
/// </summary>
public class NotFoundException : BaseException
{
    public NotFoundException(string message) 
        : base(message, "NOT_FOUND", 404)
    {
    }

    public NotFoundException(string resourceType, string identifier) 
        : base($"{resourceType} with identifier '{identifier}' was not found", "NOT_FOUND", 404)
    {
    }
}
