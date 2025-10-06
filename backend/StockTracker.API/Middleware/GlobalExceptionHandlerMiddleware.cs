using System.Net;
using System.Text.Json;
using StockTracker.Core.Exceptions;
using StockTracker.Core.Models;

namespace StockTracker.API.Middleware;

/// <summary>
/// Global exception handler middleware that catches all unhandled exceptions
/// and returns consistent error responses
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var requestId = context.TraceIdentifier;
        var path = context.Request.Path;
        var method = context.Request.Method;

        // Log the exception with context
        _logger.LogError(
            exception,
            "Unhandled exception occurred. RequestId: {RequestId}, Method: {Method}, Path: {Path}",
            requestId,
            method,
            path
        );

        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = exception switch
        {
            ValidationException validationEx => new
            {
                success = false,
                error = validationEx.Message,
                errorCode = validationEx.ErrorCode,
                details = validationEx.ValidationErrors,
                timestamp = DateTime.UtcNow,
                requestId
            },
            NotFoundException notFoundEx => new
            {
                success = false,
                error = notFoundEx.Message,
                errorCode = notFoundEx.ErrorCode,
                details = (object?)null,
                timestamp = DateTime.UtcNow,
                requestId
            },
            UnauthorizedException unauthorizedEx => new
            {
                success = false,
                error = unauthorizedEx.Message,
                errorCode = unauthorizedEx.ErrorCode,
                details = (object?)null,
                timestamp = DateTime.UtcNow,
                requestId
            },
            ForbiddenException forbiddenEx => new
            {
                success = false,
                error = forbiddenEx.Message,
                errorCode = forbiddenEx.ErrorCode,
                details = (object?)null,
                timestamp = DateTime.UtcNow,
                requestId
            },
            ConflictException conflictEx => new
            {
                success = false,
                error = conflictEx.Message,
                errorCode = conflictEx.ErrorCode,
                details = (object?)null,
                timestamp = DateTime.UtcNow,
                requestId
            },
            RateLimitException rateLimitEx => new
            {
                success = false,
                error = rateLimitEx.Message,
                errorCode = rateLimitEx.ErrorCode,
                details = (object?)null,
                timestamp = DateTime.UtcNow,
                requestId,
                retryAfter = rateLimitEx.RetryAfterSeconds
            },
            BaseException baseEx => new
            {
                success = false,
                error = baseEx.Message,
                errorCode = baseEx.ErrorCode,
                details = (object?)null,
                timestamp = DateTime.UtcNow,
                requestId
            },
            _ => new
            {
                success = false,
                error = _environment.IsDevelopment() 
                    ? exception.Message 
                    : "An internal server error occurred",
                errorCode = "INTERNAL_SERVER_ERROR",
                details = _environment.IsDevelopment() 
                    ? (object?)new { stackTrace = exception.StackTrace }
                    : null,
                timestamp = DateTime.UtcNow,
                requestId
            }
        };

        // Set status code
        response.StatusCode = exception switch
        {
            BaseException baseEx => baseEx.StatusCode,
            _ => (int)HttpStatusCode.InternalServerError
        };

        // Add Retry-After header for rate limit exceptions
        if (exception is RateLimitException rateLimitEx)
        {
            response.Headers.Add("Retry-After", rateLimitEx.RetryAfterSeconds.ToString());
        }

        // Serialize and write response
        var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(json);
    }
}
