using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoBistDu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RegistrationFilterParity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kiez",
                table: "PendingRegistrations");

            // Default must be valid JSON ("[]", not ""): any row already in the table when this
            // migration runs gets backfilled with this value, and the Kiezes column is read back
            // through a JSON converter (see AppDbContext) — an empty string fails to deserialize.
            migrationBuilder.AddColumn<string>(
                name: "Kiezes",
                table: "PendingRegistrations",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<int>(
                name: "MinRooms",
                table: "PendingRegistrations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "MinSize",
                table: "PendingRegistrations",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<bool>(
                name: "WbsRequired",
                table: "PendingRegistrations",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kiezes",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "MinRooms",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "MinSize",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "WbsRequired",
                table: "PendingRegistrations");

            migrationBuilder.AddColumn<string>(
                name: "Kiez",
                table: "PendingRegistrations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
