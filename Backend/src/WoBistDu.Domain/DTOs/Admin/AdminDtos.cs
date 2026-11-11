using System;
using WoBistDu.Domain.Entities;

namespace WoBistDu.Domain.DTOs.Admin
{
    /// <summary>What the admin panel sees of a user. Never carries the password hash.</summary>
    public record AdminUserResponse(Guid Id, string Email, string? TelegramChatId, string Role)
    {
        public static AdminUserResponse From(User user) =>
            new AdminUserResponse(user.Id, user.Email, user.TelegramChatId, user.Role.ToString());
    }

    /// <summary>The only fields an admin may change; password and role are not editable here.</summary>
    public record AdminUserUpdateRequest(string Email, string? TelegramChatId);
}
