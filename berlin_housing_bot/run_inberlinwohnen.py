"""
Pokreće samo InBerlinWohnen scraper.
"""

import asyncio
import logging

from config import (
    DB_PATH, CHECK_INTERVAL_MINUTES, IBW_SEARCH_URL, IBW_EMAIL, IBW_PASSWORD
)
from scrapers.inberlinwohnen import InBerlinWohnenScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("inberlinwohnen.log"), logging.StreamHandler()],
)


async def main():
    scraper = InBerlinWohnenScraper(
        db_path=DB_PATH,
        interval_minutes=CHECK_INTERVAL_MINUTES,
        search_url=IBW_SEARCH_URL,
        email=IBW_EMAIL,
        password=IBW_PASSWORD,
    )
    await scraper.run()


if __name__ == "__main__":
    asyncio.run(main())
