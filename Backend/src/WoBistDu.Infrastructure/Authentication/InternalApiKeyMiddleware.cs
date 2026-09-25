using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace WoBistDu.Infrastructure.Authentication
{
    public class InternalApiKeyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _config;

        public InternalApiKeyMiddleware(RequestDelegate next, IConfiguration config)
        {
            _next = next;
            _config = config;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Path.StartsWithSegments("/api/internal"))
            {
                if (!context.Request.Headers.TryGetValue("X-Internal-Api-Key", out var extractedApiKey))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("API Key missing");
                    return;
                }

                var configuredKey = _config["InternalApiKey"];
                if (string.IsNullOrEmpty(configuredKey) || extractedApiKey != configuredKey)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid API Key");
                    return;
                }
            }

            await _next(context);
        }
    }
}
