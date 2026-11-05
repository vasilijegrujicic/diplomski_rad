"""
InBerlinWohnen scraper — Playwright + wire:snapshot JSON parsing
Podaci su u Livewire wire:snapshot atributima, ne u regularnom HTML-u.
"""

import asyncio
import random
import logging
import json
import html
import re

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup

from core.base_scraper import BaseScraper
from core.parsing import detect_wbs, parse_area, parse_price, parse_rooms

log = logging.getLogger(__name__)

BASE_URL = "https://www.inberlinwohnen.de"


class InBerlinWohnenScraper(BaseScraper):
    source = "InBerlinWohnen"

    def __init__(self, db_path, interval_minutes, search_url, email, password, browser_lock=None):
        super().__init__(db_path, interval_minutes, browser_lock=browser_lock)
        self.search_url = search_url
        self.email = email
        self.password = password

    async def fetch_ads(self) -> list[dict]:
        ads = []

        # Deljen lock sa WG-Gesucht — na ovoj VM dve Chromium instance
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
                # Login se vise ne koristi (anonimni pristup je dovoljan), i dupli
                # page.goto (login stranica pa search stranica) je pravio
                # net::ERR_ABORTED na drugoj navigaciji — verovatno je reload nakon
                # prihvatanja cookie-ja na /login stranici konfliktovao sa narednim
                # goto pozivom. Idemo direktno na search stranicu i prihvatamo
                # cookie-je samo tu, u jednoj navigaciji.
                await page.goto(self.search_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(random.uniform(1.5, 3.0))

                # Zatvori privacy modal
                try:
                    accept_btn = page.locator("button:has-text('Alle akzeptieren'), button:has-text('Speichern')")
                    if await accept_btn.count() > 0:
                        await accept_btn.first.click()
                        await asyncio.sleep(1.0)
                except Exception:
                    pass

                await asyncio.sleep(random.uniform(2.0, 3.0))

                # Sačekaj da se Livewire ucita
                try:
                    await page.wait_for_selector("div[id^='apartment-']", timeout=15000)
                except PlaywrightTimeout:
                    log.warning("[InBerlinWohnen] Timeout cekanja na oglase")

                # 3. Parsiraj wire:snapshot JSON iz HTML-a
                content = await page.content()
                soup = BeautifulSoup(content, "html.parser")

                # Svaki oglas je div sa id="apartment-XXXXX" i wire:snapshot atributom
                for div in soup.select("div[id^='apartment-']"):
                    try:
                        snapshot_raw = div.get("wire:snapshot", "")
                        if not snapshot_raw:
                            continue

                        # Decode HTML entities i parsiraj JSON
                        snapshot_str = html.unescape(snapshot_raw)
                        snapshot = json.loads(snapshot_str)

                        item = snapshot.get("data", {}).get("item", [{}])[0]
                        if not item:
                            continue

                        ad_id = str(item.get("id", ""))
                        if not ad_id:
                            continue

                        title = item.get("title", "").strip() or "Wohnung Berlin"
                        deeplink = item.get("deeplink", "")
                        rooms = item.get("rooms", "")
                        area = item.get("area", "")
                        rent_net = item.get("rentNet", "") or item.get("rent_net", "")
                        extra_costs = item.get("extraCosts", "") or item.get("extra_costs", "")
                        occupation_date = item.get("occupationDate", "") or item.get("ready_for_occupancy", "")
                        created_at = item.get("createdAt", "") or item.get("created_at", "")

                        # Adresa
                        address = item.get("address", [{}])
                        if isinstance(address, list):
                            address = address[0] if address else {}
                        street = address.get("street", "") or address.get("street_name", "")
                        number = address.get("number", "") or address.get("street_number", "")
                        zip_code = address.get("zipCode", "") or address.get("zip_code", "")
                        district = address.get("district", "")
                        location = f"{street} {number}, {zip_code} {district}".strip()

                        # Cena
                        price = f"{rent_net} €"
                        if extra_costs:
                            price += f" + {extra_costs} € NK"

                        # Opis
                        desc_parts = []
                        if rooms:
                            desc_parts.append(f"{rooms} Zimmer")
                        if area:
                            desc_parts.append(f"{area} m²")
                        if occupation_date:
                            desc_parts.append(f"ab {occupation_date}")
                        if created_at:
                            desc_parts.append(f"Eingestellt: {created_at[:10]}")

                        url = deeplink if deeplink else f"{BASE_URL}/wohnungsfinder"

                        fields = {
                            "rent": parse_price(rent_net),
                            "size": parse_area(area),
                            "rooms": parse_rooms(rooms),
                            "has_wbs": detect_wbs(f"{title} {' '.join(desc_parts)}"),
                        }

                        ads.append({
                            "id": f"ibw_{ad_id}",
                            "title": title,
                            "url": url,
                            "price": price,
                            "location": location,
                            "description": " · ".join(desc_parts),
                            **fields,
                        })

                    except Exception as e:
                        log.warning("[InBerlinWohnen] Greška pri parsiranju: %s", e)

            except Exception as e:
                log.error("[InBerlinWohnen] Greška: %s", e)
            finally:
                await browser.close()

        log.info("[InBerlinWohnen] Pronadjeno %d oglasa", len(ads))
        return ads
