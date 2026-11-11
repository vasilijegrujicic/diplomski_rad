import asyncio
import json

import httpx
import pytest

from core.backend_client import BackendClient
from core.base_scraper import BaseScraper
from core.db import count_ads, is_seen, save_ad

SOURCE = "Kleinanzeigen"


def make_ad(n, **overrides):
    ad = {
        "id": f"ad{n}",
        "title": f"Flat {n}",
        "url": f"https://example.de/{n}",
        "price": "900 €",
        "location": "10249 Berlin - Friedrichshain",
        "description": "",
        "rent": 900.0,
        "size": 50.0,
        "rooms": 2,
        "has_wbs": False,
    }
    ad.update(overrides)
    return ad


class FakeScraper(BaseScraper):
    source = SOURCE

    def __init__(self, db_path, backend, ads):
        super().__init__(db_path, 1, backend)
        self.ads = ads
        self.send_delay = (0, 0)

    async def fetch_ads(self):
        return self.ads


def backend_with(handler):
    return BackendClient("http://backend/", "secret", transport=httpx.MockTransport(handler))


def recording_backend(status=200):
    requests = []

    def handler(request):
        requests.append(request)
        return httpx.Response(status)

    return backend_with(handler), requests


def run_cycle(scraper):
    asyncio.run(scraper.check_once())


def scraper_with_seeded_table(db_path, backend, ads):
    """Scraper whose table already has one row, so the auto-seed does not kick in."""
    scraper = FakeScraper(db_path, backend, ads)
    save_ad(make_ad(0), SOURCE, db_path)
    return scraper


@pytest.fixture(autouse=True)
def no_dry_run(monkeypatch):
    monkeypatch.delenv("DRY_RUN", raising=False)


@pytest.fixture
def db_path(tmp_path):
    return str(tmp_path / "ads.db")


def test_first_run_records_ads_without_sending(db_path):
    backend, requests = recording_backend()
    scraper = FakeScraper(db_path, backend, [make_ad(1), make_ad(2)])

    run_cycle(scraper)

    assert requests == []
    assert count_ads(SOURCE, db_path) == 2


def test_after_seeding_only_new_ads_are_sent(db_path):
    backend, requests = recording_backend()
    scraper = FakeScraper(db_path, backend, [make_ad(1)])
    run_cycle(scraper)  # seed

    scraper.ads = [make_ad(1), make_ad(2)]
    run_cycle(scraper)

    assert len(requests) == 1
    assert is_seen("ad2", SOURCE, db_path)


def test_sent_payload_matches_the_backend_contract(db_path):
    backend, requests = recording_backend()
    ad = make_ad(1, title="T" * 600, location="L" * 150)
    scraper = scraper_with_seeded_table(db_path, backend, [ad])

    run_cycle(scraper)

    request = requests[0]
    assert str(request.url) == "http://backend/api/internal/listings/ingest"
    assert request.headers["X-Internal-Api-Key"] == "secret"
    assert json.loads(request.content) == {
        "externalUrl": "https://example.de/1",
        "title": "T" * 500,
        "kiez": "L" * 100,
        "rentPrice": 900.0,
        "size": 50.0,
        "rooms": 2,
        "hasWbs": False,
        "sourceSite": SOURCE,
    }


def test_rent_falls_back_to_the_price_text_when_the_scraper_gave_no_number(db_path):
    backend, requests = recording_backend()
    ad = make_ad(1, price="1.200 € VB")
    del ad["rent"]
    scraper = scraper_with_seeded_table(db_path, backend, [ad])

    run_cycle(scraper)

    assert json.loads(requests[0].content)["rentPrice"] == 1200.0


@pytest.mark.parametrize("status, saved, request_count", [
    (200, True, 2),   # delivered
    (400, True, 2),   # permanent bad data: do not retry forever
    (422, True, 2),   # permanent bad data
    (500, False, 2),  # server error: retry next cycle, keep going
    (307, False, 2),  # redirect (http -> https): misconfiguration, retry
    (404, False, 2),  # wrong path / old backend: retry
    (405, False, 2),
    (408, False, 2),
    (429, False, 2),
    (401, False, 1),  # wrong API key: stop the cycle
])
def test_backend_answer_decides_what_is_saved(db_path, status, saved, request_count):
    backend, requests = recording_backend(status)
    scraper = scraper_with_seeded_table(db_path, backend, [make_ad(1), make_ad(2)])

    run_cycle(scraper)

    assert is_seen("ad1", SOURCE, db_path) is saved
    assert len(requests) == request_count


def test_connection_error_stops_the_cycle_and_saves_nothing(db_path):
    calls = []

    def handler(request):
        calls.append(request)
        raise httpx.ConnectError("boom", request=request)

    scraper = scraper_with_seeded_table(db_path, backend_with(handler), [make_ad(1), make_ad(2)])

    run_cycle(scraper)

    assert len(calls) == 1
    assert not is_seen("ad1", SOURCE, db_path)
    assert not is_seen("ad2", SOURCE, db_path)


def test_unsent_ads_are_retried_in_the_next_cycle(db_path):
    def handler(request):
        raise httpx.ConnectError("boom", request=request)

    scraper = scraper_with_seeded_table(db_path, backend_with(handler), [make_ad(1)])
    run_cycle(scraper)
    assert not is_seen("ad1", SOURCE, db_path)

    scraper.backend, requests = recording_backend()
    run_cycle(scraper)

    assert len(requests) == 1
    assert is_seen("ad1", SOURCE, db_path)


def test_dry_run_saves_without_sending(db_path, monkeypatch):
    monkeypatch.setenv("DRY_RUN", "true")
    backend, requests = recording_backend()
    scraper = scraper_with_seeded_table(db_path, backend, [make_ad(1)])

    run_cycle(scraper)

    assert requests == []
    assert is_seen("ad1", SOURCE, db_path)


def test_missing_api_key_is_a_clear_startup_error(monkeypatch):
    import config

    monkeypatch.setattr(config, "INTERNAL_API_KEY", "")

    with pytest.raises(RuntimeError, match="INTERNAL_API_KEY"):
        BackendClient.from_config()


def test_api_key_is_stripped_when_config_is_loaded(monkeypatch):
    import importlib

    import config

    monkeypatch.setenv("INTERNAL_API_KEY", "  abc\n")
    try:
        importlib.reload(config)
        assert config.INTERNAL_API_KEY == "abc"
    finally:
        monkeypatch.undo()
        importlib.reload(config)


def test_from_config_builds_the_ingest_url(monkeypatch):
    import config

    monkeypatch.setattr(config, "INTERNAL_API_KEY", "k")
    monkeypatch.setattr(config, "BACKEND_URL", "http://host:5000")
    monkeypatch.setattr(config, "BACKEND_VERIFY_TLS", False)

    client = BackendClient.from_config()

    assert client.ingest_url == "http://host:5000/api/internal/listings/ingest"
    assert client.verify_tls is False


class HangingScraper(FakeScraper):
    async def fetch_ads(self):
        await asyncio.Event().wait()


def test_hung_fetch_is_abandoned_and_frees_the_browser_lock(db_path):
    backend, requests = recording_backend()
    scraper = HangingScraper(db_path, backend, [])
    scraper.fetch_timeout = 0.05

    async def cycle():
        await scraper.check_once()
        return scraper.browser_lock.locked()

    assert asyncio.run(cycle()) is False
    assert requests == []
    assert count_ads(SOURCE, db_path) == 0


def test_scraper_sharing_the_lock_runs_after_a_hung_one(db_path, tmp_path):
    backend, _ = recording_backend()
    hung = HangingScraper(db_path, backend, [])
    hung.fetch_timeout = 0.05
    healthy = FakeScraper(str(tmp_path / "other.db"), backend, [make_ad(1)])

    async def both():
        lock = asyncio.Lock()
        hung.browser_lock = lock
        healthy.browser_lock = lock
        await asyncio.wait_for(asyncio.gather(hung.check_once(), healthy.check_once()), timeout=2)

    asyncio.run(both())

    assert count_ads(SOURCE, str(tmp_path / "other.db")) == 1
