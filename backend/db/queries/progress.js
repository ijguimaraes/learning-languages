async function getCardProgress(db, userId, cardId) {
  const result = await db.query(
    'SELECT * FROM user_card_progress WHERE user_id = $1 AND card_id = $2',
    [userId, cardId]
  );
  return result.rows[0] || null;
}

async function getOrCreateCardProgress(db, userId, cardId) {
  let progress = await getCardProgress(db, userId, cardId);
  if (progress) return progress;

  const result = await db.query(
    `INSERT INTO user_card_progress (id, user_id, card_id, in_training_window)
     VALUES (gen_random_uuid()::text, $1, $2, TRUE)
     RETURNING *`,
    [userId, cardId]
  );
  return result.rows[0];
}

async function saveCardProgress(db, progress) {
  await db.query(
    `UPDATE user_card_progress SET
       in_training_window = $2,
       training_maturity = $3,
       consecutive_correct = $4,
       repetition = $5,
       ease_factor = $6,
       interval_days = $7,
       next_review_at = $8,
       updated_at = NOW()
     WHERE id = $1`,
    [
      progress.id,
      progress.in_training_window,
      progress.training_maturity,
      progress.consecutive_correct,
      progress.repetition,
      progress.ease_factor,
      progress.interval_days,
      progress.next_review_at,
    ]
  );
}

module.exports = { getCardProgress, getOrCreateCardProgress, saveCardProgress };
