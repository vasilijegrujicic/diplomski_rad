using System;
using System.Security.Cryptography;
using System.Text;

namespace WoBistDu.Api.Services
{
    public static class PasswordHasher
    {
        public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

        public static bool Verify(string password, string hash)
        {
            if (IsBcrypt(hash)) return BCrypt.Net.BCrypt.Verify(password, hash);

            // Accounts created before BCrypt were stored as unsalted SHA256 (base64).
            return LegacySha256(password) == hash;
        }

        public static bool NeedsRehash(string hash) => !IsBcrypt(hash);

        private static bool IsBcrypt(string hash) => hash.StartsWith("$2");

        private static string LegacySha256(string password) =>
            Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
    }
}
