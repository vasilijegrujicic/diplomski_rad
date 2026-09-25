# Flat Finder

Prati oglase za stanove u Berlinu na tri sajta i šalje trenutna obaveštenja preko Telegrama, sa podesivim filterima (kraj grada, budžet, kvadratura, broj soba, WBS).

## Struktura

- **`Backend/src`** — .NET Web API (registracija, autentifikacija, filteri, poklapanje oglasa, Telegram bot preko long-polling-a).
- **`Frontend`** — Next.js aplikacija (registracija, login, korisnički i admin dashboard).
- **`berlin_housing_bot`** — Python scraperi za tri sajta (Kleinanzeigen, WG-Gesucht, InBerlinWohnen) koji šalju oglase backendu.

## Tehnologije

.NET 10 (ASP.NET Core, EF Core, PostgreSQL) · Next.js / TypeScript / Tailwind · Python (Playwright, curl_cffi, BeautifulSoup) · Telegram Bot API
