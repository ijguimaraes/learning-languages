from dataclasses import dataclass

import spacy


@dataclass
class TokenInfo:
    text: str
    dep: str
    pos: str


@dataclass
class Match:
    sentence: str
    tokens: list[str]
    labels: list[str]
    start_index: int
    sentence_tokens: list[TokenInfo]


def load_nlp(model: str = "en_core_web_sm") -> spacy.Language:
    return spacy.load(model)


def parse_pattern(raw: list[str]) -> tuple[list[str], list[str]]:
    """Split pattern into positive labels and negation lookaheads (~prefixed)."""
    positive = []
    negations = []
    for label in raw:
        if label.startswith("~"):
            negations.append(label[1:])
        else:
            positive.append(label)
    return positive, negations


def search(
    nlp: spacy.Language,
    sentences: list[str],
    pattern: list[str],
    mode: str = "dep",
) -> list[Match]:
    positive, negations = parse_pattern(pattern)
    results: list[Match] = []
    window = len(positive)
    docs = list(nlp.pipe(sentences))

    attr = "dep_" if mode == "dep" else "pos_"

    for sentence, doc in zip(sentences, docs):
        tokens = list(doc)
        for i in range(len(tokens) - window + 1):
            window_tokens = tokens[i : i + window]
            if [getattr(t, attr) for t in window_tokens] != positive:
                continue

            if negations:
                next_idx = i + window
                if next_idx < len(tokens) and getattr(tokens[next_idx], attr) in negations:
                    continue

            results.append(
                Match(
                    sentence=sentence,
                    tokens=[t.text for t in window_tokens],
                    labels=[getattr(t, attr) for t in window_tokens],
                    start_index=i,
                    sentence_tokens=[
                        TokenInfo(text=t.text, dep=t.dep_, pos=t.pos_)
                        for t in tokens
                    ],
                )
            )
    return results
