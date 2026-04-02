const movies = [
  {
    id: 'f1a2b3c4',
    title: 'Matrix',
    practice: {
      total_cards: 42,
      cards_due: 5,
      cards_reviewed: 30,
      next_review_at: '2025-03-21T09:00:00Z',
    },
  },
  {
    id: 'd5e6f7g8',
    title: 'Interstellar',
    practice: {
      total_cards: 38,
      cards_due: 0,
      cards_reviewed: 38,
      next_review_at: '2025-03-21T09:00:00Z',
    },
  },
];

const cards = {
  f1a2b3c4: {
    id: 'card_7h8i9j0k',
    movie_id: 'f1a2b3c4',
    audio_url: 'http://192.168.1.19:3000/v1/audio/output.mp3',
    instruction: 'Ouça o trecho e selecione a tradução correta.',
    options: [
      { id: 'opt_a', value: 'Você acha que o ar que respira é real?' },
      { id: 'opt_b', value: 'Infelizmente, ninguém pode ser informado sobre o que é Matrix.' },
      { id: 'opt_c', value: 'Você tomou a pílula errada.' },
      { id: 'opt_d', value: 'Eu sei que você está aqui, Neo.' },
    ],
  },
  d5e6f7g8: null,
};

const correctOptionByCard = {
  card_7h8i9j0k: 'opt_b',
};

module.exports = { movies, cards, correctOptionByCard };
