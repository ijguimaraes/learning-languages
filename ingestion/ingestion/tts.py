import os
from io import BytesIO

import click
from dotenv import load_dotenv
from gtts import gTTS
from minio import Minio

from .db import get_connection

load_dotenv()

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "audio")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"


def get_minio_client():
    return Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
    )


def ensure_bucket(client):
    if not client.bucket_exists(MINIO_BUCKET):
        client.make_bucket(MINIO_BUCKET)
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{MINIO_BUCKET}/*"],
                }
            ],
        }
        import json
        client.set_bucket_policy(MINIO_BUCKET, json.dumps(policy))


def fetch_cards_without_audio(conn):
    query = """
        SELECT DISTINCT c.id, c.value, m.original_language
        FROM cards c
        JOIN movie_cards mc ON mc.card_id = c.id
        JOIN movies m ON m.id = mc.movie_id
        WHERE c.audio_url IS NULL
        ORDER BY c.id
    """
    with conn.cursor() as cur:
        cur.execute(query)
        return cur.fetchall()


def generate_audio(text, lang):
    tts = gTTS(text=text, lang=lang)
    buffer = BytesIO()
    tts.write_to_fp(buffer)
    buffer.seek(0)
    return buffer


def upload_and_update(conn, minio_client, card_id, audio_buffer):
    object_name = f"cards/{card_id}.mp3"
    size = audio_buffer.getbuffer().nbytes

    minio_client.put_object(
        MINIO_BUCKET,
        object_name,
        audio_buffer,
        length=size,
        content_type="audio/mpeg",
    )

    audio_url = f"{MINIO_BUCKET}/{object_name}"

    with conn.cursor() as cur:
        cur.execute(
            "UPDATE cards SET audio_url = %s WHERE id = %s",
            (audio_url, card_id),
        )
    conn.commit()

    return audio_url


def generate_all():
    conn = get_connection()
    minio_client = get_minio_client()
    ensure_bucket(minio_client)

    cards = fetch_cards_without_audio(conn)

    if not cards:
        click.echo("No cards with NULL audio_url found.")
        conn.close()
        return 0

    click.echo(f"Found {len(cards)} cards without audio.")

    success = 0
    for card_id, value, lang in cards:
        try:
            click.echo(f"  [{lang}] {card_id}: {value[:60]}...")
            audio_buffer = generate_audio(value, lang)
            url = upload_and_update(conn, minio_client, card_id, audio_buffer)
            click.echo(f"    -> {url}")
            success += 1
        except Exception as e:
            conn.rollback()
            click.echo(f"    ERROR: {e}", err=True)

    conn.close()
    click.echo(f"\nDone. {success}/{len(cards)} cards processed.")
    return success
