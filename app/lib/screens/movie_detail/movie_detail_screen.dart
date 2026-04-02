import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/api_exception.dart';
import '../../models/movie.dart';
import '../../widgets/error_display.dart';
import '../../widgets/loading_indicator.dart';
import '../practice/practice_screen.dart';

enum _ScreenState { loading, success, error }

class MovieDetailScreen extends StatefulWidget {
  final ApiClient apiClient;
  final String movieId;

  const MovieDetailScreen({
    super.key,
    required this.apiClient,
    required this.movieId,
  });

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  _ScreenState _state = _ScreenState.loading;
  Movie? _movie;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    setState(() => _state = _ScreenState.loading);
    try {
      final movie = await widget.apiClient.getMovieDetails(widget.movieId);
      setState(() {
        _movie = movie;
        _state = _ScreenState.success;
      });
    } on ApiException catch (e) {
      debugPrint('[MovieDetailScreen] ApiException: $e');
      setState(() {
        _errorMessage = e.toString();
        _state = _ScreenState.error;
      });
    } catch (e, stackTrace) {
      debugPrint('[MovieDetailScreen] Error: $e\n$stackTrace');
      setState(() {
        _errorMessage = 'Erro de conexão. Verifique sua rede.';
        _state = _ScreenState.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_movie?.title ?? 'Detalhes do Filme'),
      ),
      body: switch (_state) {
        _ScreenState.loading => const LoadingIndicator(),
        _ScreenState.error => ErrorDisplay(
            message: _errorMessage,
            onRetry: _loadDetails,
          ),
        _ScreenState.success => _buildDetails(),
      },
    );
  }

  Widget _buildDetails() {
    final movie = _movie!;
    final practice = movie.practice;
    final hasDue = practice.cardsDue > 0;

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            movie.title,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 24),
          _buildStatRow('Total de cards', '${practice.totalCards}'),
          if (practice.cardsReviewed != null)
            _buildStatRow('Cards revisados', '${practice.cardsReviewed}'),
          _buildStatRow('Cards pendentes', '${practice.cardsDue}'),
          if (practice.nextReviewAt != null)
            _buildStatRow('Próxima revisão', _formatDate(practice.nextReviewAt!)),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: hasDue
                  ? () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PracticeScreen(
                            apiClient: widget.apiClient,
                            movieId: widget.movieId,
                          ),
                        ),
                      );
                      _loadDetails();
                    }
                  : null,
              icon: const Icon(Icons.play_arrow),
              label: Text(hasDue ? 'Praticar' : 'Nenhum card pendente'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyLarge),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  String _formatDate(String isoDate) {
    final date = DateTime.tryParse(isoDate);
    if (date == null) return isoDate;
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
