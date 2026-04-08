import os
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy

from srt_parser import parse_srt_text
from dep_search import load_nlp, search

nlp: spacy.Language | None = None
db_pool: asyncpg.Pool | None = None

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://movielingo:movielingo_dev@localhost:5430/movielingo",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp, db_pool
    nlp = load_nlp("en_core_web_sm")
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    await db_pool.execute("""
        CREATE TABLE IF NOT EXISTS search_patterns (
            id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            pattern    TEXT NOT NULL,
            mode       VARCHAR(5) NOT NULL DEFAULT 'dep',
            language   VARCHAR(5) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    yield
    await db_pool.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _decode_srt(file: UploadFile) -> str:
    if not file.filename or not file.filename.endswith(".srt"):
        raise HTTPException(status_code=400, detail="Only .srt files are accepted")

    raw_bytes = await file.read()
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return raw_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(status_code=400, detail="Could not decode file")


@app.post("/parse")
async def parse_srt(file: UploadFile):
    content = await _decode_srt(file)
    sentences = parse_srt_text(content)
    docs = list(nlp.pipe(sentences))
    parsed = [
        {
            "text": sentence,
            "tokens": [
                {"text": t.text, "dep": t.dep_, "pos": t.pos_, "head": t.head.text}
                for t in doc
            ],
        }
        for sentence, doc in zip(sentences, docs)
    ]
    return {"total_sentences": len(sentences), "sentences": parsed}


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


@app.get("/movies")
async def list_movies():
    rows = await db_pool.fetch(
        "SELECT id, title, original_language FROM movies ORDER BY title"
    )
    return {
        "movies": [
            {"id": r["id"], "title": r["title"], "language": r["original_language"]}
            for r in rows
        ]
    }


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
    file: UploadFile,
    movie_id: str = Form(...),
):
    content = await _decode_srt(file)
    sentences = parse_srt_text(content)

    rows = await db_pool.fetch(
        "SELECT pattern, mode FROM search_patterns"
    )
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

    # Deduplicate
    unique_values = list(dict.fromkeys(all_matches))

    created = []
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            movie = await conn.fetchrow(
                "SELECT id FROM movies WHERE id = $1", movie_id
            )
            if not movie:
                raise HTTPException(status_code=404, detail="Movie not found")

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
