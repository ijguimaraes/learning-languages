import os
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import spacy

from srt_parser import parse_srt_text
from dep_search import load_nlp, search
from minio_client import get_minio_client, ensure_bucket, upload_subtitle, download_subtitle

nlp: spacy.Language | None = None
db_pool: asyncpg.Pool | None = None
minio = None

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://movielingo:movielingo_dev@localhost:5430/movielingo",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp, db_pool, minio
    nlp = load_nlp("en_core_web_sm")
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    await db_pool.execute("""
        CREATE TABLE IF NOT EXISTS search_patterns (
            id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            pattern    TEXT NOT NULL,
            mode       VARCHAR(5) NOT NULL DEFAULT 'dep',
            language   VARCHAR(5) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(pattern, mode, language)
        )
    """)
    await db_pool.execute("""
        CREATE TABLE IF NOT EXISTS analyzed_sentences (
            id             VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            movie_id       VARCHAR(64) NOT NULL REFERENCES movies(id),
            sentence_index INT NOT NULL,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(movie_id, sentence_index)
        )
    """)
    minio = get_minio_client()
    ensure_bucket(minio)
    yield
    await db_pool.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _decode_bytes(raw_bytes: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return raw_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(status_code=400, detail="Could not decode file")


async def _decode_srt(file: UploadFile) -> str:
    if not file.filename or not file.filename.endswith(".srt"):
        raise HTTPException(status_code=400, detail="Only .srt files are accepted")
    raw_bytes = await file.read()
    return _decode_bytes(raw_bytes)


def _parse_sentences(content: str):
    sentences = parse_srt_text(content)
    docs = list(nlp.pipe(sentences))
    return [
        {
            "text": sentence,
            "tokens": [
                {"text": t.text, "dep": t.dep_, "pos": t.pos_, "head": t.head.text}
                for t in doc
            ],
        }
        for sentence, doc in zip(sentences, docs)
    ]


# --- Movies ---


@app.get("/movies")
async def list_movies():
    rows = await db_pool.fetch(
        "SELECT id, title, original_language, genre, release_date, rating FROM movies ORDER BY title"
    )
    return {
        "movies": [
            {
                "id": r["id"],
                "title": r["title"],
                "language": r["original_language"],
                "genre": r["genre"],
                "release_date": str(r["release_date"]) if r["release_date"] else None,
                "rating": float(r["rating"]) if r["rating"] else None,
            }
            for r in rows
        ]
    }


@app.post("/movies")
async def create_movie(
    title: str = Form(...),
    original_language: str = Form(...),
    genre: str = Form(None),
    release_date: str = Form(None),
    rating: float = Form(None),
    file: UploadFile = None,
):
    from datetime import date as date_type

    parsed_date = None
    if release_date:
        parsed_date = date_type.fromisoformat(release_date)

    row = await db_pool.fetchrow(
        """INSERT INTO movies (title, original_language, genre, release_date, rating)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id""",
        title,
        original_language,
        genre,
        parsed_date,
        rating,
    )
    movie_id = row["id"]

    if file and file.filename and file.filename.endswith(".srt"):
        raw_bytes = await file.read()
        upload_subtitle(minio, movie_id, raw_bytes)

    return {"id": movie_id, "title": title, "language": original_language}


@app.get("/movies/{movie_id}/subtitle")
async def get_subtitle(movie_id: str):
    movie = await db_pool.fetchrow("SELECT id FROM movies WHERE id = $1", movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    try:
        raw_bytes = download_subtitle(minio, movie_id)
        content = _decode_bytes(raw_bytes)
        return PlainTextResponse(content)
    except Exception:
        raise HTTPException(status_code=404, detail="Subtitle not found")


@app.get("/movies/{movie_id}/parse")
async def parse_movie_subtitle(movie_id: str):
    movie = await db_pool.fetchrow("SELECT id FROM movies WHERE id = $1", movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    try:
        raw_bytes = download_subtitle(minio, movie_id)
        content = _decode_bytes(raw_bytes)
    except Exception:
        raise HTTPException(status_code=404, detail="Subtitle not found")

    parsed = _parse_sentences(content)
    return {"total_sentences": len(parsed), "sentences": parsed}


# --- Analyzed sentences ---


@app.get("/movies/{movie_id}/sentences/analyzed")
async def list_analyzed_sentences(movie_id: str):
    rows = await db_pool.fetch(
        "SELECT sentence_index FROM analyzed_sentences WHERE movie_id = $1",
        movie_id,
    )
    return {"indexes": [r["sentence_index"] for r in rows]}


@app.post("/movies/{movie_id}/sentences/{sentence_index}/analyzed")
async def mark_sentence_analyzed(movie_id: str, sentence_index: int):
    await db_pool.execute(
        """INSERT INTO analyzed_sentences (movie_id, sentence_index)
           VALUES ($1, $2)
           ON CONFLICT (movie_id, sentence_index) DO NOTHING""",
        movie_id,
        sentence_index,
    )
    return {"ok": True}


@app.delete("/movies/{movie_id}/sentences/{sentence_index}/analyzed")
async def unmark_sentence_analyzed(movie_id: str, sentence_index: int):
    await db_pool.execute(
        "DELETE FROM analyzed_sentences WHERE movie_id = $1 AND sentence_index = $2",
        movie_id,
        sentence_index,
    )
    return {"ok": True}


@app.post("/movies/{movie_id}/search")
async def search_movie_subtitle(
    movie_id: str,
    pattern: str = Form(...),
    mode: str = Form("dep"),
):
    movie = await db_pool.fetchrow("SELECT id FROM movies WHERE id = $1", movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    if mode not in ("dep", "pos"):
        raise HTTPException(status_code=400, detail="Mode must be 'dep' or 'pos'")

    pattern_labels = pattern.strip().split()
    if not pattern_labels:
        raise HTTPException(status_code=400, detail="Pattern must not be empty")

    try:
        raw_bytes = download_subtitle(minio, movie_id)
        content = _decode_bytes(raw_bytes)
    except Exception:
        raise HTTPException(status_code=404, detail="Subtitle not found")

    sentences = parse_srt_text(content)
    matches = search(nlp, sentences, pattern_labels, mode=mode)

    return {
        "pattern": pattern_labels,
        "mode": mode,
        "total_sentences": len(sentences),
        "match_count": len(matches),
        "matches": [
            {
                "sentence": m.sentence,
                "tokens": m.tokens,
                "labels": m.labels,
                "start_index": m.start_index,
                "sentence_tokens": [
                    {"text": t.text, "dep": t.dep, "pos": t.pos}
                    for t in m.sentence_tokens
                ],
            }
            for m in matches
        ],
    }


# --- Legacy endpoints (file upload based) ---


@app.post("/parse")
async def parse_srt(file: UploadFile):
    content = await _decode_srt(file)
    parsed = _parse_sentences(content)
    return {"total_sentences": len(parsed), "sentences": parsed}


@app.post("/search")
async def dep_search(
    file: UploadFile,
    pattern: str = Form(...),
    mode: str = Form("dep"),
):
    content = await _decode_srt(file)

    if mode not in ("dep", "pos"):
        raise HTTPException(status_code=400, detail="Mode must be 'dep' or 'pos'")

    pattern_labels = pattern.strip().split()
    if not pattern_labels:
        raise HTTPException(status_code=400, detail="Pattern must not be empty")

    sentences = parse_srt_text(content)
    matches = search(nlp, sentences, pattern_labels, mode=mode)

    return {
        "pattern": pattern_labels,
        "mode": mode,
        "total_sentences": len(sentences),
        "match_count": len(matches),
        "matches": [
            {
                "sentence": m.sentence,
                "tokens": m.tokens,
                "labels": m.labels,
                "start_index": m.start_index,
                "sentence_tokens": [
                    {"text": t.text, "dep": t.dep, "pos": t.pos}
                    for t in m.sentence_tokens
                ],
            }
            for m in matches
        ],
    }


# --- Cards ---


class CreateCardRequest(BaseModel):
    value: str
    movie_id: str


@app.post("/cards")
async def create_card(req: CreateCardRequest):
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            movie = await conn.fetchrow(
                "SELECT id FROM movies WHERE id = $1", req.movie_id
            )
            if not movie:
                raise HTTPException(status_code=404, detail="Movie not found")

            card = await conn.fetchrow(
                "INSERT INTO cards (value) VALUES ($1) RETURNING id",
                req.value,
            )
            card_id = card["id"]

            pos = await conn.fetchval(
                "SELECT COALESCE(MAX(position), 0) + 1 FROM movie_cards WHERE movie_id = $1",
                req.movie_id,
            )

            await conn.execute(
                "INSERT INTO movie_cards (movie_id, card_id, position) VALUES ($1, $2, $3)",
                req.movie_id,
                card_id,
                pos,
            )

    return {"card_id": card_id, "position": pos}


# --- Patterns CRUD ---


class CreatePatternRequest(BaseModel):
    pattern: str
    mode: str
    language: str


@app.get("/patterns")
async def list_patterns():
    rows = await db_pool.fetch(
        "SELECT id, pattern, mode, language, created_at FROM search_patterns ORDER BY created_at DESC"
    )
    return {
        "patterns": [
            {
                "id": r["id"],
                "pattern": r["pattern"],
                "mode": r["mode"],
                "language": r["language"],
            }
            for r in rows
        ]
    }


@app.post("/patterns")
async def create_pattern(req: CreatePatternRequest):
    if req.mode not in ("dep", "pos"):
        raise HTTPException(status_code=400, detail="Mode must be 'dep' or 'pos'")
    row = await db_pool.fetchrow(
        "INSERT INTO search_patterns (pattern, mode, language) VALUES ($1, $2, $3) RETURNING id",
        req.pattern,
        req.mode,
        req.language,
    )
    return {"id": row["id"], "pattern": req.pattern, "mode": req.mode, "language": req.language}


@app.delete("/patterns/{pattern_id}")
async def delete_pattern(pattern_id: str):
    result = await db_pool.execute(
        "DELETE FROM search_patterns WHERE id = $1", pattern_id
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Pattern not found")
    return {"deleted": True}


@app.post("/patterns/run")
async def run_patterns(
    movie_id: str = Form(...),
):
    movie = await db_pool.fetchrow("SELECT id FROM movies WHERE id = $1", movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    try:
        raw_bytes = download_subtitle(minio, movie_id)
        content = _decode_bytes(raw_bytes)
    except Exception:
        raise HTTPException(status_code=404, detail="Subtitle not found")

    sentences = parse_srt_text(content)

    rows = await db_pool.fetch("SELECT pattern, mode FROM search_patterns")
    if not rows:
        return {"cards_created": 0, "cards": []}

    all_matches = []
    for row in rows:
        pattern_labels = row["pattern"].strip().split()
        mode = row["mode"]
        matches = search(nlp, sentences, pattern_labels, mode=mode)
        for m in matches:
            value = " ".join(m.tokens)
            all_matches.append(value)

    unique_values = list(dict.fromkeys(all_matches))

    created = []
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            for value in unique_values:
                card = await conn.fetchrow(
                    "INSERT INTO cards (value) VALUES ($1) RETURNING id",
                    value,
                )
                card_id = card["id"]

                pos = await conn.fetchval(
                    "SELECT COALESCE(MAX(position), 0) + 1 FROM movie_cards WHERE movie_id = $1",
                    movie_id,
                )

                await conn.execute(
                    "INSERT INTO movie_cards (movie_id, card_id, position) VALUES ($1, $2, $3)",
                    movie_id,
                    card_id,
                    pos,
                )

                created.append({"card_id": card_id, "value": value, "position": pos})

    return {"cards_created": len(created), "cards": created}
