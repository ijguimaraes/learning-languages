from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

import srt


@dataclass
class SubtitleEntry:
    index: int
    start: timedelta
    end: timedelta
    text: str


def parse_srt(file_path: str | Path) -> list[SubtitleEntry]:
    raw = _read_file(file_path)
    subtitles = srt.parse(raw)
    return [
        SubtitleEntry(
            index=sub.index,
            start=sub.start,
            end=sub.end,
            text=sub.content,
        )
        for sub in subtitles
    ]


def _read_file(file_path: str | Path) -> str:
    path = Path(file_path)
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {path} with any supported encoding")
