import 'dart:convert';
import 'package:flutter/foundation.dart';

import 'package:http/http.dart' as http;

import '../models/api_error.dart';
import '../models/movie.dart';
import '../models/pagination.dart';
import '../models/practice_next_response.dart';
import '../models/review_response.dart';
import 'api_exception.dart';
import 'constants.dart' as constants;

class ApiClient {
  final http.Client _client;
  final String _baseUrl;
  final String _token;

  ApiClient({
    http.Client? client,
    String? baseUrl,
    String? token,
  })  : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? constants.baseUrl,
        _token = token ?? constants.bearerToken;

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      };

  void _log(String message) {
    debugPrint('[ApiClient] $message');
  }

  Map<String, dynamic> _handleResponse(http.Response response, Uri uri) {
    _log('[${response.statusCode}] $uri');

    if (response.body.isEmpty) {
      _log('Response body is empty');
      throw ApiException(statusCode: response.statusCode);
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    ApiError? apiError;
    if (body.containsKey('error')) {
      apiError = ApiError.fromJson(body['error'] as Map<String, dynamic>);
    }

    _log('API error: ${apiError?.code} — ${apiError?.message}');
    throw ApiException(statusCode: response.statusCode, error: apiError);
  }

  Future<(List<Movie>, Pagination)> getMovies({
    int page = 1,
    int limit = 20,
  }) async {
    final uri = Uri.parse('$_baseUrl/movies').replace(
      queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );

    _log('GET $uri');
    final response = await _client.get(uri, headers: _headers);
    final body = _handleResponse(response, uri);

    final movies = (body['data'] as List<dynamic>)
        .map((m) => Movie.fromJson(m as Map<String, dynamic>))
        .toList();
    final pagination =
        Pagination.fromJson(body['pagination'] as Map<String, dynamic>);

    _log('getMovies: ${movies.length} movies loaded');
    return (movies, pagination);
  }

  Future<Movie> getMovieDetails(String movieId) async {
    final uri = Uri.parse('$_baseUrl/movies/$movieId');
    _log('GET $uri');
    final response = await _client.get(uri, headers: _headers);
    final body = _handleResponse(response, uri);
    return Movie.fromJson(body);
  }

  Future<PracticeNextResponse> getNextPracticeCard(String movieId) async {
    final uri = Uri.parse('$_baseUrl/movies/$movieId/practice/next');
    _log('GET $uri');
    final response = await _client.get(uri, headers: _headers);
    final body = _handleResponse(response, uri);
    final result = PracticeNextResponse.fromJson(body);
    _log('getNextPracticeCard: card=${result.card != null ? result.card!.id : 'null'}');
    return result;
  }

  Future<ReviewResponse> submitReview(
    String movieId,
    String cardId,
    String selectedOptionId, {
    int? responseTimeMs,
  }) async {
    final uri =
        Uri.parse('$_baseUrl/movies/$movieId/practice/cards/$cardId/review');
    final bodyMap = <String, dynamic>{
      'selected_option_id': selectedOptionId,
    };
    if (responseTimeMs != null) {
      bodyMap['response_time_ms'] = responseTimeMs;
    }
    _log('POST $uri body=$bodyMap');
    final response = await _client.post(
      uri,
      headers: _headers,
      body: jsonEncode(bodyMap),
    );
    final body = _handleResponse(response, uri);
    final result = ReviewResponse.fromJson(body);
    _log('submitReview: correct=${result.correct}');
    return result;
  }
}
