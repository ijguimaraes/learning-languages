const { movies, cards, correctOptionByCard } = require('../data/movies');

// Estado para alternar entre correto e incorreto
let reviewCallCount = 0;

async function practiceRoutes(fastify) {
  fastify.get('/v1/movies/:movie_id/practice/next', async (request, reply) => {
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

    const card = cards[movie.id];

    if (!card) {
      return {
        card: null,
        next_review_at: movie.practice.next_review_at,
        message: 'Nenhum card disponível no momento. Volte em breve para a próxima revisão.',
      };
    }

    return { card };
  });

  fastify.post('/v1/movies/:movie_id/practice/cards/:card_id/review', async (request, reply) => {
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

    const card = cards[movie.id];

    if (!card || card.id !== request.params.card_id) {
      reply.code(404).send({
        error: {
          code: 'CARD_NOT_FOUND',
          message: 'O card informado não existe ou não pertence a este filme.',
          details: {
            card_id: request.params.card_id,
            movie_id: request.params.movie_id,
          },
        },
      });
      return;
    }

    const { selected_option_id } = request.body || {};

    if (!selected_option_id) {
      reply.code(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Parâmetros inválidos ou ausentes na requisição.',
          details: {
            field: 'selected_option_id',
            reason: 'Campo obrigatório não informado.',
          },
        },
      });
      return;
    }

    const correctOptionId = correctOptionByCard[card.id];
    const selectedOption = card.options.find((o) => o.id === selected_option_id);
    const correctOption = card.options.find((o) => o.id === correctOptionId);

    // Alterna entre correto e incorreto a cada chamada
    reviewCallCount++;
    const isCorrect = reviewCallCount % 2 === 1;

    if (isCorrect) {
      return {
        card_id: card.id,
        selected_option: correctOption,
        correct: true,
        correct_option: correctOption,
        next_review_at: '2025-03-24T09:00:00Z',
        practice_summary: {
          cards_reviewed_today: 8,
          cards_due: 4,
        },
      };
    }

    return {
      card_id: card.id,
      selected_option: selectedOption || { id: selected_option_id, value: 'Opção selecionada' },
      correct: false,
      correct_option: correctOption,
      next_review_at: '2025-03-21T09:00:00Z',
      practice_summary: {
        cards_reviewed_today: 9,
        cards_due: 5,
      },
    };
  });
}

module.exports = practiceRoutes;
