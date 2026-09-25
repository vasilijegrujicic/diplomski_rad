using System;
using WoBistDu.Domain.Common;

namespace WoBistDu.Domain.Entities
{
    /// <summary>A listing the user was alerted about. One row per user and listing.</summary>
    public class UserMatch : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid ListingId { get; set; }
        public Listing Listing { get; set; } = null!;
        public DateTime NotifiedAt { get; set; } = DateTime.UtcNow;
    }
}
