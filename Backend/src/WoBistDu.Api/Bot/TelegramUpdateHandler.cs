using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using WoBistDu.Domain.DTOs.Auth;
using WoBistDu.Domain.Interfaces;

namespace WoBistDu.Api.Bot
{
    public class TelegramUpdateHandler
    {
        private readonly IFinalizeRegistrationService _finalizer;
        private readonly ITelegramService _telegram;
        private readonly string _frontendUrl;

        public TelegramUpdateHandler(IFinalizeRegistrationService finalizer, ITelegramService telegram, IConfiguration config)
        {
            _finalizer = finalizer;
            _telegram = telegram;
            _frontendUrl = (config["Frontend:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');
        }

        public async Task HandleAsync(long chatId, string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return;

            var parts = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            // "/start" or "/start@BotName"
            if (parts[0].Split('@')[0] != "/start") return;

            var chat = chatId.ToString();

            if (parts.Length < 2)
            {
                await _telegram.SendAlertAsync(chat,
                    $"Welcome to Flat Finder! 🏠\n\nTo use this bot, please register on our website first:\n{_frontendUrl}/register");
                return;
            }

            var result = await _finalizer.FinalizeAsync(parts[1], chat);
            await _telegram.SendAlertAsync(chat, MessageFor(result));
        }

        private string MessageFor(FinalizeResult result) => result switch
        {
            FinalizeResult.Success =>
                "✅ Registration successful!\n\nYour account is active and your first filter is set up. " +
                "You'll receive flat alerts here. Head back to the website to continue.",
            FinalizeResult.AlreadyUsed =>
                $"You're already registered. Log in on the website:\n{_frontendUrl}/login",
            FinalizeResult.EmailTaken =>
                $"❌ An account with this email already exists. Log in here:\n{_frontendUrl}/login",
            FinalizeResult.ChatAlreadyLinked =>
                "❌ This Telegram account is already linked to another Flat Finder account.",
            _ =>
                $"❌ This registration link is invalid or has expired.\nPlease register again:\n{_frontendUrl}/register"
        };
    }
}
