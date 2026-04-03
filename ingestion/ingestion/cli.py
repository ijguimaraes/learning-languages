import click

from . import pipeline


@click.group()
def cli():
    """MovieLingo subtitle ingestion pipeline."""


@cli.command()
@click.option("--srt", required=True, type=click.Path(exists=True), help="Path to the .srt file")
@click.option("--title", required=True, help="Movie/episode title")
@click.option("--language", required=True, help="Original audio language code (e.g. en)")
@click.option("--genre", default=None, help="Genre (e.g. anime, action, sci-fi)")
@click.option("--release-date", default=None, help="Release date (YYYY-MM-DD)")
@click.option("--rating", default=None, type=float, help="Rating (e.g. 8.7)")
@click.option("--min-words", default=3, type=int, help="Minimum words per sentence to include")
@click.option("--merge-short/--no-merge-short", default=False, help="Merge short consecutive subtitles")
@click.option("--force", is_flag=True, help="Overwrite if movie title already exists")
def ingest(srt, title, language, genre, release_date, rating, min_words, merge_short, force):
    """Parse SRT, build scaffold blocks, and insert into database."""
    click.echo(f"Parsing: {srt}")

    movie_id, count = pipeline.ingest(
        srt_path=srt,
        title=title,
        language=language,
        genre=genre,
        release_date=release_date,
        rating=rating,
        min_words=min_words,
        merge_short=merge_short,
        force=force,
    )

    click.echo(f"Inserted movie '{title}' (id={movie_id}) with {count} cards.")


@cli.command()
@click.option("--srt", required=True, type=click.Path(exists=True), help="Path to the .srt file")
@click.option("--min-words", default=3, type=int, help="Minimum words per sentence to include")
@click.option("--merge-short/--no-merge-short", default=False, help="Merge short consecutive subtitles")
def preview(srt, min_words, merge_short):
    """Dry run: parse SRT and show cards grouped by sentence blocks."""
    click.echo(f"Parsing: {srt}\n")

    cards = pipeline.build_cards(srt, min_words=min_words, merge_short=merge_short)

    scaffolds = sum(1 for c in cards if c.is_scaffold)
    sentences = max((c.sentence_index for c in cards), default=0)
    click.echo(f"Total cards: {len(cards)}  (scaffolds: {scaffolds}, sentences: {sentences})\n")
    click.echo(f"{'Pos':>4}  {'Bloco':>5}  Text")
    click.echo("-" * 70)

    current_block = 0
    for i, c in enumerate(cards, 1):
        if c.sentence_index != current_block:
            if current_block > 0:
                click.echo("")
            current_block = c.sentence_index

        tag = " [S]" if c.is_scaffold else ""
        text = c.text[:55] + "..." if len(c.text) > 55 else c.text
        click.echo(f"{i:>4}  {c.sentence_index:>5}  {text}{tag}")


if __name__ == "__main__":
    cli()
