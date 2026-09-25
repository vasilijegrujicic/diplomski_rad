using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;

namespace WoBistDu.Infrastructure.Persistence.Repositories
{
    public class PendingRegistrationRepository : IPendingRegistrationRepository
    {
        private readonly AppDbContext _context;

        public PendingRegistrationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(PendingRegistration pending)
        {
            await _context.PendingRegistrations.AddAsync(pending);
            await _context.SaveChangesAsync();
        }

        public async Task<PendingRegistration?> GetByTokenAsync(string token) =>
            await _context.PendingRegistrations.FirstOrDefaultAsync(p => p.RegistrationToken == token);

        public async Task<PendingRegistration?> GetByEmailAsync(string email) =>
            await _context.PendingRegistrations.FirstOrDefaultAsync(p => p.Email == email);

        public async Task UpdateAsync(PendingRegistration pending)
        {
            _context.PendingRegistrations.Update(pending);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var pending = await _context.PendingRegistrations.FindAsync(id);
            if (pending != null)
            {
                _context.PendingRegistrations.Remove(pending);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> TryClaimJwtAsync(Guid id) =>
            await _context.PendingRegistrations
                .Where(p => p.Id == id && !p.JwtClaimed)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.JwtClaimed, true)) == 1;
    }
}
