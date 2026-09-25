using System;

namespace WoBistDu.Domain.DTOs.Listings
{
    public record ListingIngestionRequest(string ExternalUrl, string Title, string Kiez, decimal RentPrice, double Size, int Rooms, bool HasWbs, string SourceSite);

    public record MatchResponse(
        Guid Id,
        string Title,
        string Kiez,
        decimal RentPrice,
        double Size,
        int Rooms,
        bool HasWbs,
        string ExternalUrl,
        string SourceSite,
        DateTime NotifiedAt);
}
