from datetime import timedelta
from pathlib import Path
from textwrap import dedent

from ingestion.srt_parser import parse_srt


def test_parse_srt_basic(tmp_path: Path):
    srt_file = tmp_path / "test.srt"
    srt_file.write_text(dedent("""\
        1
        00:00:10,290 --> 00:00:12,200
        Captain, we should be in this fight.

        2
        00:00:12,620 --> 00:00:14,670
        You know there'd be no point.

        3
        00:00:15,100 --> 00:00:19,490
        None of our weapons can do
        any damage to those things.
    """))

    entries = parse_srt(srt_file)

    assert len(entries) == 3
    assert entries[0].index == 1
    assert entries[0].text == "Captain, we should be in this fight."
    assert entries[0].start == timedelta(seconds=10, milliseconds=290)
    assert entries[0].end == timedelta(seconds=12, milliseconds=200)
    assert "None of our weapons" in entries[2].text
    assert "any damage" in entries[2].text


def test_parse_srt_with_bom(tmp_path: Path):
    srt_file = tmp_path / "bom.srt"
    content = "\ufeff1\n00:00:01,000 --> 00:00:02,000\nHello world.\n\n"
    srt_file.write_bytes(content.encode("utf-8-sig"))

    entries = parse_srt(srt_file)

    assert len(entries) == 1
    assert entries[0].text == "Hello world."
