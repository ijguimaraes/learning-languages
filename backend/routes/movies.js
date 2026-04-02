const { movies } = require('../data/movies');

async function moviesRoutes(fastify) {
  fastify.get('/v1/movies', async (request, reply) => {
    const page = parseInt(request.query.page) || 1;
    const limit = Math.min(parseInt(request.query.limit) || 20, 100);
    const genre = request.query.genre;
    const search = request.query.search;
    const sort = request.query.sort || 'title';
    const order = request.query.order || 'asc';

    let filtered = [...movies];

    if (search) {
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const cmp = a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0;
      return order === 'desc' ? -cmp : cmp;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const data = paginated.map((m) => ({
      id: m.id,
      title: m.title,
      practice: {
        total_cards: m.practice.total_cards,
        cards_due: m.practice.cards_due,
      },
    }));

    return {
      data,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
      },
    };
  });

  fastify.get('/v1/movies/:movie_id', async (request, reply) => {
    const movie = movies.find((m) => m.id === request.params.movie_id);

    if (!movie) {
      reply.code(404).send({
        error: {
          code: 'MOVIE_NOT_FOUND',
          message: 'O filme informado não foi encontrado.',
        },
      });
      return;
    }

    return {
      id: movie.id,
      title: movie.title,
      practice: movie.practice,
    };
  });
}

module.exports = moviesRoutes;
