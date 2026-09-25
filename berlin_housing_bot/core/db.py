"""
Zajednička baza logika za sve scrapers-e.
Svaki scraper koristi svoju tabelu — nema kolizije ID-eva između sajtova.
"""

import sqlite3
import logging
from datetime import datetime

log = logging.getLogger(__name__)

# Mapiranje source → naziv tabele
TABLE_MAP = {
    "Kleinanzeigen":   "kleinanzeigen_ads",
    "WG-Gesucht":      "wgg_ads",
    "InBerlinWohnen":  "inberlinwohnen_ads",
}


def _table(source: str) -> str:
    """Vrati naziv tabele za dati izvor."""
    table = TABLE_MAP.get(source)
    if not table:
        raise ValueError(f"Nepoznat source: '{source}'. Dodaj ga u TABLE_MAP u db.py")
    return table


def init_db(db_path: str, source: str):
    """Kreira tabelu za dati source ako ne postoji."""
    table = _table(source)
    conn = sqlite3.connect(db_path)
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {table} (
            ad_id       TEXT PRIMARY KEY,
            title       TEXT,
            price       TEXT,
            location    TEXT,
            url         TEXT,
            first_seen  TEXT,
            status      TEXT DEFAULT 'new'
        )
    """)
    conn.commit()
    conn.close()
    log.info("Tabela '%s' inicijalizovana u: %s", table, db_path)


def is_seen(ad_id: str, source: str, db_path: str) -> bool:
    table = _table(source)
    conn = sqlite3.connect(db_path)
    row = conn.execute(f"SELECT 1 FROM {table} WHERE ad_id = ?", (ad_id,)).fetchone()
    conn.close()
    return row is not None


def save_ad(ad: dict, source: str, db_path: str):
    table = _table(source)
    conn = sqlite3.connect(db_path)
    conn.execute(
        f"""INSERT OR IGNORE INTO {table}
           (ad_id, title, price, location, url, first_seen)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            ad["id"],
            ad["title"],
            ad["price"],
            ad["location"],
            ad["url"],
            datetime.now().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def mark_status(ad_id: str, status: str, source: str, db_path: str):
    table = _table(source)
    conn = sqlite3.connect(db_path)
    conn.execute(f"UPDATE {table} SET status = ? WHERE ad_id = ?", (status, ad_id))
    conn.commit()
    conn.close()


def count_ads(source: str, db_path: str) -> int:
    table = _table(source)
    conn = sqlite3.connect(db_path)
    count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    conn.close()
    return count
