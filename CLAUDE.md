# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Language-learning platform where users practice translation through movie audio clips using spaced repetition. Users listen to movie dialogue excerpts and select the correct translation from multiple-choice options. The spaced repetition algorithm schedules card reviews — correct answers increase the interval, incorrect answers reset it.

## API Design (v3)

REST API documented in `api-documentation-v3.md` (Portuguese). Base URL pattern: `/v1/movies/...`

Key endpoints:
- `GET /movies` — paginated movie listing with practice progress (supports genre/search/sort filters)
- `GET /movies/{movie_id}` — movie details with review stats
- `GET /movies/{movie_id}/practice/next` — next card from spaced repetition queue (returns `card: null` when none due)
- `POST /movies/{movie_id}/practice/cards/{card_id}/review` — submit answer (`selected_option_id`), returns correctness + next review date

Auth: Bearer token. Standard error envelope: `{ "error": { "code", "message", "details" } }`.

## Architecture

- **Flutter app** (`app/`): mobile client using `http` + `audioplayers`
- **Fastify backend** (`backend/`): Node.js REST API on port 3000
- **PostgreSQL** via Docker Compose (`docker-compose.yml`): database `movielingo`
- **WireMock** (`wiremock/`): mock server for integration testing

### Backend structure
- `backend/db/init/` — SQL migrations (run on first `docker compose up`)
- `backend/db/connection.js` — pg Pool
- `backend/db/queries/` — SQL query functions (movies, cards, progress, reviews)
- `backend/services/` — business logic (maturity, training-window, spaced-repetition, card-selector)
- `backend/routes/` — Fastify route handlers
- `backend/plugins/auth.js` — Bearer token → user resolution from DB

### Card scheduling algorithms
1. **Training window**: fixed-size sliding window over movie cards. Advances when all cards reach maturity threshold (80/100). Graduated cards enter spaced repetition.
2. **Spaced repetition (SM-2)**: intervals grow with correct answers. Quality score derived from response time (faster = higher quality).

### Key tables
`users`, `movies`, `cards`, `card_options` (language-keyed), `user_movie_progress` (window state), `user_card_progress` (maturity + SM-2), `user_card_reviews` (audit log)

## Status

Backend implemented with PostgreSQL. Two scheduling algorithms (training window + SM-2) in place. Flutter app sends `response_time_ms` on review submission.
