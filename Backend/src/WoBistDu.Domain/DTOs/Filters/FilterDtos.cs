using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace WoBistDu.Domain.DTOs.Filters
{
    // Validation runs entirely in Validate() below, never via attributes on the record's
    // properties or constructor parameters. ASP.NET Core's model validation for record primary
    // constructors requires validator metadata on the constructor parameter; the
    // System.ComponentModel.DataAnnotations.Validator used directly in unit tests reads it from
    // the property instead. Putting an attribute on both (or either) throws
    // InvalidOperationException at request time, because ASP.NET Core rejects any validation
    // attribute it finds on the property of a record with a matching constructor parameter.
    // IValidatableObject.Validate() is attribute-free, so both paths call it identically.
    public record FilterRequest(decimal MaxRent, double MinSize, int MinRooms, bool WbsRequired, List<string> Kiezes) : IValidatableObject
    {
        public const int MaxKiezes = 20;
        public const int MaxKiezLength = 100;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (MaxRent < 1 || MaxRent > 100000)
            {
                yield return new ValidationResult("MaxRent must be between 1 and 100000.", new[] { nameof(MaxRent) });
            }

            if (MinSize < 0 || MinSize > 10000)
            {
                yield return new ValidationResult("MinSize must be between 0 and 10000.", new[] { nameof(MinSize) });
            }

            if (MinRooms < 0 || MinRooms > 100)
            {
                yield return new ValidationResult("MinRooms must be between 0 and 100.", new[] { nameof(MinRooms) });
            }

            // Kiezes is declared non-nullable, but JSON model binding can still hand us null
            // (e.g. an explicit "kiezes": null, or a client that omits the field).
            if (Kiezes is null)
            {
                yield return new ValidationResult("Kiezes is required.", new[] { nameof(Kiezes) });
                yield break;
            }

            if (Kiezes.Count > MaxKiezes)
            {
                yield return new ValidationResult($"At most {MaxKiezes} kiezes are allowed.", new[] { nameof(Kiezes) });
            }

            if (Kiezes.Any(k => k == null || k.Length > MaxKiezLength))
            {
                yield return new ValidationResult($"Each kiez must be at most {MaxKiezLength} characters.", new[] { nameof(Kiezes) });
            }
        }
    }

    public record FilterResponse(Guid Id, decimal MaxRent, double MinSize, int MinRooms, bool WbsRequired, List<string> Kiezes);
}
