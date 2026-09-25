"""
Konfiguracija — učitava sve iz .env fajla
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Baza ──────────────────────────────────────────────────────────────────────
DB_PATH: str = os.getenv("DB_PATH", "ads.db")

# ── Scheduler ─────────────────────────────────────────────────────────────────
CHECK_INTERVAL_MINUTES: int = int(os.getenv("CHECK_INTERVAL_MINUTES", "10"))

# ── Backend (.NET API) ────────────────────────────────────────────────────────
BACKEND_URL: str = (os.getenv("BACKEND_URL") or "https://localhost:5001").rstrip("/")
INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "").strip()
# Za lokalni dev sertifikat postavi BACKEND_VERIFY_TLS=false
BACKEND_VERIFY_TLS: bool = os.getenv("BACKEND_VERIFY_TLS", "true").lower() != "false"

# ── Kleinanzeigen ─────────────────────────────────────────────────────────────
KL_SEARCH_URL: str = os.getenv(
    "KL_SEARCH_URL",
    "https://www.kleinanzeigen.de/s-wohnung-mieten/10249/sortierung:neuste/anzeige:angebote/preis::1200/c203l9662r4+wohnung_mieten.qm_d:40.00%2C+wohnung_mieten.swap_s:nein+wohnung_mieten.zimmer_d:2.0%2C"
)

# ── WG-Gesucht ────────────────────────────────────────────────────────────────
WGG_SEARCH_URL: str = os.getenv(
    "WGG_SEARCH_URL",
    "https://www.wg-gesucht.de/wohnungen-in-Berlin.8.2.1.0.html?user_filter_id=11968311&offer_filter=1&city_id=8&noDeact=1&radLat=52.519354843935155&radLng=13.403969091934595&sMin=45&rMax=1200&radAdd=Karl-Liebknecht-Stra%C3%9Fe+++Berlin&radDis=10000&sin=1&exc=2&categories%5B0%5D=2&rent_types%5B0%5D=2"
)

# ── InBerlinWohnen ────────────────────────────────────────────────────────────
IBW_SEARCH_URL: str = os.getenv("IBW_SEARCH_URL", "")
IBW_EMAIL: str = os.getenv("IBW_EMAIL", "")
IBW_PASSWORD: str = os.getenv("IBW_PASSWORD", "")
