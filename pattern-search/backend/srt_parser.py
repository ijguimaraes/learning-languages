import re

import srt


def parse_srt_text(content: str) -> list[str]:
    """Return plain-text sentences from raw SRT content."""
    subtitles = srt.parse(content)
    sentences = []
    for sub in subtitles:
        text = re.sub(r"<[^>]+>", "", sub.content)
        text = " ".join(text.split())
        if text:
            sentences.append(text)
    return sentences
