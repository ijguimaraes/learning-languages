import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { api, resetDb, MOVIE_MATRIX } from './helpers/setup.js';

describe('Movies', () => {
  before(async () => {
    await resetDb();
  });

  describe('GET /v1/movies', () => {
    it('lists all movies', async () => {
      const res = await api('GET', '/v1/movies');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 2);
      assert.equal(res.body.pagination.total_items, 2);
    });

    it('paginates results', async () => {
      const res = await api('GET', '/v1/movies?page=1&limit=1');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.pagination.total_pages, 2);
      assert.equal(res.body.pagination.per_page, 1);
    });

    it('searches by title', async () => {
      const res = await api('GET', '/v1/movies?search=Matrix');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].title, 'Matrix');
    });

    it('filters by genre', async () => {
      const res = await api('GET', '/v1/movies?genre=action');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].title, 'Matrix');
    });

    it('sorts descending by title', async () => {
      const res = await api('GET', '/v1/movies?sort=title&order=desc');
      assert.equal(res.status, 200);
      assert.equal(res.body.data[0].title, 'Matrix');
      assert.equal(res.body.data[1].title, 'Interstellar');
    });

    it('returns practice stats per movie', async () => {
      const res = await api('GET', '/v1/movies');
      assert.equal(res.status, 200);
      for (const movie of res.body.data) {
        assert.ok('practice' in movie);
        assert.ok('total_cards' in movie.practice);
        assert.ok('cards_due' in movie.practice);
      }
    });
  });

  describe('GET /v1/movies/:movie_id', () => {
    it('returns movie details', async () => {
      const res = await api('GET', `/v1/movies/${MOVIE_MATRIX}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.title, 'Matrix');
      assert.equal(res.body.practice.total_cards, 10);
    });

    it('returns cards_due = 10 for fresh movie with window_size 10', async () => {
      const res = await api('GET', `/v1/movies/${MOVIE_MATRIX}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.practice.cards_due, 10);
    });

    it('returns 404 for non-existent movie', async () => {
      const res = await api('GET', '/v1/movies/nao-existe');
      assert.equal(res.status, 404);
      assert.equal(res.body.error.code, 'MOVIE_NOT_FOUND');
    });
  });
});
