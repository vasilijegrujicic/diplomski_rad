using System.Threading.Tasks;
using WoBistDu.Domain.DTOs.Auth;

namespace WoBistDu.Domain.Interfaces
{
    public interface IFinalizeRegistrationService
    {
        Task<FinalizeResult> FinalizeAsync(string token, string chatId);
    }
}
