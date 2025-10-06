using System.Diagnostics;

namespace StockTracker.API.Middleware;

/// <summary>
/// Middleware for logging HTTP requests and responses with timing information
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.TraceIdentifier;
        var method = context.Request.Method;
        var path = context.Request.Path;
        var queryString = context.Request.QueryString;

        // Start timing
        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Log request
            _logger.LogInformation(
                "HTTP {Method} {Path}{QueryString} started. RequestId: {RequestId}",
                method,
                path,
                queryString,
                requestId
            );

            await _next(context);

            stopwatch.Stop();

            // Log response
            var statusCode = context.Response.StatusCode;
            var elapsedMs = stopwatch.ElapsedMilliseconds;

            var logLevel = statusCode >= 500 ? LogLevel.Error :
                          statusCode >= 400 ? LogLevel.Warning :
                          LogLevel.Information;

            _logger.Log(
                logLevel,
                "HTTP {Method} {Path}{QueryString} responded {StatusCode} in {ElapsedMs}ms. RequestId: {RequestId}",
                method,
                path,
                queryString,
                statusCode,
                elapsedMs,
                requestId
            );

            // Log slow requests
            if (elapsedMs > 1000)
            {
                _logger.LogWarning(
                    "Slow request detected: {Method} {Path} took {ElapsedMs}ms. RequestId: {RequestId}",
                    method,
                    path,
                    elapsedMs,
                    requestId
                );
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "HTTP {Method} {Path}{QueryString} failed after {ElapsedMs}ms. RequestId: {RequestId}",
                method,
                path,
                queryString,
                stopwatch.ElapsedMilliseconds,
                requestId
            );

            throw;
        }
    }
}
