using System;
using System.Threading.Tasks;
using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(Guid id);
        Task UpdateAsync(User user);
        Task CreateAsync(User user);
        Task<IEnumerable<User>> GetAllAsync();
        Task DeleteAsync(Guid id);
    }
}
