"""
Kleinanzeigen scraper — curl_cffi + BeautifulSoup
"""

import time
import random
import logging

from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests

from core.base_scraper import BaseScraper
from core.parsing import listing_fields

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.kleinanzeigen.de/",
}


class KleinanzeigenScraper(BaseScraper):
    source = "Kleinanzeigen"

    def __init__(self, db_path, interval_minutes, search_url):
        super().__init__(db_path, interval_minutes)
        self.search_url = search_url

    async def fetch_ads(self) -> list[dict]:
        time.sleep(random.uniform(1.5, 3.5))

        session = cffi_requests.Session()
        resp = session.get(
            self.search_url,
            headers=HEADERS,
            timeout=20,
            impersonate="chrome120",
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        ads = []

        # Kleinanzeigen je redizajniran (Tailwind klase umesto BEM "aditem--*" imena).
        # Novi obrazac ostaje primaran; stari selektori su fallback za slučaj
        # delimičnog rollout-a ili povratka na staru šablonu.
        for article in soup.select("article[data-adid]") or soup.select("article.aditem"):
            try:
                ad_id = article.get("data-adid", "")
                if not ad_id:
                    continue

                # data-href je sad direktno na <article>, ne treba više tražiti link
                href = article.get("data-href", "")
                if not href:
                    link_el = article.select_one("a.ellipsis") or article.select_one(".aditem-main--middle h2 a")
                    href = link_el.get("href", "") if link_el else ""
                url = f"https://www.kleinanzeigen.de{href}" if href.startswith("/") else href

                title_el = article.select_one("h3") or article.select_one("a.ellipsis") or article.select_one(".aditem-main--middle h2 a")
                title = title_el.get_text(strip=True) if title_el else "Bez naslova"

                price_el = (
                    article.select_one("p.text-title3.font-strong.text-secondary")
                    or article.select_one(".aditem-main--middle--price-shipping--price")
                )
                price = price_el.get_text(strip=True) if price_el else "N/A"

                location_el = article.select_one("div.text-onSurfaceNonessential") or article.select_one(".aditem-main--top--left")
                location = location_el.get_text(strip=True) if location_el else ""

                desc_el = (
                    article.select_one("p.text-bodyRegular.text-onSurfaceSubdued")
                    or article.select_one(".aditem-main--middle--description")
                )
                description = desc_el.get_text(strip=True) if desc_el else ""

                card_text = article.get_text(" ", strip=True)
                fields = listing_fields(price, card_text, f"{title} {description}")

                ads.append({
                    "id": ad_id,
                    "title": title,
                    "url": url,
                    "price": price,
                    "location": location,
                    "description": description,
                    **fields,
                })

            except Exception as e:
                log.warning("Greška pri parsiranju oglasa: %s", e)

        log.info("[Kleinanzeigen] Pronađeno %d oglasa", len(ads))
        return ads
