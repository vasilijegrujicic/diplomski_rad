using System.Threading.Tasks;
using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.Interfaces
{
    public interface IMatchingService
    {
        Task ProcessListingAsync(Listing listing);
    }
}
