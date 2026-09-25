using System;
using System.Threading.Tasks;
using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.Interfaces
{
    public interface IListingRepository
    {
        Task<bool> ExistsByExternalUrlAsync(string url);
        Task AddAsync(Listing listing);
        Task<Listing?> GetByExternalUrlAsync(string url);
    }
}
