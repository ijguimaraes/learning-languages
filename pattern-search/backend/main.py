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
    rows = await db_pool.fetch("SELECT id, title FROM movies ORDER BY title")
    return {"movies": [{"id": r["id"], "title": r["title"]} for r in rows]}


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
