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

    def __init__(self, db_path, interval_minutes, search_url, browser_lock=None):
        super().__init__(db_path, interval_minutes, browser_lock=browser_lock)
        self.search_url = search_url

    async def fetch_ads(self) -> list[dict]:
        ads = []

        # Deljen lock sa InBerlinWohnen — na ovoj VM dve Chromium instance
        # istovremeno pregažuju CPU/RAM i navigacija puca sa timeout-om.
        async with self.browser_lock, async_playwright() as p:
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
                # Jedna navigacija, direktno na pretragu: prihvatanje cookie-ja pa
                # drugi page.goto (kao ranije preko BASE_URL) je pucao sa timeout-om,
                # isti obrazac kao kod InBerlinWohnen.
                await page.goto(self.search_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(random.uniform(1.5, 3.0))

                # Prihvati cookies (dugme je sada <a class="cmpboxbtnyes">)
                try:
                    btn = page.locator("a.cmpboxbtnyes, button#cmpwelcomebtnyes, button.cmp-accept-btn")
                    if await btn.count() > 0:
                        await btn.first.click()
                        await asyncio.sleep(1)
                except Exception:
                    pass

                await asyncio.sleep(random.uniform(1.0, 2.0))

                try:
                    await page.wait_for_selector("a.offer_list_item", timeout=15000)
                except PlaywrightTimeout:
                    log.warning("[WG-Gesucht] Timeout čekanja na oglase")

                soup = BeautifulSoup(await page.content(), "html.parser")

                # Sajt je redizajniran — kartica oglasa je sad <a class="wgg-list-card
                # offer_list_item"> direktno (href i data-id na njoj), ne <div> sa
                # ugnježdenim linkom kao ranije.
                ad_items = soup.select("a.offer_list_item")

                for item in ad_items:
                    try:
                        href = item.get("href", "")
                        if not href:
                            continue

                        ad_id = item.get("data-id", "")
                        if not ad_id:
                            match = re.search(r'\.(\d+)\.html', href)
                            if match:
                                ad_id = match.group(1)
                        if not ad_id:
                            continue

                        url = f"{BASE_URL}{href}" if href.startswith("/") else href

                        title_el = item.select_one("h2.truncate_title span")
                        title = (
                            title_el.get_text(strip=True) if title_el
                            else (item.get("aria-label", "").strip() or "Wohnung Berlin")
                        )

                        price_el = item.select_one(".price-row .card-main-text")
                        price = price_el.get_text(strip=True) if price_el else "N/A"
                        if price and "€" not in price and price != "N/A":
                            price = f"{price} €"

                        size_el = item.select_one(".size-value")
                        size = size_el.get_text(strip=True) if size_el else ""

                        details_el = item.select_one(".card-details-text")
                        location = "Berlin"
                        if details_el:
                            # Tekst je oblika "2-Zimmer-Wohnung · Berlin Friedrichshain · Straße 5"
                            # (naslov ponude + adresa). "title" atribut ima čist tekst bez whitespace-a
                            # iz ugnježdenih elemenata; delimo na "|" ili "·" jer je sajt menjao
                            # separator, pa ne želimo da se ponovo pokvari ako se opet promeni.
                            full_text = details_el.get("title") or details_el.get_text(" ", strip=True)
                            parts = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"[|·•]", full_text)]
                            parts = [p for p in parts if p]
                            location = ", ".join(parts[1:]) if len(parts) > 1 else (parts[0] if parts else "Berlin")

                        card_text = item.get_text(" ", strip=True)
                        fields = listing_fields(price, card_text, title)

                        ads.append({
                            "id": f"wgg_{ad_id}",
                            "title": title,
                            "url": url,
                            "price": f"{price} · {size}" if size else price,
                            "location": location,
                            "description": "",
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
