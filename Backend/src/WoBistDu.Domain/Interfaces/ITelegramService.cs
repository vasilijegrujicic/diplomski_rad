using System.Threading.Tasks;

namespace WoBistDu.Domain.Interfaces
{
    public interface ITelegramService
    {
        Task SendAlertAsync(string chatId, string message, string? parseMode = null);
    }
}
