using System.Text;

namespace WoBistDu.Infrastructure.Services
{
    public static class TelegramMarkdown
    {
        private const string Special = "_*[]()~`>#+-=|{}.!\\";

        /// <summary>Escapes text for Telegram MarkdownV2.</summary>
        public static string Escape(string? text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            var sb = new StringBuilder(text.Length + 8);
            foreach (var c in text)
            {
                if (Special.IndexOf(c) >= 0) sb.Append('\\');
                sb.Append(c);
            }
            return sb.ToString();
        }

        /// <summary>Inside the (...) part of a MarkdownV2 link only ')' and '\' must be escaped.</summary>
        public static string EscapeUrl(string? url) =>
            (url ?? string.Empty).Replace("\\", "\\\\").Replace(")", "\\)");
    }
}
