class Option {
  final String id;
  final String value;

  Option({
    required this.id,
    required this.value,
  });

  factory Option.fromJson(Map<String, dynamic> json) {
    return Option(
      id: json['id'] as String,
      value: json['value'] as String,
    );
  }
}

class PracticeCard {
  final String id;
  final String movieId;
  final String audioUrl;
  final String value;
  final String instruction;
  final List<Option> options;

  PracticeCard({
    required this.id,
    required this.movieId,
    required this.audioUrl,
    required this.value,
    required this.instruction,
    required this.options,
  });

  factory PracticeCard.fromJson(Map<String, dynamic> json) {
    return PracticeCard(
      id: json['id'] as String,
      movieId: json['movie_id'] as String,
      audioUrl: json['audio_url'] as String,
      value: json['value'] as String,
      instruction: json['instruction'] as String,
      options: (json['options'] as List<dynamic>)
          .map((o) => Option.fromJson(o as Map<String, dynamic>))
          .toList(),
    );
  }
}
