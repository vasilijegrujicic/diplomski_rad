using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.DTOs.Auth;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;
using WoBistDu.Infrastructure.Persistence;

namespace WoBistDu.Api.Services
{
    public class FinalizeRegistrationService : IFinalizeRegistrationService
    {
        private readonly AppDbContext _context;

        public FinalizeRegistrationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FinalizeResult> FinalizeAsync(string token, string chatId)
        {
            var pending = await _context.PendingRegistrations.FirstOrDefaultAsync(p => p.RegistrationToken == token);
            if (pending == null) return FinalizeResult.UnknownToken;
            if (pending.IsFinalized) return FinalizeResult.AlreadyUsed;
            if (pending.ExpiryDate < DateTime.UtcNow) return FinalizeResult.Expired;

            if (await _context.Users.AnyAsync(u => u.TelegramChatId == chatId)) return FinalizeResult.ChatAlreadyLinked;
            if (await _context.Users.AnyAsync(u => u.Email == pending.Email)) return FinalizeResult.EmailTaken;

            var user = new User
            {
                Email = pending.Email,
                PasswordHash = pending.PasswordHash,
                TelegramChatId = chatId,
                Role = UserRole.Client
            };
            // The registration form collects the same fields as the dashboard's filter form
            // (budget, min size, min rooms, WBS, kiezes), so the first filter is built directly
            // from the pending registration — no "all" sentinel to translate, an empty Kiezes
            // list already means "All Berlin" end to end.
            user.Filters.Add(new UserFilter
            {
                MaxRent = pending.MaxRent,
                MinSize = pending.MinSize,
                MinRooms = pending.MinRooms,
                WbsRequired = pending.WbsRequired,
                Kiezes = pending.Kiezes
            });

            pending.IsFinalized = true;
            pending.FinalizedAt = DateTime.UtcNow;
            _context.Users.Add(user);

            try
            {
                // One SaveChanges: user, first filter and the pending update commit together or not at all.
                await _context.SaveChangesAsync();
                return FinalizeResult.Success;
            }
            catch (DbUpdateException)
            {
                // A concurrent request took the same chat ID or email between the checks and the insert.
                _context.ChangeTracker.Clear();
                return await _context.Users.AnyAsync(u => u.TelegramChatId == chatId)
                    ? FinalizeResult.ChatAlreadyLinked
                    : FinalizeResult.EmailTaken;
            }
        }
    }
}
