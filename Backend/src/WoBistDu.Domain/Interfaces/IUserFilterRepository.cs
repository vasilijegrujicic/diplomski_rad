using System.Threading.Tasks;
using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.Interfaces
{
    public interface IUserFilterRepository
    {
        Task CreateAsync(UserFilter filter);
    }
}
