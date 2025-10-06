namespace StockTracker.Core.Exceptions;

/// <summary>
/// Exception thrown when user doesn't have permission to access a resource
/// </summary>
public class ForbiddenException : BaseException
{
    public ForbiddenException(string message = "You don't have permission to access this resource") 
        : base(message, "FORBIDDEN", 403)
    {
    }
}
