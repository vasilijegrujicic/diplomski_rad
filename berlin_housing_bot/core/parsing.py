"""
Parsiranje brojeva iz tekstova oglasa (nemački formati).
Čiste funkcije bez ulaza/izlaza — pokrivene testovima u tests/test_parsing.py.
"""

import math
import re

# 1.200 | 1.200,50 | 45,5 | 45.5 | 850
_NUMBER = r"\d+(?:\.\d{3})*(?:[.,]\d+)?"
_NUMBER_RE = re.compile(_NUMBER)
_NUMBER_ONLY_RE = re.compile(rf"\s*({_NUMBER})\s*")
_AREA_RE = re.compile(rf"({_NUMBER})\s*(?:m²|m2|qm)", re.IGNORECASE)
_ROOMS_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*-?\s*(?:zimmer|zi\b|raum\b|räume\b)", re.IGNORECASE)

_WBS = r"(?:wbs|wohnberechtigungsschein)"
_WBS_RE = re.compile(rf"\b{_WBS}\b")
_WBS_NEGATED_BEFORE = re.compile(rf"\b(?:ohne|kein|keine|keinen)\s+(?:\w+\s+)?{_WBS}\b")
_WBS_NEGATED_AFTER = re.compile(
    rf"\b{_WBS}\b[^.]{{0,30}}?\bnicht\s+(?:erforderlich|notwendig|nötig|benötigt|vorausgesetzt)"
)


def _is_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _to_float(token: str) -> float:
    """'1.200' -> 1200, '1.200,50' -> 1200.5, '45,5' -> 45.5, '45.5' -> 45.5."""
    if "," in token:
        return float(token.replace(".", "").replace(",", "."))
    if re.fullmatch(r"\d+(?:\.\d{3})+", token):
        return float(token.replace(".", ""))
    return float(token)


def parse_price(value) -> float:
    """Prvi iznos u tekstu ('800 € + 200 € NK' -> 800); 0.0 ako ga nema."""
    if _is_number(value):
        return float(value)
    match = _NUMBER_RE.search(str(value or ""))
    return _to_float(match.group()) if match else 0.0


def parse_area(value) -> float:
    """Površina u m² ('45,5 m²', '52 qm' ili samo broj); 0.0 ako je nema."""
    if _is_number(value):
        return float(value)
    text = str(value or "")
    match = _AREA_RE.search(text) or _NUMBER_ONLY_RE.fullmatch(text)
    return _to_float(match.group(1)) if match else 0.0


def parse_rooms(value) -> int:
    """Broj soba ('2 Zimmer', '3-Zimmer-Wohnung', '2 Zi.' ili samo broj), zaokruženo naniže; 0 ako ga nema."""
    if _is_number(value):
        return math.floor(value)
    text = str(value or "")
    match = _ROOMS_RE.search(text) or _NUMBER_ONLY_RE.fullmatch(text)
    return math.floor(_to_float(match.group(1))) if match else 0


def detect_wbs(text) -> bool:
    """True ako tekst traži WBS; 'ohne/kein WBS' i 'WBS nicht erforderlich' su False."""
    lowered = (text or "").lower()
    if not _WBS_RE.search(lowered):
        return False
    return not (_WBS_NEGATED_BEFORE.search(lowered) or _WBS_NEGATED_AFTER.search(lowered))


def listing_fields(price_text, text, wbs_text=None) -> dict:
    """Numerička polja oglasa: cena iz price_text, površina/sobe iz text, WBS iz wbs_text (ili text)."""
    return {
        "rent": parse_price(price_text),
        "size": parse_area(text),
        "rooms": parse_rooms(text),
        "has_wbs": detect_wbs(text if wbs_text is None else wbs_text),
    }
