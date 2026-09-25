using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.DTOs.Listings;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;

namespace WoBistDu.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/client")]
    public class ClientController : ControllerBase
    {
        private const int MaxMatches = 100;

        private readonly IUserRepository _userRepository;
        private readonly AppDbContext _context;

        public ClientController(IUserRepository userRepository, AppDbContext context)
        {
            _userRepository = userRepository;
            _context = context;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) throw new UnauthorizedAccessException("User ID not found in token");
            return Guid.Parse(userIdClaim.Value);
        }

        [HttpGet("matches")]
        public async Task<IActionResult> GetMatches()
        {
            var userId = GetUserId();

            var matches = await _context.UserMatches
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.NotifiedAt)
                .Take(MaxMatches)
                .Select(m => new MatchResponse(
                    m.Id,
                    m.Listing.Title,
                    m.Listing.Kiez,
                    m.Listing.RentPrice,
                    m.Listing.Size,
                    m.Listing.Rooms,
                    m.Listing.HasWbs,
                    m.Listing.ExternalUrl,
                    m.Listing.SourceSite,
                    m.NotifiedAt))
                .ToListAsync();

            return Ok(matches);
        }

        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = GetUserId();
            await _userRepository.DeleteAsync(userId);
            return Ok("Account deleted successfully");
        }
    }
}
