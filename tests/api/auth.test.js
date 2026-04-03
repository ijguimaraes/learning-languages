import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, apiNoAuth, apiWithToken } from './helpers/setup.js';

describe('Auth', () => {
  it('rejects request without Authorization header', async () => {
    const res = await apiNoAuth('GET', '/v1/movies');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('rejects invalid token', async () => {
    const res = await apiWithToken('GET', '/v1/movies', 'token-invalido');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('accepts valid token', async () => {
    const res = await api('GET', '/v1/movies');
    assert.equal(res.status, 200);
    assert.ok(res.body.data);
  });

  it('audio endpoint does not require auth', async () => {
    const res = await apiNoAuth('GET', '/v1/audio/output.mp3');
    assert.equal(res.status, 200);
  });
});
