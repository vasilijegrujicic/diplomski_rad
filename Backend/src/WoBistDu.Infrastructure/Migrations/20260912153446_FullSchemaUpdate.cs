using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoBistDu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FullSchemaUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Listings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalUrl = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Kiez = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RentPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Size = table.Column<double>(type: "double precision", nullable: false),
                    Rooms = table.Column<int>(type: "integer", nullable: false),
                    HasWbs = table.Column<bool>(type: "boolean", nullable: false),
                    SourceSite = table.Column<string>(type: "text", nullable: false),
                    ScrapedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Listings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    TelegramChatId = table.Column<string>(type: "text", nullable: true),
                    FreeAlertsRemaining = table.Column<int>(type: "integer", nullable: false),
                    HuntingPassExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserFilters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MaxRent = table.Column<decimal>(type: "numeric", nullable: false),
                    MinSize = table.Column<double>(type: "double precision", nullable: false),
                    MinRooms = table.Column<int>(type: "integer", nullable: false),
                    WbsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    Kiezes = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFilters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFilters_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_ExternalUrl",
                table: "Listings",
                column: "ExternalUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserFilters_UserId",
                table: "UserFilters",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Listings");

            migrationBuilder.DropTable(
                name: "UserFilters");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
