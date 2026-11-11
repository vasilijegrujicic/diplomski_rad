using System;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

namespace WoBistDu.Api.Security
{
    /// <summary>
    /// Per-client-IP limits on the anonymous auth endpoints, so passwords cannot be brute-forced
    /// and registrations cannot be spammed.
    /// </summary>
    public static class RateLimiting
    {
        public const string Login = "auth-login";
        public const string Register = "auth-register";
        public const string CheckStatus = "auth-check-status";

        public const int LoginPermits = 5;          // per minute
        public const int RegisterPermits = 5;       // per 10 minutes
        public const int CheckStatusPermits = 60;   // per minute; the register page polls every 3 s

        public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services) =>
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, token) =>
                {
                    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    {
                        context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
                    }
                    // The login and register pages show this text to the user as is.
                    await context.HttpContext.Response.WriteAsync("Too many attempts. Please wait a minute and try again.", token);
                };

                options.AddPolicy(Login, ctx => PerIp(ctx, LoginPermits, TimeSpan.FromMinutes(1)));
                options.AddPolicy(Register, ctx => PerIp(ctx, RegisterPermits, TimeSpan.FromMinutes(10)));
                options.AddPolicy(CheckStatus, ctx => PerIp(ctx, CheckStatusPermits, TimeSpan.FromMinutes(1)));
            });

        /// <summary>
        /// The backend is reachable only through Caddy on the Docker network, whose address is not
        /// loopback, so the default "trust only localhost" list would ignore X-Forwarded-For and put
        /// every visitor into one rate-limit bucket. Port 8080 is never published, so trusting the
        /// header from any sender is safe; Caddy overwrites whatever X-Forwarded-For a client sends.
        /// </summary>
        public static ForwardedHeadersOptions ForwardedHeadersBehindProxy()
        {
            var options = new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            };
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            return options;
        }

        private static RateLimitPartition<string> PerIp(HttpContext ctx, int permits, TimeSpan window) =>
            RateLimitPartition.GetFixedWindowLimiter(
                ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permits,
                    Window = window,
                    QueueLimit = 0
                });
    }
}
