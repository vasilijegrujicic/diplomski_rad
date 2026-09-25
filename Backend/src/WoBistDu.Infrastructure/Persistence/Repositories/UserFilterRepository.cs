using System.Threading.Tasks;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;

namespace WoBistDu.Infrastructure.Persistence.Repositories
{
    public class UserFilterRepository : IUserFilterRepository
    {
        private readonly AppDbContext _context;

        public UserFilterRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(UserFilter filter)
        {
            await _context.UserFilters.AddAsync(filter);
            await _context.SaveChangesAsync();
        }
    }
}
