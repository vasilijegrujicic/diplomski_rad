using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;

namespace WoBistDu.Infrastructure.Persistence.Repositories
{
    public class ListingRepository : IListingRepository
    {
        private readonly AppDbContext _context;

        public ListingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsByExternalUrlAsync(string url) =>
            await _context.Listings.AnyAsync(l => l.ExternalUrl == url);

        public async Task AddAsync(Listing listing)
        {
            await _context.Listings.AddAsync(listing);
            await _context.SaveChangesAsync();
        }

        public async Task<Listing?> GetByExternalUrlAsync(string url) =>
            await _context.Listings.FirstOrDefaultAsync(l => l.ExternalUrl == url);
    }
}
