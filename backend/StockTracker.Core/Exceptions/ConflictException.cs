namespace StockTracker.Core.Exceptions;

/// <summary>
/// Exception thrown when a request conflicts with the current state
/// </summary>
public class ConflictException : BaseException
{
    public ConflictException(string message) 
        : base(message, "CONFLICT", 409)
    {
    }
}
