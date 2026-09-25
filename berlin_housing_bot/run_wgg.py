"""
Pokreće samo WG-Gesucht scraper.
"""

import asyncio
import logging

from config import DB_PATH, CHECK_INTERVAL_MINUTES, WGG_SEARCH_URL
from scrapers.wgg import WGGScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("wgg.log"), logging.StreamHandler()],
)


async def main():
    scraper = WGGScraper(
        db_path=DB_PATH,
        interval_minutes=CHECK_INTERVAL_MINUTES,
        search_url=WGG_SEARCH_URL,
    )
    await scraper.run()


if __name__ == "__main__":
    asyncio.run(main())
