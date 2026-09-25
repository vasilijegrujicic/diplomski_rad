# 🏠 Berlin Housing Bot

Prati nove stanove na 3 sajta i šalje ih backendu (registracija i Telegram obaveštenja su u .NET backendu).

## Struktura

```
berlin_housing_bot/
├── core/
│   ├── base_scraper.py   ← osnovna klasa
│   └── db.py             ← SQLite logika
├── scrapers/
│   ├── kleinanzeigen.py  ← curl_cffi
│   ├── wgg.py            ← Playwright
│   └── inberlinwohnen.py ← curl_cffi + login
├── run_kleinanzeigen.py  ← pokreće samo KL
├── run_wgg.py            ← pokreće samo WGG
├── run_inberlinwohnen.py ← pokreće samo IBW
├── run_all.py            ← pokreće sva 3 paralelno
├── config.py
├── requirements.txt
└── .env
```

## Instalacija

```bash
pip install -r requirements.txt
playwright install chromium
playwright install-deps chromium   # samo na Linux serveru
```

## Konfiguracija

```bash
cp .env.example .env
# Popuni .env sa tokenima i kredencijalima
```

## Pokretanje

```bash
# Sva 3 scrapers-a paralelno
python run_all.py

# Ili pojedinačno
python run_kleinanzeigen.py
python run_wgg.py
python run_inberlinwohnen.py
```

## Prvo pokretanje

Ako je tabela sajta prazna (prvo pokretanje ili nova baza), scraper u prvom ciklusu
samo zabeleži postojeće oglase i ništa ne šalje backendu — korisnici ne dobijaju stare stanove.
`DRY_RUN=true` i dalje postoji za ručno testiranje (upisuje oglase bez slanja).

## Backend

U `.env` postavi `INTERNAL_API_KEY` (isti kao `InternalApiKey` u backendu) i, za lokalni
dev sertifikat, `BACKEND_VERIFY_TLS=false`. Oglas se upisuje kao viđen tek kad backend odgovori;
ako je backend nedostupan, isti oglas se šalje u sledećem ciklusu.

## Testovi

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m pytest -q
```

## Logovi

Svaki scraper piše u svoj log fajl:
- `kleinanzeigen.log`
- `wgg.log`
- `inberlinwohnen.log`
- `all_bots.log` (kada koristiš run_all.py)

## Systemd servis (server)

```ini
[Unit]
Description=Berlin Housing Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/berlin_housing_bot
ExecStart=/usr/bin/python3 run_all.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```
