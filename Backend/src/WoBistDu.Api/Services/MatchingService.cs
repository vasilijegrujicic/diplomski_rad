using System;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;
using WoBistDu.Infrastructure.Services;

namespace WoBistDu.Api.Services
{
    public class MatchingService : IMatchingService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITelegramService _telegramService;
        private readonly AppDbContext _context;
        private readonly ILogger<MatchingService> _logger;

        public MatchingService(
            IUserRepository userRepository,
            ITelegramService telegramService,
            AppDbContext context,
            ILogger<MatchingService> logger)
        {
            _userRepository = userRepository;
            _telegramService = telegramService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Alerts every user with a matching filter at most once per listing. The match is stored before
        /// the alert is sent, so the dashboard shows it even if Telegram fails. The listing must already be saved.
        /// </summary>
        public async Task ProcessListingAsync(Listing listing)
        {
            var filters = await _context.UserFilters.ToListAsync();

            var userIds = filters
                .Where(filter => IsMatch(listing, filter))
                .Select(filter => filter.UserId)
                .Distinct()
                .ToList();

            foreach (var userId in userIds)
            {
                if (await _context.UserMatches.AnyAsync(m => m.UserId == userId && m.ListingId == listing.Id))
                {
                    continue;
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null) continue;

                _context.UserMatches.Add(new UserMatch { UserId = userId, ListingId = listing.Id });
                await _context.SaveChangesAsync();

                if (string.IsNullOrEmpty(user.TelegramChatId)) continue;

                try
                {
                    await _telegramService.SendAlertAsync(user.TelegramChatId, BuildMessage(listing), "MarkdownV2");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send the alert for listing {ListingId} to user {UserId}", listing.Id, userId);
                }
            }
        }

        /// <summary>
        /// Size or rooms of 0 mean "unknown" (the scraper could not read them) and never exclude a listing.
        /// </summary>
        public static bool IsMatch(Listing listing, UserFilter filter) =>
            listing.RentPrice <= filter.MaxRent &&
            (listing.Size <= 0 || listing.Size >= filter.MinSize) &&
            (listing.Rooms <= 0 || listing.Rooms >= filter.MinRooms) &&
            KiezMatcher.Matches(listing.Kiez, filter.Kiezes) &&
            (!filter.WbsRequired || listing.HasWbs);

        public static string BuildMessage(Listing listing)
        {
            var rent = listing.RentPrice.ToString("0.##", CultureInfo.InvariantCulture);
            var size = listing.Size.ToString("0.##", CultureInfo.InvariantCulture);

            return "🏠 *New Match Found\\!*\n\n" +
                   $"📌 *{TelegramMarkdown.Escape(listing.Title)}*\n" +
                   $"💶 {TelegramMarkdown.Escape(rent)}€\n" +
                   $"📍 {TelegramMarkdown.Escape(listing.Kiez)}\n" +
                   $"📐 {TelegramMarkdown.Escape(size)}m² \\| {listing.Rooms} rooms\n" +
                   $"🔗 [View Ad]({TelegramMarkdown.EscapeUrl(listing.ExternalUrl)})";
        }
    }
}
