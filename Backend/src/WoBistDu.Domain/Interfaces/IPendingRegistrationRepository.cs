using System;
using System.Threading.Tasks;
using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.Interfaces
{
    public interface IPendingRegistrationRepository
    {
        Task CreateAsync(PendingRegistration pending);
        Task<PendingRegistration?> GetByTokenAsync(string token);
        Task<PendingRegistration?> GetByEmailAsync(string email);
        Task UpdateAsync(PendingRegistration pending);
        Task DeleteAsync(Guid id);

        /// <summary>Atomically marks the JWT as handed out. True only for the first caller.</summary>
        Task<bool> TryClaimJwtAsync(Guid id);
    }
}
