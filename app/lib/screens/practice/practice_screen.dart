import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/api_exception.dart';
import '../../models/practice_card.dart';
import '../../models/practice_next_response.dart';
import '../../models/review_response.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_display.dart';
import '../../widgets/loading_indicator.dart';

enum _PracticeState { loading, card, empty, submitting, reviewed, error }

class PracticeScreen extends StatefulWidget {
  final ApiClient apiClient;
  final String movieId;

  const PracticeScreen({
    super.key,
    required this.apiClient,
    required this.movieId,
  });

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  _PracticeState _state = _PracticeState.loading;
  PracticeCard? _card;
  PracticeNextResponse? _emptyResponse;
  ReviewResponse? _reviewResult;
  String _errorMessage = '';

  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  DateTime? _audioEndedAt;

  @override
  void initState() {
    super.initState();
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        final playing = state == PlayerState.playing;
        if (!playing && _isPlaying) {
          _audioEndedAt = DateTime.now();
        }
        setState(() => _isPlaying = playing);
      }
    });
    _loadNextCard();
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _playAudio() async {
    try {
      if (_isPlaying) {
        await _audioPlayer.stop();
      } else {
        await _audioPlayer.play(UrlSource(_card!.audioUrl));
      }
    } catch (e) {
      debugPrint('[PracticeScreen] Audio error: $e');
    }
  }

  Future<void> _loadNextCard() async {
    _audioEndedAt = null;
    setState(() => _state = _PracticeState.loading);
    try {
      final response =
          await widget.apiClient.getNextPracticeCard(widget.movieId);
      setState(() {
        if (response.card != null) {
          _card = response.card;
          _state = _PracticeState.card;
        } else {
          _emptyResponse = response;
          _state = _PracticeState.empty;
        }
      });
    } on ApiException catch (e) {
      debugPrint('[PracticeScreen] ApiException: $e');
      setState(() {
        _errorMessage = e.toString();
        _state = _PracticeState.error;
      });
    } catch (e, stackTrace) {
      debugPrint('[PracticeScreen] NextCard error: $e\n$stackTrace');
      setState(() {
        _errorMessage = 'Erro de conexão. Verifique sua rede.';
        _state = _PracticeState.error;
      });
    }
  }

  Future<void> _submitAnswer(String optionId) async {
    final now = DateTime.now();
    int? responseTimeMs;
    if (_audioEndedAt != null) {
      responseTimeMs = now.difference(_audioEndedAt!).inMilliseconds;
    }

    setState(() => _state = _PracticeState.submitting);
    try {
      final result = await widget.apiClient.submitReview(
        widget.movieId,
        _card!.id,
        optionId,
        responseTimeMs: responseTimeMs,
      );
      setState(() {
        _reviewResult = result;
        _state = _PracticeState.reviewed;
      });
    } on ApiException catch (e) {
      debugPrint('[PracticeScreen] Review ApiException: $e');
      setState(() {
        _errorMessage = e.toString();
        _state = _PracticeState.error;
      });
    } catch (e, stackTrace) {
      debugPrint('[PracticeScreen] Review error: $e\n$stackTrace');
      setState(() {
        _errorMessage = 'Erro de conexão. Verifique sua rede.';
        _state = _PracticeState.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Prática')),
      body: switch (_state) {
        _PracticeState.loading || _PracticeState.submitting =>
          const LoadingIndicator(),
        _PracticeState.error => ErrorDisplay(
            message: _errorMessage,
            onRetry: _loadNextCard,
          ),
        _PracticeState.empty => _buildEmpty(),
        _PracticeState.card => _buildCard(),
        _PracticeState.reviewed => _buildResult(),
      },
    );
  }

  Widget _buildEmpty() {
    return Column(
      children: [
        Expanded(
          child: EmptyState(
            message: _emptyResponse?.message ??
                'Nenhum card disponível no momento.',
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Voltar'),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCard() {
    final card = _card!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            card.instruction,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 24),
          Card(
            child: ListTile(
              leading: Icon(
                _isPlaying ? Icons.stop_circle : Icons.play_circle_fill,
                size: 40,
                color: Theme.of(context).colorScheme.primary,
              ),
              title: Text(_isPlaying ? 'Parar áudio' : 'Ouvir áudio'),
              onTap: _playAudio,
            ),
          ),
          const SizedBox(height: 24),
          ...card.options.map(
            (option) => Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _submitAnswer(option.id),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                    alignment: Alignment.centerLeft,
                  ),
                  child: Text(option.value),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult() {
    final result = _reviewResult!;
    final isCorrect = result.correct;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          Icon(
            isCorrect ? Icons.check_circle : Icons.cancel,
            size: 80,
            color: isCorrect ? Colors.green : Colors.red,
          ),
          const SizedBox(height: 16),
          Text(
            isCorrect ? 'Correto!' : 'Incorreto',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: isCorrect ? Colors.green : Colors.red,
                ),
          ),
          const SizedBox(height: 24),
          Card(
            color: Colors.green[50],
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Resposta correta:',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(result.correctOption.value),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Cards revisados hoje'),
                      Text(
                        '${result.practiceSummary.cardsReviewedToday}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Cards pendentes'),
                      Text(
                        '${result.practiceSummary.cardsDue}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _loadNextCard,
              icon: const Icon(Icons.arrow_forward),
              label: const Text('Próximo card'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Voltar ao filme'),
            ),
          ),
        ],
      ),
    );
  }
}
