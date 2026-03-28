using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Linear_v1.Infrastructure;

/// <summary>
/// Named rate-limit policies applied via [EnableRateLimiting] on controllers/actions.
/// All use a fixed-window algorithm keyed by IP address (or user ID for authenticated routes).
/// </summary>
public static class RateLimitPolicies
{
    /// <summary>Login/register — per-IP to deter credential stuffing. Brute-force handled by Identity lockout.</summary>
    public const string Auth = "auth";

    /// <summary>General API calls for authenticated users.</summary>
    public const string Api = "api";

    /// <summary>Write operations (POST/PUT/PATCH/DELETE) for regular users.</summary>
    public const string Write = "write";

    /// <summary>Admin operations — more generous but still bounded.</summary>
    public const string Admin = "admin";

    /// <summary>Public, unauthenticated read endpoints (e.g. product listing, public feedback).</summary>
    public const string Public = "public";

    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // ---------- auth: 20 req / 5 min per IP ----------
            // Loose enough for normal users (forgotten password retries, tab reloads),
            // tight enough to slow credential-stuffing scripts.
            // Hard brute-force is covered by Identity's 5-attempt / 15-min account lockout.
            options.AddPolicy(Auth, context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter($"auth:{ip}", _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(5),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // ---------- api (authenticated reads): 120 req / 1 min per user ----------
            options.AddPolicy(Api, context =>
            {
                var key = context.User.Identity?.IsAuthenticated == true
                    ? $"user:{context.User.Identity.Name}"
                    : $"ip:{context.Connection.RemoteIpAddress}";

                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // ---------- write: 30 mutations / 1 min per user ----------
            options.AddPolicy(Write, context =>
            {
                var key = context.User.Identity?.IsAuthenticated == true
                    ? $"user:{context.User.Identity.Name}"
                    : $"ip:{context.Connection.RemoteIpAddress}";

                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // ---------- admin: 300 req / 1 min per user ----------
            options.AddPolicy(Admin, context =>
            {
                var key = $"admin:{context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString()}";
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 300,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // ---------- public reads: 60 req / 1 min per IP ----------
            options.AddFixedWindowLimiter(Public, o =>
            {
                o.PermitLimit = 60;
                o.Window = TimeSpan.FromMinutes(1);
                o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                o.QueueLimit = 0;
            });

            // Emit Retry-After and X-RateLimit-* headers on 429
            options.OnRejected = async (ctx, _) =>
            {
                var retrySeconds = "60";
                if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    retrySeconds = ((int)retryAfter.TotalSeconds).ToString();
                    ctx.HttpContext.Response.Headers.RetryAfter = retrySeconds;
                }

                ctx.HttpContext.Response.Headers["X-RateLimit-Remaining"] = "0";
                ctx.HttpContext.Response.Headers["X-RateLimit-Retry-After"] = retrySeconds;
                ctx.HttpContext.Response.ContentType = "application/json";
                await ctx.HttpContext.Response.WriteAsync(
                    $$$"""{"success":false,"message":"Too many requests. Please try again after {{{retrySeconds}}} seconds."}""");
            };
        });

        return services;
    }
}
