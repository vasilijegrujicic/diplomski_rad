using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoBistDu.Domain.DTOs.Listings;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;

namespace WoBistDu.Api.Controllers
{
    [ApiController]
    [Route("api/internal/listings")]
    public class InternalListingsController : ControllerBase
    {
        private readonly IListingRepository _listingRepository;
        private readonly IMatchingService _matchingService;

        public InternalListingsController(IListingRepository listingRepository, IMatchingService matchingService)
        {
            _listingRepository = listingRepository;
            _matchingService = matchingService;
        }

        [HttpPost("ingest")]
        public async Task<IActionResult> Ingest([FromBody] ListingIngestionRequest request)
        {
            if (await _listingRepository.ExistsByExternalUrlAsync(request.ExternalUrl))
            {
                var existingListing = await _listingRepository.GetByExternalUrlAsync(request.ExternalUrl);
                if (existingListing != null)
                {
                    // Re-run matching in case an earlier attempt died partway through its user loop;
                    // ProcessListingAsync skips users who already have a UserMatch, so this is safe to repeat.
                    await _matchingService.ProcessListingAsync(existingListing);
                }

                return Ok("Listing already exists. Skipping.");
            }

            var listing = new Listing
            {
                ExternalUrl = request.ExternalUrl,
                Title = request.Title,
                Kiez = request.Kiez,
                RentPrice = request.RentPrice,
                Size = request.Size,
                Rooms = request.Rooms,
                HasWbs = request.HasWbs,
                SourceSite = request.SourceSite,
                ScrapedAt = DateTime.UtcNow
            };

            await _listingRepository.AddAsync(listing);
            
            // Trigger matching and notifications
            await _matchingService.ProcessListingAsync(listing);

            return Ok("Listing ingested and processed successfully.");
        }
    }
}
