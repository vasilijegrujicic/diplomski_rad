using System;
using System.Collections.Generic;
using WoBistDu.Domain.Common;

namespace WoBistDu.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? TelegramChatId { get; set; }
        public UserRole Role { get; set; } = UserRole.Client;
        public int FreeAlertsRemaining { get; set; } = 10;
        public DateTime? HuntingPassExpiresAt { get; set; }

        public ICollection<UserFilter> Filters { get; set; } = new List<UserFilter>();

        public bool HasActiveSubscription => HuntingPassExpiresAt > DateTime.UtcNow;
    }
}
