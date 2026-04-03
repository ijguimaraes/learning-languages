import os

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

from .scaffolding import CardEntry, SCAFFOLD_INSTRUCTION, SENTENCE_INSTRUCTION

load_dotenv()


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "movielingo"),
        user=os.getenv("DB_USER", "movielingo"),
        password=os.getenv("DB_PASSWORD", "movielingo_dev"),
    )


def movie_exists(conn, title: str) -> str | None:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM movies WHERE title = %s", (title,))
        row = cur.fetchone()
        return row[0] if row else None


def delete_movie(conn, movie_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM movies WHERE id = %s", (movie_id,))


def insert_movie(
    conn,
    *,
    title: str,
    original_language: str,
    genre: str | None = None,
    release_date: str | None = None,
    rating: float | None = None,
) -> str:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO movies (title, original_language, genre, release_date, rating)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (title, original_language, genre, release_date, rating),
        )
        return cur.fetchone()[0]


def insert_cards_and_link(
    conn,
    movie_id: str,
    cards: list[CardEntry],
) -> list[str]:
    if not cards:
        return []

    card_values = [
        (c.text, SCAFFOLD_INSTRUCTION if c.is_scaffold else SENTENCE_INSTRUCTION)
        for c in cards
    ]

    with conn.cursor() as cur:
        card_ids = execute_values(
            cur,
            "INSERT INTO cards (value, instruction) VALUES %s RETURNING id",
            card_values,
            fetch=True,
        )
        card_ids = [row[0] for row in card_ids]

        link_values = [
            (movie_id, card_id, position)
            for position, card_id in enumerate(card_ids, start=1)
        ]
        execute_values(
            cur,
            "INSERT INTO movie_cards (movie_id, card_id, position) VALUES %s",
            link_values,
        )

    return card_ids


def ingest(
    *,
    title: str,
    original_language: str,
    genre: str | None,
    release_date: str | None,
    rating: float | None,
    cards: list[CardEntry],
    force: bool = False,
) -> tuple[str, int]:
    conn = get_connection()
    try:
        existing_id = movie_exists(conn, title)
        if existing_id and not force:
            raise ValueError(
                f"Movie '{title}' already exists (id={existing_id}). Use --force to overwrite."
            )
        if existing_id and force:
            delete_movie(conn, existing_id)

        movie_id = insert_movie(
            conn,
            title=title,
            original_language=original_language,
            genre=genre,
            release_date=release_date,
            rating=rating,
        )
        card_ids = insert_cards_and_link(conn, movie_id, cards)
        conn.commit()
        return movie_id, len(card_ids)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
