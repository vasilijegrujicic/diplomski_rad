using System;
using System.Collections.Generic;
using WoBistDu.Domain.Common;

namespace WoBistDu.Domain.Entities
{
    public class PendingRegistration : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public List<string> Kiezes { get; set; } = new List<string>();
        public decimal MaxRent { get; set; }
        public double MinSize { get; set; }
        public int MinRooms { get; set; }
        public bool WbsRequired { get; set; }
        public string RegistrationToken { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public bool IsFinalized { get; set; } = false;
        public DateTime? FinalizedAt { get; set; }
        public bool JwtClaimed { get; set; } = false;
    }
}
