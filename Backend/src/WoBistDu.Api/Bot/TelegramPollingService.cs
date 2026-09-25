using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace WoBistDu.Api.Bot
{
    public class TelegramPollingService : BackgroundService
    {
        public const string HttpClientName = "telegram-poll";
        private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(5);

        private readonly IHttpClientFactory _httpFactory;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<TelegramPollingService> _logger;

        public TelegramPollingService(
            IHttpClientFactory httpFactory,
            IServiceScopeFactory scopeFactory,
            IConfiguration config,
            ILogger<TelegramPollingService> logger)
        {
            _httpFactory = httpFactory;
            _scopeFactory = scopeFactory;
            _config = config;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var botToken = _config["Telegram:BotToken"];
            if (string.IsNullOrWhiteSpace(botToken) || botToken == "CHANGE_ME")
            {
                _logger.LogWarning("Telegram:BotToken is not configured; Telegram polling is disabled.");
                return;
            }

            var client = _httpFactory.CreateClient(HttpClientName);
            var baseUrl = $"https://api.telegram.org/bot{botToken}";

            // Polling is refused while a webhook is set.
            try
            {
                using var reset = await client.PostAsync($"{baseUrl}/deleteWebhook", null, stoppingToken);
                reset.EnsureSuccessStatusCode();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Could not delete the Telegram webhook before polling.");
            }

            _logger.LogInformation("Telegram polling started.");
            long offset = 0;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var url = $"{baseUrl}/getUpdates?offset={offset}&timeout=30&allowed_updates=%5B%22message%22%5D";
                    using var response = await client.GetAsync(url, stoppingToken);
                    response.EnsureSuccessStatusCode();
                    var json = await response.Content.ReadAsStringAsync(stoppingToken);

                    foreach (var update in TelegramUpdateParser.Parse(json))
                    {
                        offset = update.UpdateId + 1;
                        await DispatchAsync(update);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Telegram polling failed; retrying in {Seconds}s.", RetryDelay.TotalSeconds);
                    try
                    {
                        await Task.Delay(RetryDelay, stoppingToken);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }
            }
        }

        private async Task DispatchAsync(IncomingUpdate update)
        {
            if (update.ChatId == null) return;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var handler = scope.ServiceProvider.GetRequiredService<TelegramUpdateHandler>();
                await handler.HandleAsync(update.ChatId.Value, update.Text);
            }
            catch (Exception ex)
            {
                // The offset already moved past this update, so one bad update cannot stall the loop.
                _logger.LogError(ex, "Failed to handle Telegram update {UpdateId}.", update.UpdateId);
            }
        }
    }
}
