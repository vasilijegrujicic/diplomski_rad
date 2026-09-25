"""
WG-Gesucht scraper — Playwright + BeautifulSoup
"""

import asyncio
import random
import re
import logging

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from core.base_scraper import BaseScraper
from core.parsing import listing_fields

log = logging.getLogger(__name__)

BASE_URL = "https://www.wg-gesucht.de"


class WGGScraper(BaseScraper):
    source = "WG-Gesucht"

    def __init__(self, db_path, interval_minutes, search_url):
        super().__init__(db_path, interval_minutes)
        self.search_url = search_url

    async def fetch_ads(self) -> list[dict]:
        ads = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox",
                      "--disable-blink-features=AutomationControlled"],
            )
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1366, "height": 768},
                locale="de-DE",
            )
            await context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
            )

            page = await context.new_page()

            try:
                await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(random.uniform(1.5, 3.0))

                # Prihvati cookies
                try:
                    btn = page.locator("button#cmpwelcomebtnyes, button.cmp-accept-btn")
                    if await btn.count() > 0:
                        await btn.first.click()
                        await asyncio.sleep(1)
                except Exception:
                    pass

                await page.goto(self.search_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(random.uniform(2.0, 3.5))

                try:
                    await page.wait_for_selector(
                        "div.offer_list_item, div[id^='liste-anzeigen-treffer']",
                        timeout=15000
                    )
                except PlaywrightTimeout:
                    log.warning("[WG-Gesucht] Timeout čekanja na oglase")

                soup = BeautifulSoup(await page.content(), "html.parser")

                ad_items = (
                    soup.select("div.offer_list_item") or
                    soup.select("div[id^='liste-anzeigen-treffer']") or
                    soup.select("article.wgg-card")
                )

                for item in ad_items:
                    try:
                        ad_id = item.get("data-id", "")

                        link_el = (
                            item.select_one("a[href*='wohnungen-und-wg-zimmer']") or
                            item.select_one("h3 a") or
                            item.select_one("a.detailansicht")
                        )
                        if not link_el:
                            continue

                        href = link_el.get("href", "")
                        if not ad_id:
                            match = re.search(r'/(\d+)\.html', href)
                            if match:
                                ad_id = match.group(1)

                        if not ad_id:
                            continue

                        url = f"{BASE_URL}{href}" if href.startswith("/") else href

                        title_el = item.select_one("h3.truncate_title") or item.select_one("h3")
                        title = title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True)

                        price_el = item.select_one("div.col-xs-3 b") or item.select_one("b.middle")
                        price = price_el.get_text(strip=True) if price_el else "N/A"
                        if price and "€" not in price and price != "N/A":
                            price = f"{price} €"

                        size_el = item.select_one("div.col-xs-3:nth-child(2) b")
                        size = size_el.get_text(strip=True) if size_el else ""

                        location_el = item.select_one("div.col-xs-11 span")
                        location = "Berlin"
                        if location_el:
                            # Tekst je oblika "4-Zimmer-Wohnung | Berlin Friedrichshain | Straße 5"
                            # (naslov ponude + adresa, razdvojeni doslovnim "|"). Broj soba je već
                            # uhvaćen preko parse_rooms() iz celog teksta kartice, pa se ovde
                            # zadržava samo deo posle prvog "|" (stvarna adresa).
                            parts = [re.sub(r"\s+", " ", p).strip() for p in location_el.get_text(strip=True).split("|")]
                            parts = [p for p in parts if p]
                            location = ", ".join(parts[1:]) if len(parts) > 1 else (parts[0] if parts else "Berlin")

                        available_el = item.select_one("div.col-xs-5 span")
                        available = available_el.get_text(strip=True) if available_el else ""

                        card_text = item.get_text(" ", strip=True)
                        fields = listing_fields(price, card_text, title)

                        ads.append({
                            "id": f"wgg_{ad_id}",
                            "title": title,
                            "url": url,
                            "price": f"{price} · {size}" if size else price,
                            "location": location,
                            "description": f"Dostupno od: {available}" if available else "",
                            **fields,
                        })

                    except Exception as e:
                        log.warning("[WG-Gesucht] Greška pri parsiranju: %s", e)

            except Exception as e:
                log.error("[WG-Gesucht] Greška pri učitavanju stranice: %s", e)
            finally:
                await browser.close()

        log.info("[WG-Gesucht] Pronađeno %d oglasa", len(ads))
        return ads
