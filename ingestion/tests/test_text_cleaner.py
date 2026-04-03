from datetime import timedelta

from ingestion.srt_parser import SubtitleEntry
from ingestion.text_cleaner import clean_entries


def _entry(index, text, start_ms=0, end_ms=1000):
    return SubtitleEntry(
        index=index,
        start=timedelta(milliseconds=start_ms),
        end=timedelta(milliseconds=end_ms),
        text=text,
    )


def test_removes_html_tags():
    entries = [_entry(1, "<i>Damn it... I'm losing consciousness</i>")]
    result = clean_entries(entries, min_words=1)
    assert result[0].text == "Damn it... I'm losing consciousness"


def test_filters_sound_effects():
    entries = [
        _entry(1, "[music]"),
        _entry(2, "♪ La la la ♪"),
        _entry(3, "This is real dialogue here."),
    ]
    result = clean_entries(entries, min_words=1)
    assert len(result) == 1
    assert "real dialogue" in result[0].text


def test_filters_short_entries():
    entries = [
        _entry(1, "Yes."),
        _entry(2, "This is a longer sentence with enough words."),
    ]
    result = clean_entries(entries, min_words=3)
    assert len(result) == 1
    assert "longer sentence" in result[0].text


def test_merges_short_consecutive():
    entries = [
        _entry(1, "Damn it...", start_ms=0, end_ms=1000),
        _entry(2, "I'm done.", start_ms=1200, end_ms=2000),
        _entry(3, "This is a separate longer sentence here.", start_ms=5000, end_ms=7000),
    ]
    result = clean_entries(entries, min_words=1, merge_short=True, merge_max_words=3)
    assert any("Damn it... I'm done." in e.text for e in result)


def test_joins_multiline_text():
    entries = [_entry(1, "None of our weapons can do\nany damage to those things.")]
    result = clean_entries(entries, min_words=1)
    assert result[0].text == "None of our weapons can do any damage to those things."
