const { selectNextCard } = require('../services/card-selector');
const { updateTrainingMaturity, checkWindowAdvancement } = require('../services/training-window');
const { updateSpacedRepetition } = require('../services/spaced-repetition');
const { getCardByIdAndMovie, getCorrectOption, getOptionById } = require('../db/queries/cards');
const { getOrCreateCardProgress, saveCardProgress } = require('../db/queries/progress');
const { insertReview, countReviewsToday, countCardsDue } = require('../db/queries/reviews');

async function practiceRoutes(fastify) {
  fastify.get('/v1/movies/:movie_id/practice/next', async (request, reply) => {
    const { movie_id } = request.params;
    const { id: userId, native_language } = request.user;

    // Verify movie exists
    const movieCheck = await fastify.db.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
    if (movieCheck.rows.length === 0) {
      reply.code(404).send({
        error: {
          code: 'MOVIE_NOT_FOUND',
          message: 'O filme informado não foi encontrado.',
        },
      });
      return;
    }

    const result = await selectNextCard(fastify.db, userId, movie_id, native_language);

    if (result.card) {
      result.card.movie_id = movie_id;
    }

    return result;
  });

  fastify.post('/v1/movies/:movie_id/practice/cards/:card_id/review', async (request, reply) => {
    const { movie_id, card_id } = request.params;
    const { id: userId, native_language } = request.user;

    // Validate card belongs to movie
    const card = await getCardByIdAndMovie(fastify.db, card_id, movie_id);
    if (!card) {
      reply.code(404).send({
        error: {
          code: 'CARD_NOT_FOUND',
          message: 'O card informado não existe ou não pertence a este filme.',
          details: { card_id, movie_id },
        },
      });
      return;
    }

    const { selected_option_id, response_time_ms } = request.body || {};

    if (!selected_option_id) {
      reply.code(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Parâmetros inválidos ou ausentes na requisição.',
          details: { field: 'selected_option_id', reason: 'Campo obrigatório não informado.' },
        },
      });
      return;
    }

    const responseTimeMs = parseInt(response_time_ms) || 5000;

    // Determine correctness
    const correctOption = await getCorrectOption(fastify.db, card_id, native_language);
    const selectedOption = await getOptionById(fastify.db, selected_option_id);
    const isCorrect = selected_option_id === correctOption?.id;

    // Insert immutable review log
    await insertReview(fastify.db, {
      userId,
      cardId: card_id,
      selectedOptionId: selected_option_id,
      correct: isCorrect,
      responseTimeMs,
    });

    // Get or create card progress, then update
    const progress = await getOrCreateCardProgress(fastify.db, userId, card_id);

    if (progress.in_training_window) {
      updateTrainingMaturity(progress, isCorrect, responseTimeMs);
      await saveCardProgress(fastify.db, progress);
      await checkWindowAdvancement(fastify.db, userId, movie_id);
    } else {
      updateSpacedRepetition(progress, isCorrect, responseTimeMs);
      await saveCardProgress(fastify.db, progress);
    }

    // Compute summary
    const cardsReviewedToday = await countReviewsToday(fastify.db, userId, movie_id);
    const cardsDue = await countCardsDue(fastify.db, userId, movie_id);

    return {
      card_id,
      selected_option: selectedOption ? { id: selectedOption.id, value: selectedOption.value } : { id: selected_option_id, value: '' },
      correct: isCorrect,
      correct_option: correctOption ? { id: correctOption.id, value: correctOption.value } : null,
      next_review_at: progress.next_review_at,
      practice_summary: {
        cards_reviewed_today: cardsReviewedToday,
        cards_due: cardsDue,
      },
    };
  });
}

module.exports = practiceRoutes;
