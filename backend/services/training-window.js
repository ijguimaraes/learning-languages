const { calculateMaturityDelta } = require('./maturity');

const MATURITY_THRESHOLD = 80.0;

function updateTrainingMaturity(progress, correct, responseTimeMs) {
  const delta = calculateMaturityDelta(correct, responseTimeMs);
  progress.training_maturity = Math.max(0, Math.min(100, parseFloat(progress.training_maturity) + delta));

  if (correct) {
    progress.consecutive_correct += 1;
  } else {
    progress.consecutive_correct = 0;
  }

  return progress;
}

async function checkWindowAdvancement(db, userId, movieId) {
  const progressResult = await db.query(
    'SELECT * FROM user_movie_progress WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  );
  if (progressResult.rows.length === 0) return;

  const movieProgress = progressResult.rows[0];
  const windowStart = movieProgress.window_start;
  const windowEnd = windowStart + movieProgress.window_size - 1;

  // Get all card progresses within the current window
  const cardProgressResult = await db.query(
    `SELECT ucp.*, c.position FROM user_card_progress ucp
     JOIN cards c ON c.id = ucp.card_id
     WHERE ucp.user_id = $1
       AND c.movie_id = $2
       AND c.position >= $3
       AND c.position <= $4
       AND ucp.in_training_window = TRUE`,
    [userId, movieId, windowStart, windowEnd]
  );

  // Count total cards in the window
  const totalCardsResult = await db.query(
    'SELECT COUNT(*) FROM cards WHERE movie_id = $1 AND position >= $2 AND position <= $3',
    [movieId, windowStart, windowEnd]
  );
  const totalCardsInWindow = parseInt(totalCardsResult.rows[0].count);

  // All cards in the window must have progress rows AND be above threshold
  if (cardProgressResult.rows.length < totalCardsInWindow) return;

  const allMature = cardProgressResult.rows.every(
    cp => parseFloat(cp.training_maturity) >= MATURITY_THRESHOLD
  );
  if (!allMature) return;

  // Graduate the card at window_start (lowest position) to spaced repetition
  const graduatingCard = cardProgressResult.rows.find(cp => cp.position === windowStart);
  if (graduatingCard) {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    await db.query(
      `UPDATE user_card_progress
       SET in_training_window = FALSE,
           repetition = 0,
           ease_factor = 2.50,
           interval_days = 1,
           next_review_at = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [graduatingCard.id, userId, new Date(now.getTime() + oneDayMs)]
    );
  }

  // Advance window by 1
  await db.query(
    'UPDATE user_movie_progress SET window_start = $3, updated_at = NOW() WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId, windowStart + 1]
  );
}

module.exports = { updateTrainingMaturity, checkWindowAdvancement, MATURITY_THRESHOLD };
