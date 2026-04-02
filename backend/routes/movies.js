const { listMovies, getMovieById } = require('../db/queries/movies');

async function moviesRoutes(fastify) {
  fastify.get('/v1/movies', async (request, reply) => {
    const page = parseInt(request.query.page) || 1;
    const limit = Math.min(parseInt(request.query.limit) || 20, 100);
    const genre = request.query.genre || undefined;
    const search = request.query.search || undefined;
    const sort = request.query.sort || 'title';
    const order = request.query.order || 'asc';

    return listMovies(fastify.db, request.user.id, { page, limit, genre, search, sort, order });
  });

  fastify.get('/v1/movies/:movie_id', async (request, reply) => {
    const movie = await getMovieById(fastify.db, request.user.id, request.params.movie_id);

    if (!movie) {
      reply.code(404).send({
        error: {
          code: 'MOVIE_NOT_FOUND',
          message: 'O filme informado não foi encontrado.',
        },
      });
      return;
    }

    return movie;
  });
}

module.exports = moviesRoutes;
