"""
Pokreće sve 3 scrapers-a paralelno u jednom procesu.
Svaki scraper je izolovan — greška u jednom ne utiče na ostale.
Scraperi samo šalju oglase na backend; registracija i Telegram su u backendu.
"""

import sys
import asyncio
import logging

# UTF-8 fix za Windows konzolu
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from config import (
    DB_PATH, CHECK_INTERVAL_MINUTES,
    KL_SEARCH_URL, WGG_SEARCH_URL, IBW_SEARCH_URL, IBW_EMAIL, IBW_PASSWORD,
)
from scrapers.kleinanzeigen import KleinanzeigenScraper
from scrapers.wgg import WGGScraper
from scrapers.inberlinwohnen import InBerlinWohnenScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("all_bots.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


async def run_scraper_safe(scraper):
    try:
        await scraper.run()
    except Exception as e:
        log.error("[%s] Fatalna greska — scraper se gasi: %s", scraper.source, e)


async def main():
    scrapers = [
        KleinanzeigenScraper(
            db_path=DB_PATH,
            interval_minutes=CHECK_INTERVAL_MINUTES,
            search_url=KL_SEARCH_URL,
        ),
        WGGScraper(
            db_path=DB_PATH,
            interval_minutes=CHECK_INTERVAL_MINUTES,
            search_url=WGG_SEARCH_URL,
        ),
        InBerlinWohnenScraper(
            db_path=DB_PATH,
            interval_minutes=CHECK_INTERVAL_MINUTES,
            search_url=IBW_SEARCH_URL,
            email=IBW_EMAIL,
            password=IBW_PASSWORD,
        ),
    ]

    log.info("Scraperi pokrenuti — interval: %d min", CHECK_INTERVAL_MINUTES)
    await asyncio.gather(*[run_scraper_safe(s) for s in scrapers])


if __name__ == "__main__":
    asyncio.run(main())
