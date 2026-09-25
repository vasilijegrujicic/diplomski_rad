"""
Pokreće samo Kleinanzeigen scraper.
"""

import asyncio
import logging

from config import DB_PATH, CHECK_INTERVAL_MINUTES, KL_SEARCH_URL
from scrapers.kleinanzeigen import KleinanzeigenScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("kleinanzeigen.log"), logging.StreamHandler()],
)


async def main():
    scraper = KleinanzeigenScraper(
        db_path=DB_PATH,
        interval_minutes=CHECK_INTERVAL_MINUTES,
        search_url=KL_SEARCH_URL,
    )
    await scraper.run()


if __name__ == "__main__":
    asyncio.run(main())
