using System.Collections.Generic;
using System.Text.Json;

namespace WoBistDu.Api.Bot
{
    public record IncomingUpdate(long UpdateId, long? ChatId, string? Text);

    public static class TelegramUpdateParser
    {
        /// <summary>
        /// Parses a getUpdates response. ChatId is set only for messages from private chats;
        /// every update is returned so the caller can advance its offset past it.
        /// </summary>
        public static IReadOnlyList<IncomingUpdate> Parse(string json)
        {
            using var doc = JsonDocument.Parse(json);
            var updates = new List<IncomingUpdate>();

            if (!doc.RootElement.TryGetProperty("result", out var result) || result.ValueKind != JsonValueKind.Array)
            {
                return updates;
            }

            foreach (var item in result.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object
                    || !item.TryGetProperty("update_id", out var idElement)
                    || idElement.ValueKind != JsonValueKind.Number
                    || !idElement.TryGetInt64(out var updateId))
                {
                    continue;
                }


                long? chatId = null;
                string? text = null;

                if (item.TryGetProperty("message", out var message))
                {
                    if (message.TryGetProperty("chat", out var chat)
                        && chat.TryGetProperty("type", out var type) && type.GetString() == "private"
                        && chat.TryGetProperty("id", out var id))
                    {
                        chatId = id.GetInt64();
                    }

                    if (message.TryGetProperty("text", out var t) && t.ValueKind == JsonValueKind.String)
                    {
                        text = t.GetString();
                    }
                }

                updates.Add(new IncomingUpdate(updateId, chatId, text));
            }

            return updates;
        }
    }
}
