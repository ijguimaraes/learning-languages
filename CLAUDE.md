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

## Status

Pre-implementation — API spec only, no application code yet.
