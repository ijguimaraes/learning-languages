const ALLOWED_SORT = ['title', 'release_date', 'rating'];

async function listMovies(db, userId, { page = 1, limit = 20, genre, search, sort = 'title', order = 'asc' }) {
  // Build filter conditions — used for both count and data queries
  const filterValues = [];
  const countConditions = [];
  const dataConditions = [];
  let countIdx = 1;
  let dataIdx = 2; // $1 = userId in data query

  if (genre) {
    countConditions.push(`m.genre = $${countIdx++}`);
    dataConditions.push(`m.genre = $${dataIdx++}`);
    filterValues.push(genre);
  }
  if (search) {
    countConditions.push(`m.title ILIKE $${countIdx++}`);
    dataConditions.push(`m.title ILIKE $${dataIdx++}`);
    filterValues.push(`%${search}%`);
  }

  const countWhere = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';
  const dataWhere = dataConditions.length > 0 ? `WHERE ${dataConditions.join(' AND ')}` : '';

  const sortColumn = ALLOWED_SORT.includes(sort) ? sort : 'title';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  const pgOffset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*) FROM movies m ${countWhere}`,
    filterValues
  );
  const totalItems = parseInt(countResult.rows[0].count);

  const dataResult = await db.query(
    `SELECT
        m.id,
        m.title,
        (
          SELECT COUNT(*) FROM movie_cards mc
          JOIN cards c ON c.id = mc.card_id
          WHERE mc.movie_id = m.id AND c.audio_url IS NOT NULL
        ) AS total_cards,
        (
          SELECT COUNT(*) FROM movie_cards mc
          JOIN cards c ON c.id = mc.card_id
          LEFT JOIN user_card_progress ucp ON ucp.card_id = mc.card_id AND ucp.user_id = $1
          LEFT JOIN user_movie_progress ump ON ump.movie_id = m.id AND ump.user_id = $1
          WHERE mc.movie_id = m.id
            AND c.audio_url IS NOT NULL
            AND (
              (ucp.in_training_window = TRUE AND ucp.id IS NOT NULL)
              OR (ucp.in_training_window = FALSE AND ucp.next_review_at <= NOW())
              OR (
                ucp.id IS NULL
                AND mc.position >= COALESCE(ump.window_start, 1)
                AND mc.position < COALESCE(ump.window_start, 1) + COALESCE(ump.window_size, 10)
              )
            )
        ) AS cards_due
      FROM movies m
      ${dataWhere}
      ORDER BY m.${sortColumn} ${sortOrder}
      LIMIT $${dataIdx++} OFFSET $${dataIdx++}`,
    [userId, ...filterValues, limit, pgOffset]
  );

  return {
    data: dataResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      practice: {
        total_cards: parseInt(row.total_cards),
        cards_due: parseInt(row.cards_due),
      },
    })),
    pagination: {
      current_page: page,
      per_page: limit,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / limit),
    },
  };
}

async function getMovieById(db, userId, movieId) {
  const movieResult = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
  if (movieResult.rows.length === 0) return null;

  const movie = movieResult.rows[0];

  const statsResult = await db.query(
    `SELECT
        (
          SELECT COUNT(*) FROM movie_cards mc
          JOIN cards c ON c.id = mc.card_id
          WHERE mc.movie_id = $2 AND c.audio_url IS NOT NULL
        ) AS total_cards,
        (
          SELECT COUNT(*) FROM user_card_progress ucp
          WHERE ucp.user_id = $1
            AND ucp.card_id IN (
              SELECT mc.card_id FROM movie_cards mc
              JOIN cards c ON c.id = mc.card_id
              WHERE mc.movie_id = $2 AND c.audio_url IS NOT NULL
            )
        ) AS cards_reviewed,
        (
          SELECT COUNT(*) FROM movie_cards mc
          JOIN cards c ON c.id = mc.card_id
          LEFT JOIN user_card_progress ucp ON ucp.card_id = mc.card_id AND ucp.user_id = $1
          LEFT JOIN user_movie_progress ump ON ump.movie_id = $2 AND ump.user_id = $1
          WHERE mc.movie_id = $2
            AND c.audio_url IS NOT NULL
            AND (
              (ucp.in_training_window = TRUE AND ucp.id IS NOT NULL)
              OR (ucp.in_training_window = FALSE AND ucp.next_review_at <= NOW())
              OR (
                ucp.id IS NULL
                AND mc.position >= COALESCE(ump.window_start, 1)
                AND mc.position < COALESCE(ump.window_start, 1) + COALESCE(ump.window_size, 10)
              )
            )
        ) AS cards_due,
        (
          SELECT MIN(ucp.next_review_at) FROM user_card_progress ucp
          WHERE ucp.user_id = $1
            AND ucp.card_id IN (SELECT mc.card_id FROM movie_cards mc WHERE mc.movie_id = $2)
            AND ucp.in_training_window = FALSE AND ucp.next_review_at > NOW()
        ) AS next_review_at`,
    [userId, movieId]
  );

  const stats = statsResult.rows[0];

  return {
    id: movie.id,
    title: movie.title,
    practice: {
      total_cards: parseInt(stats.total_cards),
      cards_due: parseInt(stats.cards_due),
      cards_reviewed: parseInt(stats.cards_reviewed),
      next_review_at: stats.next_review_at || null,
    },
  };
}

module.exports = { listMovies, getMovieById };
