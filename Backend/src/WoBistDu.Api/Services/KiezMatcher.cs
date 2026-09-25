using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;

namespace WoBistDu.Api.Services
{
    public static class KiezMatcher
    {
        private const string AllBerlin = "all";

        /// <summary>
        /// True when the listing's location text contains any of the filter's kiezes as whole words.
        /// Case, diacritics and separators are ignored ("prenzlauer-berg" matches "Prenzlauer Berg"),
        /// but "mitte" does not match "Mittenwalder Straße". An empty list or the value "all" matches everything.
        /// </summary>
        public static bool Matches(string? listingKiez, IEnumerable<string> filterKiezes)
        {
            var kiezes = filterKiezes.ToList();
            if (kiezes.Count == 0) return true;

            var listingTokens = Tokenize(listingKiez);
            foreach (var kiez in kiezes)
            {
                if (kiez.Trim().Equals(AllBerlin, StringComparison.OrdinalIgnoreCase)) return true;
                if (ContainsSequence(listingTokens, Tokenize(kiez))) return true;
            }

            return false;
        }

        private static List<string> Tokenize(string? text)
        {
            var tokens = new List<string>();
            if (string.IsNullOrEmpty(text)) return tokens;

            var decomposed = text.ToLowerInvariant().Replace("ß", "ss").Normalize(NormalizationForm.FormD);
            var current = new StringBuilder();
            foreach (var c in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;

                if (char.IsLetterOrDigit(c))
                {
                    current.Append(c);
                }
                else if (current.Length > 0)
                {
                    tokens.Add(current.ToString());
                    current.Clear();
                }
            }

            if (current.Length > 0) tokens.Add(current.ToString());
            return tokens;
        }

        private static bool ContainsSequence(List<string> haystack, List<string> needle)
        {
            if (needle.Count == 0 || needle.Count > haystack.Count) return false;

            for (var i = 0; i <= haystack.Count - needle.Count; i++)
            {
                var matched = true;
                for (var j = 0; j < needle.Count; j++)
                {
                    if (haystack[i + j] != needle[j])
                    {
                        matched = false;
                        break;
                    }
                }

                if (matched) return true;
            }

            return false;
        }
    }
}
