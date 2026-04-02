async function getCardByIdAndMovie(db, cardId, movieId) {
  const result = await db.query(
    'SELECT * FROM cards WHERE id = $1 AND movie_id = $2',
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
