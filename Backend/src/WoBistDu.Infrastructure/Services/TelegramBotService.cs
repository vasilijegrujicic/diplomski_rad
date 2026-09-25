using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using WoBistDu.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WoBistDu.Infrastructure.Services
{
    public class TelegramBotService : ITelegramService
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly HttpClient _httpClient;
        private readonly string _botToken;
        private readonly ILogger<TelegramBotService> _logger;

        public TelegramBotService(HttpClient httpClient, IConfiguration config, ILogger<TelegramBotService> logger)
        {
            _httpClient = httpClient;
            _botToken = config["Telegram:BotToken"] ?? throw new ArgumentNullException("Telegram Bot Token not configured");
            _logger = logger;
        }

        public async Task SendAlertAsync(string chatId, string message, string? parseMode = null)
        {
            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var payload = new { chat_id = chatId, text = message, parse_mode = parseMode };
            var content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                response.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send Telegram alert to chat {ChatId}", chatId);
                throw;
            }
        }
    }
}
