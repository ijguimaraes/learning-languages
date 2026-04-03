async function selectNextCard(db, userId, movieId, userLanguage) {
  // Ensure user_movie_progress exists (first practice on this movie)
  let movieProgress = await getOrCreateMovieProgress(db, userId, movieId);

  // PRIORITY 1: Spaced repetition cards that are DUE (for this movie)
  const srResult = await db.query(
    `SELECT ucp.card_id, mc.position, c.audio_url, c.value, c.instruction
     FROM user_card_progress ucp
     JOIN movie_cards mc ON mc.card_id = ucp.card_id
     JOIN cards c ON c.id = ucp.card_id
     WHERE ucp.user_id = $1
       AND mc.movie_id = $2
       AND ucp.in_training_window = FALSE
       AND ucp.next_review_at <= NOW()
       AND c.audio_url IS NOT NULL
     ORDER BY ucp.next_review_at ASC
     LIMIT 1`,
    [userId, movieId]
  );

  if (srResult.rows.length > 0) {
    return buildCardResponse(db, srResult.rows[0], userLanguage);
  }

  // PRIORITY 2: Cards in training window (unseen first, then least mature)
  const windowStart = movieProgress.window_start;
  const windowEnd = windowStart + movieProgress.window_size - 1;

  const trainingResult = await db.query(
    `SELECT mc.card_id, mc.position, c.audio_url, c.value, c.instruction,
            ucp.id AS progress_id, COALESCE(ucp.training_maturity, 0) AS maturity
     FROM movie_cards mc
     JOIN cards c ON c.id = mc.card_id
     LEFT JOIN user_card_progress ucp ON ucp.card_id = mc.card_id AND ucp.user_id = $1
     WHERE mc.movie_id = $2
       AND mc.position >= $3
       AND mc.position <= $4
       AND (ucp.in_training_window = TRUE OR ucp.id IS NULL)
       AND c.audio_url IS NOT NULL
     ORDER BY
       CASE WHEN ucp.id IS NULL THEN 0 ELSE 1 END,
       COALESCE(ucp.training_maturity, 0) ASC
     LIMIT 1`,
    [userId, movieId, windowStart, windowEnd]
  );

  if (trainingResult.rows.length > 0) {
    const row = trainingResult.rows[0];

    // Create progress row if card is being seen for the first time
    if (!row.progress_id) {
      await db.query(
        `INSERT INTO user_card_progress (id, user_id, card_id, in_training_window)
         VALUES (gen_random_uuid()::text, $1, $2, TRUE)
         ON CONFLICT (user_id, card_id) DO NOTHING`,
        [userId, row.card_id]
      );
    }

    return buildCardResponse(db, row, userLanguage);
  }

  // PRIORITY 3: No cards available
  const nextReviewResult = await db.query(
    `SELECT MIN(next_review_at) AS next_at FROM user_card_progress
     WHERE user_id = $1
       AND card_id IN (SELECT card_id FROM movie_cards WHERE movie_id = $2)
       AND in_training_window = FALSE`,
    [userId, movieId]
  );

  return {
    card: null,
    next_review_at: nextReviewResult.rows[0]?.next_at || null,
    message: 'Nenhum card disponível no momento. Volte em breve para a próxima revisão.',
  };
}

async function getOrCreateMovieProgress(db, userId, movieId) {
  const existing = await db.query(
    'SELECT * FROM user_movie_progress WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  );

  if (existing.rows.length > 0) return existing.rows[0];

  // First practice — create progress and lock language
  const result = await db.query(
    `INSERT INTO user_movie_progress (id, user_id, movie_id)
     VALUES (gen_random_uuid()::text, $1, $2)
     RETURNING *`,
    [userId, movieId]
  );

  await db.query(
    'UPDATE users SET language_locked = TRUE, updated_at = NOW() WHERE id = $1 AND language_locked = FALSE',
    [userId]
  );

  return result.rows[0];
}

async function buildCardResponse(db, cardRow, userLanguage) {
  const optionsResult = await db.query(
    `SELECT id, value FROM card_options
     WHERE card_id = $1 AND language = $2
     ORDER BY display_order`,
    [cardRow.card_id, userLanguage]
  );

  return {
    card: {
      id: cardRow.card_id,
      movie_id: undefined, // set by the route
      audio_url: cardRow.audio_url,
      value: cardRow.value,
      instruction: cardRow.instruction,
      options: optionsResult.rows.map(o => ({ id: o.id, value: o.value })),
    },
  };
}

module.exports = { selectNextCard };
