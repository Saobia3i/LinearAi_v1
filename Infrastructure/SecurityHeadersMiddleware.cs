namespace Linear_v1.Infrastructure;

/// <summary>
/// Adds security-hardening HTTP response headers to every response.
/// These are recognized best practices (OWASP, Mozilla Observatory) for SaaS APIs.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Prevent MIME sniffing
        headers["X-Content-Type-Options"] = "nosniff";

        // Block clickjacking
        headers["X-Frame-Options"] = "DENY";

        // Disable legacy XSS filter (modern browsers use CSP instead)
        headers["X-XSS-Protection"] = "0";

        // Force HTTPS for 1 year (including subdomains)
        if (context.Request.IsHttps)
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

        // Referrer policy — don't leak full URL to third parties
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Permissions policy — lock down sensitive browser APIs
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";

        // Content-Security-Policy for API responses (strict — no inline scripts needed for JSON APIs)
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            headers["Content-Security-Policy"] = "default-src 'none'";
            // Remove Server header to avoid version disclosure
            headers.Remove("Server");
        }

        await next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        => app.UseMiddleware<SecurityHeadersMiddleware>();
}
