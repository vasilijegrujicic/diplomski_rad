using System;
using System.Security.Cryptography;

namespace WoBistDu.Api.Services
{
    public static class RegistrationToken
    {
        /// <summary>32 random bytes, URL-safe base64 without padding (valid Telegram start parameter).</summary>
        public static string Generate()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }
    }
}
