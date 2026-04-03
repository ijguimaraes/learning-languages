async function getCardByIdAndMovie(db, cardId, movieId) {
  const result = await db.query(
    `SELECT c.* FROM cards c
     JOIN movie_cards mc ON mc.card_id = c.id
     WHERE c.id = $1 AND mc.movie_id = $2
     LIMIT 1`,
    [cardId, movieId]
  );
  return result.rows[0] || null;
}

async function getCorrectOption(db, cardId, language) {
  const result = await db.query(
    'SELECT id, value FROM card_options WHERE card_id = $1 AND language = $2 AND is_correct = TRUE',
    [cardId, language]
  );
  return result.rows[0] || null;
}

async function getOptionById(db, optionId) {
  const result = await db.query(
    'SELECT id, value FROM card_options WHERE id = $1',
    [optionId]
  );
  return result.rows[0] || null;
}

module.exports = { getCardByIdAndMovie, getCorrectOption, getOptionById };
