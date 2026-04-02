import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

typedef RequestHandler = Future<http.Response> Function(http.Request request);

http.Client createMockClient(Map<String, RequestHandler> handlers) {
  return MockClient((request) async {
    final method = request.method;
    final path = request.url.path;

    for (final entry in handlers.entries) {
      final parts = entry.key.split(' ');
      final expectedMethod = parts[0];
      final expectedPath = parts[1];

      if (method == expectedMethod && path.endsWith(expectedPath)) {
        return entry.value(request);
      }
    }

    return http.Response(
      jsonEncode({
        'error': {'code': 'NOT_FOUND', 'message': 'Endpoint não encontrado'}
      }),
      404,
    );
  });
}

http.Response jsonResponse(String body, {int statusCode = 200}) {
  return http.Response(
    body,
    statusCode,
    headers: {'content-type': 'application/json'},
  );
}
