using System;
using System.Threading.Tasks;
using WoBistDu.Domain.DTOs.Auth;
using WoBistDu.Domain.Entities;
using WoBistDu.Domain.Interfaces;

namespace WoBistDu.Api.Services
{
    public class AuthService : IAuthService
    {
        private static readonly TimeSpan PendingLifetime = TimeSpan.FromHours(24);
        private static readonly TimeSpan JwtClaimWindow = TimeSpan.FromMinutes(10);

        private readonly IUserRepository _userRepository;
        private readonly IPendingRegistrationRepository _pendingRepo;
        private readonly IJwtTokenGenerator _jwtGenerator;

        public AuthService(IUserRepository userRepository, IPendingRegistrationRepository pendingRepo, IJwtTokenGenerator jwtGenerator)
        {
            _userRepository = userRepository;
            _pendingRepo = pendingRepo;
            _jwtGenerator = jwtGenerator;
        }

        public async Task<AuthResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            if (PasswordHasher.NeedsRehash(user.PasswordHash))
            {
                user.PasswordHash = PasswordHasher.Hash(request.Password);
                await _userRepository.UpdateAsync(user);
            }

            return IssueToken(user);
        }

        public async Task<string?> RegisterPendingAsync(RegisterRequest request)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null) return null;

            var token = RegistrationToken.Generate();
            var pending = await _pendingRepo.GetByEmailAsync(request.Email);

            if (pending != null)
            {
                pending.PasswordHash = PasswordHasher.Hash(request.Password);
                pending.Kiezes = request.Kiezes ?? new List<string>();
                pending.MaxRent = request.MaxRent;
                pending.MinSize = request.MinSize;
                pending.MinRooms = request.MinRooms;
                pending.WbsRequired = request.WbsRequired;
                pending.RegistrationToken = token;
                pending.ExpiryDate = DateTime.UtcNow.Add(PendingLifetime);
                pending.IsFinalized = false;
                pending.FinalizedAt = null;
                pending.JwtClaimed = false;
                await _pendingRepo.UpdateAsync(pending);
                return token;
            }

            await _pendingRepo.CreateAsync(new PendingRegistration
            {
                Email = request.Email,
                PasswordHash = PasswordHasher.Hash(request.Password),
                Kiezes = request.Kiezes ?? new List<string>(),
                MaxRent = request.MaxRent,
                MinSize = request.MinSize,
                MinRooms = request.MinRooms,
                WbsRequired = request.WbsRequired,
                RegistrationToken = token,
                ExpiryDate = DateTime.UtcNow.Add(PendingLifetime)
            });
            return token;
        }

        public async Task<CheckStatusResponse> CheckRegistrationStatusAsync(string token)
        {
            var pending = await _pendingRepo.GetByTokenAsync(token);
            if (pending == null || !pending.IsFinalized)
            {
                return new CheckStatusResponse(false, null, null);
            }

            var withinWindow = pending.FinalizedAt != null && DateTime.UtcNow - pending.FinalizedAt.Value <= JwtClaimWindow;
            if (!withinWindow || pending.JwtClaimed)
            {
                // Nothing will ever need this row again: either the one-time JWT was already
                // handed out on an earlier call, or the window to claim it has closed. Deleting
                // it here (never on the call that performs the claim itself) keeps the table from
                // accumulating finished registrations while still letting a duplicate in-flight
                // poll see the same "finalized, already claimed" answer.
                await _pendingRepo.DeleteAsync(pending.Id);
                return new CheckStatusResponse(true, null, null);
            }

            var user = await _userRepository.GetByEmailAsync(pending.Email);
            if (user == null || !await _pendingRepo.TryClaimJwtAsync(pending.Id))
            {
                await _pendingRepo.DeleteAsync(pending.Id);
                return new CheckStatusResponse(true, null, null);
            }

            var auth = IssueToken(user);
            return new CheckStatusResponse(true, auth.Token, auth.Expiry);
        }

        private AuthResponse IssueToken(User user) =>
            new AuthResponse(_jwtGenerator.GenerateToken(user), DateTime.UtcNow.AddDays(7));
    }
}
