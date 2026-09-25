using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoBistDu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RegistrationVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramChatId",
                table: "PendingRegistrations");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "PendingRegistrations",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "FinalizedAt",
                table: "PendingRegistrations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "JwtClaimed",
                table: "PendingRegistrations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Kiez",
                table: "PendingRegistrations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "MaxRent",
                table: "PendingRegistrations",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_PendingRegistrations_Email",
                table: "PendingRegistrations",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PendingRegistrations_RegistrationToken",
                table: "PendingRegistrations",
                column: "RegistrationToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PendingRegistrations_Email",
                table: "PendingRegistrations");

            migrationBuilder.DropIndex(
                name: "IX_PendingRegistrations_RegistrationToken",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "FinalizedAt",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "JwtClaimed",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "Kiez",
                table: "PendingRegistrations");

            migrationBuilder.DropColumn(
                name: "MaxRent",
                table: "PendingRegistrations");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "PendingRegistrations",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "TelegramChatId",
                table: "PendingRegistrations",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
