using Microsoft.EntityFrameworkCore;
using WoBistDu.Domain.Entities;
using System.Text.Json;

namespace WoBistDu.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<UserFilter> UserFilters { get; set; } = null!;
        public DbSet<Listing> Listings { get; set; } = null!;
        public DbSet<PendingRegistration> PendingRegistrations { get; set; } = null!;
        public DbSet<UserMatch> UserMatches { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.TelegramChatId).IsUnique();
                entity.Property(e => e.PasswordHash).IsRequired();
            });

            // Listing Configuration
            modelBuilder.Entity<Listing>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Kiez).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ExternalUrl).IsRequired();
                entity.HasIndex(e => e.ExternalUrl).IsUnique();
            });

            // PendingRegistration Configuration
            modelBuilder.Entity<PendingRegistration>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.RegistrationToken).IsUnique();

                // Store the List<string> as a JSON string in the database, same as UserFilter.Kiezes
                entity.Property(e => e.Kiezes)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>()
                    );
            });

            // UserFilter Configuration
            modelBuilder.Entity<UserFilter>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(f => f.User)
                    .WithMany(u => u.Filters)
                    .HasForeignKey(f => f.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Store the List<string> as a JSON string in the database
                entity.Property(e => e.Kiezes)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>()
                    );
            });

            // UserMatch Configuration
            modelBuilder.Entity<UserMatch>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.ListingId }).IsUnique();

                entity.HasOne(m => m.User)
                    .WithMany()
                    .HasForeignKey(m => m.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Listing)
                    .WithMany()
                    .HasForeignKey(m => m.ListingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
