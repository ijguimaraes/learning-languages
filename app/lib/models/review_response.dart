import 'practice_card.dart';

class PracticeSummary {
  final int cardsReviewedToday;
  final int cardsDue;

  PracticeSummary({
    required this.cardsReviewedToday,
    required this.cardsDue,
  });

  factory PracticeSummary.fromJson(Map<String, dynamic> json) {
    return PracticeSummary(
      cardsReviewedToday: json['cards_reviewed_today'] as int,
      cardsDue: json['cards_due'] as int,
    );
  }
}

class ReviewResponse {
  final String cardId;
  final Option selectedOption;
  final bool correct;
  final Option correctOption;
  final String nextReviewAt;
  final PracticeSummary practiceSummary;

  ReviewResponse({
    required this.cardId,
    required this.selectedOption,
    required this.correct,
    required this.correctOption,
    required this.nextReviewAt,
    required this.practiceSummary,
  });

  factory ReviewResponse.fromJson(Map<String, dynamic> json) {
    return ReviewResponse(
      cardId: json['card_id'] as String,
      selectedOption: Option.fromJson(json['selected_option'] as Map<String, dynamic>),
      correct: json['correct'] as bool,
      correctOption: Option.fromJson(json['correct_option'] as Map<String, dynamic>),
      nextReviewAt: json['next_review_at'] as String,
      practiceSummary: PracticeSummary.fromJson(json['practice_summary'] as Map<String, dynamic>),
    );
  }
}
