import pytest

from core.parsing import detect_wbs, listing_fields, parse_area, parse_price, parse_rooms


@pytest.mark.parametrize("value, expected", [
    ("1.200 €", 1200),
    ("850 € VB", 850),
    ("800 € + 200 € NK", 800),
    ("1.200,50 €", 1200.5),
    ("€ 1.200,-", 1200),
    ("Auf Anfrage", 0),
    ("", 0),
    (None, 0),
    (900, 900),
    (845.5, 845.5),
])
def test_parse_price(value, expected):
    assert parse_price(value) == expected


@pytest.mark.parametrize("value, expected", [
    ("45,5 m²", 45.5),
    ("45 m²", 45),
    ("52.3 qm", 52.3),
    ("Wohnung 60 m2 groß", 60),
    ("1.200 € 45 m²", 45),
    ("45,5", 45.5),
    (45.5, 45.5),
    ("keine Angabe", 0),
    (None, 0),
])
def test_parse_area(value, expected):
    assert parse_area(value) == expected


@pytest.mark.parametrize("value, expected", [
    ("2 Zimmer", 2),
    ("2,5 Zimmer", 2),
    ("2 Zi.", 2),
    ("3-Zimmer-Wohnung", 3),
    ("Schöne 4-Zi-Wohnung", 4),
    ("1.200 € 2 Zi.", 2),
    ("2,5", 2),
    (3, 3),
    (2.5, 2),
    ("keine Angabe", 0),
    (None, 0),
])
def test_parse_rooms(value, expected):
    assert parse_rooms(value) == expected


@pytest.mark.parametrize("text, expected", [
    ("WBS erforderlich", True),
    ("Wohnung mit Wohnberechtigungsschein", True),
    ("WBS-Wohnung 100", True),
    ("ohne WBS", False),
    ("kein WBS nötig", False),
    ("WBS nicht erforderlich", False),
    ("Schöne Wohnung", False),
    ("", False),
    (None, False),
])
def test_detect_wbs(text, expected):
    assert detect_wbs(text) is expected


def test_listing_fields_reads_rent_size_rooms_and_wbs():
    fields = listing_fields("1.200 €", "Schöne 2 Zi. Wohnung 45,5 m² mit WBS")

    assert fields == {"rent": 1200.0, "size": 45.5, "rooms": 2, "has_wbs": True}


def test_listing_fields_uses_wbs_text_when_given():
    fields = listing_fields("900 €", "3 Zimmer 60 m² WBS erforderlich", wbs_text="Neubau Erstbezug")

    assert fields["has_wbs"] is False
    assert fields["rooms"] == 3
