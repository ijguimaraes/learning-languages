const moviesResponse = '''
{
  "data": [
    {
      "id": "f1a2b3c4",
      "title": "Matrix",
      "practice": {
        "total_cards": 42,
        "cards_due": 5
      }
    },
    {
      "id": "d5e6f7g8",
      "title": "Interstellar",
      "practice": {
        "total_cards": 38,
        "cards_due": 0
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 2,
    "total_pages": 1
  }
}
''';

const movieDetailsResponse = '''
{
  "id": "f1a2b3c4",
  "title": "Matrix",
  "practice": {
    "total_cards": 42,
    "cards_due": 5,
    "cards_reviewed": 30,
    "next_review_at": "2025-03-21T09:00:00Z"
  }
}
''';

const movieDetailsNoDueResponse = '''
{
  "id": "d5e6f7g8",
  "title": "Interstellar",
  "practice": {
    "total_cards": 38,
    "cards_due": 0,
    "cards_reviewed": 38,
    "next_review_at": "2025-03-21T09:00:00Z"
  }
}
''';

const practiceNextResponse = '''
{
  "card": {
    "id": "card_7h8i9j0k",
    "movie_id": "f1a2b3c4",
    "audio_url": "http://localhost:8080/v1/audio/output.mp3",
    "value": "Do you think that's air you're breathing now?",
    "instruction": "Ouça o trecho e selecione a tradução correta.",
    "options": [
      { "id": "opt_a", "value": "Você acha que o ar que respira é real?" },
      { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
      { "id": "opt_c", "value": "Você tomou a pílula errada." },
      { "id": "opt_d", "value": "Eu sei que você está aqui, Neo." }
    ]
  }
}
''';

const practiceNextEmptyResponse = '''
{
  "card": null,
  "next_review_at": "2025-03-21T09:00:00Z",
  "message": "Nenhum card disponível no momento. Volte em breve para a próxima revisão."
}
''';

const reviewCorrectResponse = '''
{
  "card_id": "card_7h8i9j0k",
  "selected_option": { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
  "correct": true,
  "correct_option": { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
  "next_review_at": "2025-03-24T09:00:00Z",
  "practice_summary": {
    "cards_reviewed_today": 8,
    "cards_due": 4
  }
}
''';

const reviewIncorrectResponse = '''
{
  "card_id": "card_7h8i9j0k",
  "selected_option": { "id": "opt_c", "value": "Você tomou a pílula errada." },
  "correct": false,
  "correct_option": { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
  "next_review_at": "2025-03-21T09:00:00Z",
  "practice_summary": {
    "cards_reviewed_today": 9,
    "cards_due": 5
  }
}
''';

const errorUnauthorizedResponse = '''
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token ausente, inválido ou expirado."
  }
}
''';

const errorNotFoundResponse = '''
{
  "error": {
    "code": "MOVIE_NOT_FOUND",
    "message": "O filme informado não foi encontrado."
  }
}
''';
