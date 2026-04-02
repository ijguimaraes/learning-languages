import 'practice_card.dart';

class PracticeNextResponse {
  final PracticeCard? card;
  final String? nextReviewAt;
  final String? message;

  PracticeNextResponse({
    this.card,
    this.nextReviewAt,
    this.message,
  });

  factory PracticeNextResponse.fromJson(Map<String, dynamic> json) {
    return PracticeNextResponse(
      card: json['card'] != null
          ? PracticeCard.fromJson(json['card'] as Map<String, dynamic>)
          : null,
      nextReviewAt: json['next_review_at'] as String?,
      message: json['message'] as String?,
    );
  }
}
