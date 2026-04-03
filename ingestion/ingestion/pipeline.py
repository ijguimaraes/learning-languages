from .srt_parser import parse_srt
from .text_cleaner import clean_entries
from .complexity import load_model
from .scaffolding import build_sentence_blocks, CardEntry
from . import db


def build_cards(
    srt_path: str,
    *,
    min_words: int = 3,
    merge_short: bool = False,
) -> list[CardEntry]:
    entries = parse_srt(srt_path)
    cleaned = clean_entries(entries, min_words=min_words, merge_short=merge_short)
    nlp = load_model()
    cards = build_sentence_blocks(nlp, cleaned)
    return cards


def ingest(
    srt_path: str,
    *,
    title: str,
    language: str,
    genre: str | None = None,
    release_date: str | None = None,
    rating: float | None = None,
    min_words: int = 3,
    merge_short: bool = False,
    force: bool = False,
) -> tuple[str, int]:
    cards = build_cards(srt_path, min_words=min_words, merge_short=merge_short)

    movie_id, count = db.ingest(
        title=title,
        original_language=language,
        genre=genre,
        release_date=release_date,
        rating=rating,
        cards=cards,
        force=force,
    )
    return movie_id, count
