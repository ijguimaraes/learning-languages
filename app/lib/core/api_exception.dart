import '../models/api_error.dart';

class ApiException implements Exception {
  final int statusCode;
  final ApiError? error;

  ApiException({required this.statusCode, this.error});

  @override
  String toString() {
    if (error != null) {
      return error!.message;
    }
    return 'Erro inesperado (HTTP $statusCode)';
  }
}
