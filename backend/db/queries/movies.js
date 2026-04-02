const ALLOWED_SORT = ['title', 'release_date', 'rating'];

async function listMovies(db, userId, { page = 1, limit = 20, genre, search, sort = 'title', order = 'asc' }) {
  const conditions = [];
  const params = [userId];
  let paramIndex = 2;

  if (genre) {
    conditions.push(`m.genre = $${paramIndex++}`);
    params.push(genre);
  }
  if (search) {
    conditions.push(`m.title ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortColumn = ALLOWED_SORT.includes(sort) ? sort : 'title';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  const offset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*) FROM movies m ${whereClause}`,
    params.slice(1) // user_id not needed for count
  );
  const totalItems = parseInt(countResult.rows[0].count);

  const dataResult = await db.query(
    `SELECT
        m.id,
        m.title,
        (SELECT COUNT(*) FROM cards c WHERE c.movie_id = m.id AND c.audio_url IS NOT NULL) AS total_cards,
        (
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_card_progress ucp ON ucp.card_id = c.id AND ucp.user_id = $1
          LEFT JOIN user_movie_progress ump ON ump.movie_id = m.id AND ump.user_id = $1
          WHERE c.movie_id = m.id
            AND c.audio_url IS NOT NULL
            AND (
              (ucp.in_training_window = TRUE AND ucp.id IS NOT NULL)
              OR (ucp.in_training_window = FALSE AND ucp.next_review_at <= NOW())
              OR (
                ucp.id IS NULL
                AND c.position >= COALESCE(ump.window_start, 1)
                AND c.position < COALESCE(ump.window_start, 1) + COALESCE(ump.window_size, 10)
              )
            )
        ) AS cards_due
      FROM movies m
      ${whereClause}
      ORDER BY m.${sortColumn} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
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
        (SELECT COUNT(*) FROM cards WHERE movie_id = $2 AND audio_url IS NOT NULL) AS total_cards,
        (SELECT COUNT(*) FROM user_card_progress WHERE user_id = $1 AND card_id IN (SELECT id FROM cards WHERE movie_id = $2 AND audio_url IS NOT NULL)) AS cards_reviewed,
        (
          SELECT COUNT(*) FROM cards c
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
            )
        ) AS cards_due,
        (
          SELECT MIN(next_review_at) FROM user_card_progress
          WHERE user_id = $1 AND card_id IN (SELECT id FROM cards WHERE movie_id = $2)
            AND in_training_window = FALSE AND next_review_at > NOW()
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
