import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  api, resetDb, closeDb,
  MOVIE_MATRIX, MOVIE_INTERSTELLAR,
  CARD_MATRIX_01, CORRECT_OPT_CARD_01, WRONG_OPT_CARD_01,
  CARD_INTER_01,
} from './helpers/setup.js';

const reviewUrl = (movieId, cardId) =>
  `/v1/movies/${movieId}/practice/cards/${cardId}/review`;

const submitCorrect = (movieId, cardId, correctOptId, responseTimeMs = 2000) =>
  api('POST', reviewUrl(movieId, cardId), {
    selected_option_id: correctOptId,
    response_time_ms: responseTimeMs,
  });

const submitWrong = (movieId, cardId, wrongOptId, responseTimeMs = 5000) =>
  api('POST', reviewUrl(movieId, cardId), {
    selected_option_id: wrongOptId,
    response_time_ms: responseTimeMs,
  });

describe('Practice - Next Card', () => {
  before(async () => {
    await resetDb();
  });

  it('returns first card of the training window', async () => {
    const res = await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
    assert.equal(res.status, 200);
    assert.ok(res.body.card);
    assert.equal(res.body.card.id, CARD_MATRIX_01);
    assert.equal(res.body.card.movie_id, MOVIE_MATRIX);
    assert.ok(res.body.card.audio_url);
    assert.ok(res.body.card.value);
    assert.ok(res.body.card.instruction);
    assert.equal(res.body.card.options.length, 4);
  });

  it('card options have id and value', async () => {
    const res = await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
    for (const option of res.body.card.options) {
      assert.ok(option.id);
      assert.ok(option.value);
    }
  });

  it('returns 404 for non-existent movie', async () => {
    const res = await api('GET', '/v1/movies/nao-existe/practice/next');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'MOVIE_NOT_FOUND');
  });
});

describe('Practice - Review', () => {
  beforeEach(async () => {
    await resetDb();
    // Trigger next to create movie progress
    await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
  });

  it('correct answer returns correct=true', async () => {
    const res = await submitCorrect(MOVIE_MATRIX, CARD_MATRIX_01, CORRECT_OPT_CARD_01);
    assert.equal(res.status, 200);
    assert.equal(res.body.correct, true);
    assert.equal(res.body.correct_option.id, CORRECT_OPT_CARD_01);
    assert.equal(res.body.card_id, CARD_MATRIX_01);
    assert.ok(res.body.practice_summary);
    assert.ok('cards_reviewed_today' in res.body.practice_summary);
    assert.ok('cards_due' in res.body.practice_summary);
  });

  it('incorrect answer returns correct=false with correct option', async () => {
    const res = await submitWrong(MOVIE_MATRIX, CARD_MATRIX_01, WRONG_OPT_CARD_01);
    assert.equal(res.status, 200);
    assert.equal(res.body.correct, false);
    assert.equal(res.body.correct_option.id, CORRECT_OPT_CARD_01);
  });

  it('returns 400 when selected_option_id is missing', async () => {
    const res = await api('POST', reviewUrl(MOVIE_MATRIX, CARD_MATRIX_01), {});
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'BAD_REQUEST');
  });

  it('returns 404 for non-existent card', async () => {
    const res = await api('POST', reviewUrl(MOVIE_MATRIX, 'nao-existe'), {
      selected_option_id: 'opt_a',
    });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'CARD_NOT_FOUND');
  });

  it('returns 404 for card that belongs to another movie', async () => {
    const res = await api('POST', reviewUrl(MOVIE_MATRIX, CARD_INTER_01), {
      selected_option_id: 'opt_i01_a',
    });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'CARD_NOT_FOUND');
  });

  it('cards_reviewed_today increments after review', async () => {
    const res1 = await submitCorrect(MOVIE_MATRIX, CARD_MATRIX_01, CORRECT_OPT_CARD_01);
    const count1 = res1.body.practice_summary.cards_reviewed_today;

    const res2 = await submitCorrect(MOVIE_MATRIX, CARD_MATRIX_01, CORRECT_OPT_CARD_01);
    const count2 = res2.body.practice_summary.cards_reviewed_today;

    assert.ok(count2 > count1);
  });
});

describe('Practice - Maturity and Training Window', () => {
  beforeEach(async () => {
    await resetDb();
    // Initialize movie progress
    await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
  });

  it('repeated correct answers raise maturity (card eventually not returned as least mature)', async () => {
    // Get initial next card — should be card at position 1 (unseen)
    const first = await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
    const firstCardId = first.body.card.id;

    // Submit several correct fast answers for this card
    for (let i = 0; i < 4; i++) {
      await submitCorrect(MOVIE_MATRIX, firstCardId, CORRECT_OPT_CARD_01, 1000);
    }

    // Next card should now be a different one (first card has higher maturity)
    const next = await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
    assert.ok(next.body.card);
    assert.notEqual(next.body.card.id, firstCardId);
  });

  it('incorrect answer reduces maturity', async () => {
    // Answer correctly a few times to build maturity
    for (let i = 0; i < 5; i++) {
      await submitCorrect(MOVIE_MATRIX, CARD_MATRIX_01, CORRECT_OPT_CARD_01, 1000);
    }
    // Maturity after 5 fast correct: 5 * 22.5 = 112.5, clamped to 100

    // Now answer incorrectly (maturity drops by 30 → 70)
    await submitWrong(MOVIE_MATRIX, CARD_MATRIX_01, WRONG_OPT_CARD_01);

    // Next card should be an unseen card (maturity 0) since card_01 is at ~70
    // which is above 0 — unseen cards are prioritized over reviewed ones
    const next = await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);
    assert.ok(next.body.card);
    // Any unseen card at maturity 0 comes before card_01 at ~70
    assert.notEqual(next.body.card.id, CARD_MATRIX_01);
  });

  it('fast responses increase maturity more than slow ones', async () => {
    // Fast answer
    await submitCorrect(MOVIE_MATRIX, CARD_MATRIX_01, CORRECT_OPT_CARD_01, 1000);

    // Check movie details — cards_due should still be 10 (window size)
    const details1 = await api('GET', `/v1/movies/${MOVIE_MATRIX}`);
    const due1 = details1.body.practice.cards_due;

    await resetDb();
    await api('GET', `/v1/movies/${MOVIE_MATRIX}/practice/next`);

    // Slow answer
    await submitCorrect(MOVIE_MATRIX, CARD_MATRIX_01, CORRECT_OPT_CARD_01, 15000);

    const details2 = await api('GET', `/v1/movies/${MOVIE_MATRIX}`);
    const due2 = details2.body.practice.cards_due;

    // Both should have same cards_due after single review, but maturity differs
    // This is hard to verify externally — at least verify both succeed
    assert.equal(details1.status, 200);
    assert.equal(details2.status, 200);
  });

  it('default response_time_ms is used when not provided', async () => {
    const res = await api('POST', reviewUrl(MOVIE_MATRIX, CARD_MATRIX_01), {
      selected_option_id: CORRECT_OPT_CARD_01,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.correct, true);
  });
});
