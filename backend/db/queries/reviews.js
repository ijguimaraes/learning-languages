async function insertReview(db, { userId, cardId, selectedOptionId, correct, responseTimeMs }) {
  await db.query(
    `INSERT INTO user_card_reviews (id, user_id, card_id, selected_option_id, correct, response_time_ms)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
    [userId, cardId, selectedOptionId, correct, responseTimeMs]
  );
}

async function countReviewsToday(db, userId, movieId) {
  const result = await db.query(
    `SELECT COUNT(*) FROM user_card_reviews ucr
     JOIN cards c ON c.id = ucr.card_id
     WHERE ucr.user_id = $1 AND c.movie_id = $2
       AND ucr.reviewed_at >= CURRENT_DATE`,
    [userId, movieId]
  );
  return parseInt(result.rows[0].count);
}

async function countCardsDue(db, userId, movieId) {
  const result = await db.query(
    `SELECT COUNT(*) FROM cards c
     LEFT JOIN user_card_progress ucp ON ucp.card_id = c.id AND ucp.user_id = $1
     LEFT JOIN user_movie_progress ump ON ump.movie_id = $2 AND ump.user_id = $1
     WHERE c.movie_id = $2
       AND c.audio_url IS NOT NULL
       AND (
         (ucp.in_training_window = TRUE AND ucp.id IS NOT NULL)
         OR (ucp.in_training_window = FALSE AND ucp.next_review_at <= NOW())
         OR (
           ucp.id IS NULL
           AND c.position >= COALESCE(ump.window_start, 1)
           AND c.position < COALESCE(ump.window_start, 1) + COALESCE(ump.window_size, 10)
         )
       )`,
    [userId, movieId]
  );
  return parseInt(result.rows[0].count);
}

module.exports = { insertReview, countReviewsToday, countCardsDue };
