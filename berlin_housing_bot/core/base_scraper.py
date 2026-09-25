"""
Osnovna klasa za sve scrapers-e.
Svaki scraper nasljeđuje BaseScraper i implementira fetch_ads().
"""

import asyncio
import logging
import os
import random

from core.backend_client import BackendClient, Outcome
from core.db import count_ads, init_db, is_seen, save_ad
from core.parsing import parse_price

log = logging.getLogger(__name__)

MAX_TITLE = 500  # ograničenja kolona u backendu
MAX_KIEZ = 100


class BaseScraper:
    source: str = "Unknown"

    def __init__(self, db_path: str, interval_minutes: int, backend: BackendClient | None = None):
        self.db_path = db_path
        self.interval = interval_minutes * 60
        self.backend = backend or BackendClient.from_config()
        self.send_delay = (1.0, 2.0)
        init_db(db_path, self.source)

    async def fetch_ads(self) -> list[dict]:
        """Override u svakom scrapers-u."""
        raise NotImplementedError

    def normalize_ad(self, ad: dict) -> dict:
        """
        Konvertuje scraper-specifičan format u format koji API očekuje.
        Numerička polja (rent, size, rooms, has_wbs) daje scraper; cena se
        samo u nuždi čita iz prikaznog teksta.
        """
        rent = ad["rent"] if "rent" in ad else parse_price(ad.get("price"))
        return {
            "externalUrl": ad.get("url", ""),
            "title": (ad.get("title") or "Unknown Title")[:MAX_TITLE],
            "kiez": (ad.get("location") or "Unknown Area")[:MAX_KIEZ],
            "rentPrice": rent,
            "size": ad.get("size", 0),
            "rooms": ad.get("rooms", 0),
            "hasWbs": bool(ad.get("has_wbs", False)),
            "sourceSite": self.source,
        }

    async def _pause(self):
        await asyncio.sleep(random.uniform(*self.send_delay))

    async def _send_new_ads(self, new_ads: list[dict]) -> int:
        """Šalje oglase backendu; upisuje ih kao viđene tek posle konačnog odgovora."""
        sent = 0
        async with self.backend.session() as client:
            for ad in new_ads:
                outcome = await self.backend.post_ad(client, self.normalize_ad(ad))

                if outcome in (Outcome.SENT, Outcome.REJECTED):
                    save_ad(ad, self.source, self.db_path)

                if outcome is Outcome.SENT:
                    sent += 1
                    log.info("[%s] Oglas %s poslat", self.source, ad["id"])
                elif outcome in (Outcome.UNREACHABLE, Outcome.UNAUTHORIZED):
                    break

                # Pauza posle svakog ishoda koji ne prekida ciklus (i RETRY/REJECTED)
                await self._pause()
        return sent

    async def check_once(self):
        """Jedna iteracija provere."""
        dry_run = os.getenv("DRY_RUN", "false").lower() == "true"

        if dry_run:
            log.info("[%s] *** DRY RUN MODE ***", self.source)

        log.info("[%s] Proveravam nove oglase...", self.source)

        try:
            ads = await self.fetch_ads()
        except Exception as e:
            log.error("[%s] Greška u fetch_ads: %s", self.source, e)
            return

        # Prvo pokretanje: postojeći oglasi se samo zabeleže, korisnici ne dobijaju stare stanove.
        if ads and count_ads(self.source, self.db_path) == 0:
            for ad in ads:
                save_ad(ad, self.source, self.db_path)
            log.info("[%s] Prvo pokretanje — zabeleženo %d postojećih oglasa, ništa nije poslato",
                     self.source, len(ads))
            return

        new_ads = [ad for ad in ads if not is_seen(ad["id"], self.source, self.db_path)]

        if dry_run:
            for ad in new_ads:
                save_ad(ad, self.source, self.db_path)
                log.info("  [DRY RUN] %s — %s", ad["id"], ad["title"])
            log.info("[%s] Završeno — %d novih oglasa (DRY RUN)", self.source, len(new_ads))
            return

        sent = await self._send_new_ads(new_ads)
        log.info("[%s] Završeno — poslato %d od %d novih oglasa", self.source, sent, len(new_ads))

    async def run(self):
        """Beskonačni loop sa intervalnim proverama."""
        log.info("[%s] Scraper pokrenut — interval: %ds", self.source, self.interval)
        while True:
            try:
                await self.check_once()
            except Exception as e:
                log.error("[%s] Neočekivana greška: %s", self.source, e)
            await asyncio.sleep(self.interval)
