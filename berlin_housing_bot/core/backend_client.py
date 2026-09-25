"""
Slanje oglasa na .NET backend (POST /api/internal/listings/ingest).
Za svaki oglas vraća Outcome koji govori scraperu šta da radi dalje.
"""

import enum
import logging

import httpx

log = logging.getLogger(__name__)


class Outcome(enum.Enum):
    SENT = "sent"                  # 200 — isporučeno
    RETRY = "retry"                # 5xx, 3xx, 404/405/408/429 — pokušaj ponovo u sledećem ciklusu
    UNREACHABLE = "unreachable"    # veza/timeout — prekini ciklus
    UNAUTHORIZED = "unauthorized"  # 401 — pogrešan ključ, prekini ciklus
    REJECTED = "rejected"          # ostali 4xx — trajno loš oglas


class BackendClient:
    def __init__(self, base_url: str, api_key: str, verify_tls: bool = True, transport=None):
        self.ingest_url = f"{base_url.rstrip('/')}/api/internal/listings/ingest"
        self.api_key = api_key
        self.verify_tls = verify_tls
        self.transport = transport

    @classmethod
    def from_config(cls) -> "BackendClient":
        import config

        if not config.INTERNAL_API_KEY:
            raise RuntimeError(
                "INTERNAL_API_KEY nije podešen u .env — mora biti isti kao InternalApiKey u backendu."
            )
        return cls(config.BACKEND_URL, config.INTERNAL_API_KEY, config.BACKEND_VERIFY_TLS)

    def session(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(verify=self.verify_tls, timeout=15.0, transport=self.transport)

    async def post_ad(self, client: httpx.AsyncClient, payload: dict) -> Outcome:
        try:
            response = await client.post(
                self.ingest_url,
                json=payload,
                headers={"X-Internal-Api-Key": self.api_key},
            )
        except httpx.TransportError as e:
            log.error("Backend nedostupan (%s): %s", self.ingest_url, e)
            return Outcome.UNREACHABLE

        if response.status_code == 200:
            return Outcome.SENT
        if response.status_code == 401:
            log.error("Backend odbio API ključ (401) — proveri INTERNAL_API_KEY")
            return Outcome.UNAUTHORIZED
        if response.status_code >= 500:
            log.error("Backend greška %s za %s", response.status_code, payload.get("externalUrl"))
            return Outcome.RETRY
        if 300 <= response.status_code < 400 or response.status_code in (404, 405, 408, 429):
            # Pogrešna konfiguracija (redirect, putanja) ili privremeno stanje — ne gubi oglas
            log.error("Backend vratio %s za %s — oglas se šalje ponovo u sledećem ciklusu",
                      response.status_code, self.ingest_url)
            return Outcome.RETRY

        log.error("Backend odbio oglas %s (%s): %s",
                  payload.get("externalUrl"), response.status_code, response.text[:200])
        return Outcome.REJECTED
