using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WoBistDu.Domain.DTOs.Analytics;
using WoBistDu.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WoBistDu.Api.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("kiez-stats")]
        public async Task<IActionResult> GetKiezStats()
        {
            var stats = await _context.Listings
                .GroupBy(l => l.Kiez)
                .Select(g => new KiezStatsDto(
                    g.Key,
                    g.Count(),
                    g.Average(l => l.RentPrice / (decimal)l.Size)
                ))
                .ToListAsync();

            return Ok(stats);
        }
    }
}
