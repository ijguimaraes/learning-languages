class MoviePractice {
  final int totalCards;
  final int cardsDue;
  final int? cardsReviewed;
  final String? nextReviewAt;

  MoviePractice({
    required this.totalCards,
    required this.cardsDue,
    this.cardsReviewed,
    this.nextReviewAt,
  });

  factory MoviePractice.fromJson(Map<String, dynamic> json) {
    return MoviePractice(
      totalCards: json['total_cards'] as int,
      cardsDue: json['cards_due'] as int,
      cardsReviewed: json['cards_reviewed'] as int?,
      nextReviewAt: json['next_review_at'] as String?,
    );
  }
}

class Movie {
  final String id;
  final String title;
  final MoviePractice practice;

  Movie({
    required this.id,
    required this.title,
    required this.practice,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'] as String,
      title: json['title'] as String,
      practice: MoviePractice.fromJson(json['practice'] as Map<String, dynamic>),
    );
  }
}
