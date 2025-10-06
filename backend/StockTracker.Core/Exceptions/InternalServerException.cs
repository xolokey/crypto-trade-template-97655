namespace StockTracker.Core.Exceptions;

/// <summary>
/// Exception thrown for internal server errors
/// </summary>
public class InternalServerException : BaseException
{
    public InternalServerException(string message) 
        : base(message, "INTERNAL_SERVER_ERROR", 500)
    {
    }

    public InternalServerException(string message, Exception innerException) 
        : base(message, "INTERNAL_SERVER_ERROR", 500, innerException)
    {
    }
}
