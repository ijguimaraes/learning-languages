import re
from datetime import timedelta

from .srt_parser import SubtitleEntry

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_SOUND_EFFECT_RE = re.compile(r"^\s*[\[\(♪].*[\]\)♪]?\s*$", re.MULTILINE)


def clean_entries(
    entries: list[SubtitleEntry],
    *,
    min_words: int = 3,
    merge_short: bool = False,
    merge_gap_ms: int = 500,
    merge_max_words: int = 3,
) -> list[SubtitleEntry]:
    cleaned = [_clean_entry(e) for e in entries]
    cleaned = [e for e in cleaned if e.text.strip()]
    cleaned = _filter_sound_effects(cleaned)

    if merge_short:
        cleaned = _merge_short_consecutive(cleaned, merge_gap_ms, merge_max_words)

    cleaned = [e for e in cleaned if _word_count(e.text) >= min_words]
    return cleaned


def _clean_entry(entry: SubtitleEntry) -> SubtitleEntry:
    text = _HTML_TAG_RE.sub("", entry.text)
    text = " ".join(text.split())
    return SubtitleEntry(
        index=entry.index,
        start=entry.start,
        end=entry.end,
        text=text.strip(),
    )


def _filter_sound_effects(entries: list[SubtitleEntry]) -> list[SubtitleEntry]:
    return [e for e in entries if not _SOUND_EFFECT_RE.match(e.text)]


def _merge_short_consecutive(
    entries: list[SubtitleEntry],
    gap_ms: int,
    max_words: int,
) -> list[SubtitleEntry]:
    if not entries:
        return []

    result: list[SubtitleEntry] = []
    current = entries[0]

    for nxt in entries[1:]:
        gap = nxt.start - current.end
        if (
            gap <= timedelta(milliseconds=gap_ms)
            and _word_count(current.text) <= max_words
            and _word_count(nxt.text) <= max_words
        ):
            current = SubtitleEntry(
                index=current.index,
                start=current.start,
                end=nxt.end,
                text=f"{current.text} {nxt.text}",
            )
        else:
            result.append(current)
            current = nxt

    result.append(current)
    return result


def _word_count(text: str) -> int:
    return len(text.split())
