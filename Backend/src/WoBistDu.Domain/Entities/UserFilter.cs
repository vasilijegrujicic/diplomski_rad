using System;
using System.Collections.Generic;
using WoBistDu.Domain.Common;

namespace WoBistDu.Domain.Entities
{
    public class UserFilter : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public decimal MaxRent { get; set; }
        public double MinSize { get; set; }
        public int MinRooms { get; set; }
        public bool WbsRequired { get; set; }
        public List<string> Kiezes { get; set; } = new List<string>();
    }
}
