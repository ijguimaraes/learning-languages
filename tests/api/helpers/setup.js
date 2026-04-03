import pg from 'pg';

export const BASE_URL = process.env.API_URL || 'http://localhost:3000';
export const TOKEN = 'fake-token-for-wiremock';
export const MOVIE_MATRIX = 'f1a2b3c4';
export const MOVIE_INTERSTELLAR = 'd5e6f7g8';
export const CARD_MATRIX_01 = 'card_7h8i9j0k';
export const CORRECT_OPT_CARD_01 = 'opt_b';
export const WRONG_OPT_CARD_01 = 'opt_a';
export const CARD_INTER_01 = 'card_inter_01';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'movielingo',
  user: process.env.DB_USER || 'movielingo',
  password: process.env.DB_PASSWORD || 'movielingo_dev',
});

export async function api(method, path, body) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  return {
    status: res.status,
    body: text ? JSON.parse(text) : null,
    headers: res.headers,
  };
}

export async function apiNoAuth(method, path) {
  const res = await fetch(`${BASE_URL}${path}`, { method });
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch {}
  return { status: res.status, body: parsed, headers: res.headers };
}

export async function apiWithToken(method, path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

export async function resetDb() {
  await pool.query('DELETE FROM user_card_reviews');
  await pool.query('DELETE FROM user_card_progress');
  await pool.query('DELETE FROM user_movie_progress');
}

export async function closeDb() {
  await pool.end();
}
