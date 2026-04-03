from dataclasses import dataclass

import spacy

from .srt_parser import SubtitleEntry

SCAFFOLD_INSTRUCTION = "Aprenda este vocabulário antes de avançar."
SENTENCE_INSTRUCTION = "Ouça o trecho e selecione a tradução correta."


@dataclass
class CardEntry:
    text: str
    is_scaffold: bool
    sentence_index: int
    position_in_block: int


def build_sentence_blocks(
    nlp: spacy.Language,
    entries: list[SubtitleEntry],
) -> list[CardEntry]:
    texts = [e.text for e in entries]
    docs = list(nlp.pipe(texts))

    cards: list[CardEntry] = []
    for sentence_idx, (entry, doc) in enumerate(zip(entries, docs), start=1):
        fragments = _extract_fragments(doc)
        # Sort fragments by word count (simplest first)
        fragments.sort(key=lambda f: (len(f.split()), f))

        block: list[CardEntry] = []
        seen = set()
        for pos, frag in enumerate(fragments, start=1):
            frag_lower = frag.lower()
            if frag_lower not in seen:
                seen.add(frag_lower)
                block.append(CardEntry(
                    text=frag,
                    is_scaffold=True,
                    sentence_index=sentence_idx,
                    position_in_block=pos,
                ))

        # Full sentence as last card in block
        block.append(CardEntry(
            text=entry.text,
            is_scaffold=False,
            sentence_index=sentence_idx,
            position_in_block=len(block) + 1,
        ))

        cards.extend(block)

    return cards


def _extract_fragments(doc) -> list[str]:
    fragments: list[str] = []

    # Layer 1: Keywords (content nouns and main verbs, single words)
    for token in doc:
        if token.is_stop or token.is_punct or token.is_space:
            continue
        if token.pos_ in ("NOUN", "PROPN"):
            fragments.append(token.text)
        elif token.pos_ == "VERB" and token.dep_ not in ("aux", "auxpass"):
            fragments.append(token.text)

    # Layer 2: Noun chunks (2+ words, skip pure pronoun chunks)
    for chunk in doc.noun_chunks:
        text = chunk.text.strip()
        if len(text.split()) >= 2 and not all(t.pos_ == "PRON" for t in chunk):
            fragments.append(text)

    # Layer 3: Prepositional phrases and verb phrases
    for token in doc:
        # Prep phrases: prep + its subtree
        if token.dep_ == "prep":
            phrase = " ".join(t.text for t in token.subtree)
            if 2 <= len(phrase.split()) <= 5:
                fragments.append(phrase)

        # Verb + direct object
        if token.pos_ == "VERB" and token.dep_ not in ("aux", "auxpass"):
            dobjs = [c for c in token.children if c.dep_ == "dobj"]
            for dobj in dobjs:
                obj_text = " ".join(t.text for t in dobj.subtree)
                phrase = f"{token.text} {obj_text}"
                if 2 <= len(phrase.split()) <= 5:
                    fragments.append(phrase)

            # Verb + particle (phrasal verbs)
            prts = [c for c in token.children if c.dep_ == "prt"]
            for prt in prts:
                fragments.append(f"{token.text} {prt.text}")

    return fragments
