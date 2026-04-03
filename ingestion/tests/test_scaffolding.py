import pytest
from datetime import timedelta

import spacy

from ingestion.srt_parser import SubtitleEntry
from ingestion.scaffolding import build_sentence_blocks


@pytest.fixture(scope="module")
def nlp():
    return spacy.load("en_core_web_md")


def _entry(index, text):
    return SubtitleEntry(index=index, start=timedelta(0), end=timedelta(seconds=1), text=text)


def test_full_sentence_is_last_in_block(nlp):
    entries = [_entry(1, "Captain, we should be in this fight.")]
    cards = build_sentence_blocks(nlp, entries)

    assert len(cards) >= 2
    assert cards[-1].is_scaffold is False
    assert cards[-1].text == "Captain, we should be in this fight."


def test_scaffolds_come_before_sentence(nlp):
    entries = [_entry(1, "Captain, we should be in this fight.")]
    cards = build_sentence_blocks(nlp, entries)

    scaffolds = [c for c in cards if c.is_scaffold]
    assert len(scaffolds) >= 1
    # All scaffolds have lower position_in_block than the sentence
    sentence = [c for c in cards if not c.is_scaffold][0]
    for s in scaffolds:
        assert s.position_in_block < sentence.position_in_block


def test_scaffolds_sorted_by_word_count(nlp):
    entries = [_entry(1, "None of our weapons can do any damage to those things.")]
    cards = build_sentence_blocks(nlp, entries)

    scaffolds = [c for c in cards if c.is_scaffold]
    word_counts = [len(s.text.split()) for s in scaffolds]
    assert word_counts == sorted(word_counts)


def test_multiple_sentences_preserve_order(nlp):
    entries = [
        _entry(1, "Captain, we should be in this fight."),
        _entry(2, "You know there'd be no point."),
    ]
    cards = build_sentence_blocks(nlp, entries)

    sentence_indices = [c.sentence_index for c in cards if not c.is_scaffold]
    assert sentence_indices == [1, 2]


def test_blocks_are_contiguous(nlp):
    entries = [
        _entry(1, "Captain, we should be in this fight."),
        _entry(2, "You know there'd be no point."),
    ]
    cards = build_sentence_blocks(nlp, entries)

    # All cards from block 1 appear before any card from block 2
    block1_positions = [i for i, c in enumerate(cards) if c.sentence_index == 1]
    block2_positions = [i for i, c in enumerate(cards) if c.sentence_index == 2]
    assert max(block1_positions) < min(block2_positions)


def test_no_duplicate_scaffolds(nlp):
    entries = [_entry(1, "Captain, we should be in this fight.")]
    cards = build_sentence_blocks(nlp, entries)

    scaffold_texts = [c.text.lower() for c in cards if c.is_scaffold]
    assert len(scaffold_texts) == len(set(scaffold_texts))


def test_sentence_index_matches_block(nlp):
    entries = [_entry(1, "Hello there."), _entry(2, "I am here now.")]
    cards = build_sentence_blocks(nlp, entries)

    for c in cards:
        assert c.sentence_index in (1, 2)
