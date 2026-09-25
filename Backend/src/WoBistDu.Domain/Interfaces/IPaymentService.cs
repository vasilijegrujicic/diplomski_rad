using System.Threading.Tasks;

namespace WoBistDu.Domain.Interfaces
{
    public interface IPaymentService
    {
        Task ProcessWebhookAsync(string json, string signature);
    }
}
