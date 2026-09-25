using System;
using WoBistDu.Domain.Common;

namespace WoBistDu.Domain.Entities
{
    public class Listing : BaseEntity
    {
        public string ExternalUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Kiez { get; set; } = string.Empty;
        public decimal RentPrice { get; set; }
        public double Size { get; set; }
        public int Rooms { get; set; }
        public bool HasWbs { get; set; }
        public string SourceSite { get; set; } = string.Empty;
        public DateTime ScrapedAt { get; set; } = DateTime.UtcNow;
    }
}
