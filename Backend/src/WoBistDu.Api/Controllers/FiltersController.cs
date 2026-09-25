using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.DTOs.Filters;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;

namespace WoBistDu.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/filters")]
    public class FiltersController : ControllerBase
    {
        private readonly IUserFilterRepository _filterRepository;
        private readonly AppDbContext _context;

        public FiltersController(IUserFilterRepository filterRepository, AppDbContext context)
        {
            _filterRepository = filterRepository;
            _context = context;
        }

        private Guid CurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private static FilterResponse ToResponse(UserFilter f) =>
            new FilterResponse(f.Id, f.MaxRent, f.MinSize, f.MinRooms, f.WbsRequired, f.Kiezes);

        [HttpGet]
        public async Task<IActionResult> GetMyFilters()
        {
            var userId = CurrentUserId();
            var filters = await _context.UserFilters
                .Where(f => f.UserId == userId)
                .Select(f => new FilterResponse(f.Id, f.MaxRent, f.MinSize, f.MinRooms, f.WbsRequired, f.Kiezes))
                .ToListAsync();
            return Ok(filters);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFilter([FromBody] FilterRequest request)
        {
            var filter = new UserFilter
            {
                UserId = CurrentUserId(),
                MaxRent = request.MaxRent,
                MinSize = request.MinSize,
                MinRooms = request.MinRooms,
                WbsRequired = request.WbsRequired,
                Kiezes = request.Kiezes.ToList()
            };

            await _filterRepository.CreateAsync(filter);
            return Ok(ToResponse(filter));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateFilter(Guid id, [FromBody] FilterRequest request)
        {
            var userId = CurrentUserId();
            var filter = await _context.UserFilters.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
            if (filter == null) return NotFound();

            filter.MaxRent = request.MaxRent;
            filter.MinSize = request.MinSize;
            filter.MinRooms = request.MinRooms;
            filter.WbsRequired = request.WbsRequired;
            filter.Kiezes = request.Kiezes.ToList();
            _context.Entry(filter).Property(f => f.Kiezes).IsModified = true;

            await _context.SaveChangesAsync();
            return Ok(ToResponse(filter));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteFilter(Guid id)
        {
            var userId = CurrentUserId();
            var filter = await _context.UserFilters.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
            if (filter == null) return NotFound();

            _context.UserFilters.Remove(filter);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
