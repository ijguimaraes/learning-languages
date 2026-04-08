import json
import os

from minio import Minio

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
SUBTITLE_BUCKET = "subtitles"


def get_minio_client() -> Minio:
    return Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
    )


def ensure_bucket(client: Minio) -> None:
    if not client.bucket_exists(SUBTITLE_BUCKET):
        client.make_bucket(SUBTITLE_BUCKET)
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{SUBTITLE_BUCKET}/*"],
                }
            ],
        }
        client.set_bucket_policy(SUBTITLE_BUCKET, json.dumps(policy))


def upload_subtitle(client: Minio, movie_id: str, data: bytes) -> str:
    from io import BytesIO

    object_name = f"{movie_id}.srt"
    buffer = BytesIO(data)
    client.put_object(
        SUBTITLE_BUCKET,
        object_name,
        buffer,
        length=len(data),
        content_type="text/plain",
    )
    return f"{SUBTITLE_BUCKET}/{object_name}"


def download_subtitle(client: Minio, movie_id: str) -> bytes:
    object_name = f"{movie_id}.srt"
    response = client.get_object(SUBTITLE_BUCKET, object_name)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
