using Microsoft.AspNetCore.Diagnostics;
using System.Text.Json;

namespace Linear_v1.Infrastructure;

/// <summary>
/// Catches any unhandled exception that escapes controller action filters.
/// Returns a uniform JSON error envelope so the API never leaks stack traces.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env)
    {
        _logger = logger;
        _env = env;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Only intercept /api requests — MVC views keep their own error pages
        if (!httpContext.Request.Path.StartsWithSegments("/api"))
            return false;

        _logger.LogError(exception,
            "Unhandled exception on {Method} {Path}",
            httpContext.Request.Method,
            httpContext.Request.Path);

        var (statusCode, message) = exception switch
        {
            OperationCanceledException => (StatusCodes.Status499ClientClosedRequest, "Request cancelled."),
            BadHttpRequestException bad => (bad.StatusCode, bad.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred. Please try again later.")
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        var body = new
        {
            success = false,
            message,
            // Only expose detail in development to avoid information disclosure
            detail = _env.IsDevelopment() ? exception.ToString() : null
        };

        await httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(body,
                new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull }),
            cancellationToken);

        return true;
    }
}
