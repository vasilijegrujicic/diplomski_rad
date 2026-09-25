using System.Threading.Tasks;
using WoBistDu.Domain.DTOs.Auth;

namespace WoBistDu.Domain.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse?> LoginAsync(LoginRequest request);
        Task<string?> RegisterPendingAsync(RegisterRequest request);
        Task<CheckStatusResponse> CheckRegistrationStatusAsync(string token);
    }
}
