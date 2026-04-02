import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/api_exception.dart';
import '../../models/movie.dart';
import '../../widgets/error_display.dart';
import '../../widgets/loading_indicator.dart';
import '../movie_detail/movie_detail_screen.dart';

enum _ScreenState { loading, success, error }

class MovieListScreen extends StatefulWidget {
  final ApiClient apiClient;

  const MovieListScreen({super.key, required this.apiClient});

  @override
  State<MovieListScreen> createState() => _MovieListScreenState();
}

class _MovieListScreenState extends State<MovieListScreen> {
  _ScreenState _state = _ScreenState.loading;
  List<Movie> _movies = [];
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadMovies();
  }

  Future<void> _loadMovies() async {
    setState(() => _state = _ScreenState.loading);
    try {
      final (movies, _) = await widget.apiClient.getMovies();
      setState(() {
        _movies = movies;
        _state = _ScreenState.success;
      });
    } on ApiException catch (e) {
      debugPrint('[MovieListScreen] ApiException: $e');
      setState(() {
        _errorMessage = e.toString();
        _state = _ScreenState.error;
      });
    } catch (e, stackTrace) {
      debugPrint('[MovieListScreen] Error: $e\n$stackTrace');
      setState(() {
        _errorMessage = 'Erro de conexão. Verifique sua rede.';
        _state = _ScreenState.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Filmes')),
      body: switch (_state) {
        _ScreenState.loading => const LoadingIndicator(),
        _ScreenState.error => ErrorDisplay(
            message: _errorMessage,
            onRetry: _loadMovies,
          ),
        _ScreenState.success => RefreshIndicator(
            onRefresh: _loadMovies,
            child: ListView.builder(
              itemCount: _movies.length,
              itemBuilder: (context, index) {
                final movie = _movies[index];
                final hasDue = movie.practice.cardsDue > 0;

                return ListTile(
                  title: Text(movie.title),
                  subtitle: Text(
                    hasDue
                        ? '${movie.practice.cardsDue} cards para praticar'
                        : 'Nenhum card pendente',
                  ),
                  trailing: CircleAvatar(
                    radius: 16,
                    backgroundColor: hasDue ? Colors.green : Colors.grey[300],
                    child: Text(
                      '${movie.practice.cardsDue}',
                      style: TextStyle(
                        fontSize: 12,
                        color: hasDue ? Colors.white : Colors.grey[600],
                      ),
                    ),
                  ),
                  onTap: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MovieDetailScreen(
                          apiClient: widget.apiClient,
                          movieId: movie.id,
                        ),
                      ),
                    );
                    _loadMovies();
                  },
                );
              },
            ),
          ),
      },
    );
  }
}
