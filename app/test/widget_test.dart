import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'package:app/core/api_client.dart';
import 'package:app/screens/movie_list/movie_list_screen.dart';
import 'package:app/screens/movie_detail/movie_detail_screen.dart';
import 'package:app/screens/practice/practice_screen.dart';

import 'helpers/mock_http_client.dart';
import 'helpers/mock_responses.dart';

Widget buildTestApp(Widget child) {
  return MaterialApp(home: child);
}

ApiClient buildApiClient(http.Client client) {
  return ApiClient(client: client, baseUrl: 'http://test', token: 'test-token');
}

void main() {
  group('MovieListScreen', () {
    testWidgets('exibe lista de filmes com cards pendentes', (tester) async {
      final client = createMockClient({
        'GET /movies': (_) async => jsonResponse(moviesResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieListScreen(apiClient: apiClient),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Filmes'), findsOneWidget);
      expect(find.text('Matrix'), findsOneWidget);
      expect(find.text('Interstellar'), findsOneWidget);
      expect(find.text('5 cards para praticar'), findsOneWidget);
      expect(find.text('Nenhum card pendente'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
      expect(find.text('0'), findsOneWidget);
    });

    testWidgets('exibe erro e permite retry', (tester) async {
      int callCount = 0;
      final client = createMockClient({
        'GET /movies': (_) async {
          callCount++;
          if (callCount == 1) {
            throw Exception('Connection refused');
          }
          return jsonResponse(moviesResponse);
        },
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieListScreen(apiClient: apiClient),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Erro de conexão. Verifique sua rede.'), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);

      await tester.tap(find.text('Tentar novamente'));
      await tester.pumpAndSettle();

      expect(find.text('Matrix'), findsOneWidget);
    });

    testWidgets('exibe mensagem da API em erro HTTP', (tester) async {
      final client = createMockClient({
        'GET /movies': (_) async => jsonResponse(errorUnauthorizedResponse, statusCode: 401),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieListScreen(apiClient: apiClient),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Token ausente, inválido ou expirado.'), findsOneWidget);
    });

    testWidgets('navega para detalhes ao tocar em filme', (tester) async {
      final client = createMockClient({
        'GET /movies': (_) async => jsonResponse(moviesResponse),
        'GET /movies/f1a2b3c4': (_) async => jsonResponse(movieDetailsResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieListScreen(apiClient: apiClient),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Matrix'));
      await tester.pumpAndSettle();

      expect(find.text('Total de cards'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
    });
  });

  group('MovieDetailScreen', () {
    testWidgets('exibe detalhes do filme com estatísticas', (tester) async {
      final client = createMockClient({
        'GET /movies/f1a2b3c4': (_) async => jsonResponse(movieDetailsResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieDetailScreen(apiClient: apiClient, movieId: 'f1a2b3c4'),
      ));
      await tester.pumpAndSettle();

      // "Matrix" aparece no AppBar e no body
      expect(find.text('Matrix'), findsAtLeast(1));
      expect(find.text('Total de cards'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
      expect(find.text('Cards revisados'), findsOneWidget);
      expect(find.text('30'), findsOneWidget);
      expect(find.text('Cards pendentes'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
      expect(find.text('Praticar'), findsOneWidget);
    });

    testWidgets('botão Praticar desabilitado quando sem cards pendentes', (tester) async {
      final client = createMockClient({
        'GET /movies/d5e6f7g8': (_) async => jsonResponse(movieDetailsNoDueResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieDetailScreen(apiClient: apiClient, movieId: 'd5e6f7g8'),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Interstellar'), findsAtLeast(1));
      expect(find.text('Nenhum card pendente'), findsOneWidget);

      // Verifica que o botão Praticar não aparece (só Nenhum card pendente)
      expect(find.text('Praticar'), findsNothing);
    });

    testWidgets('exibe erro ao falhar carregamento', (tester) async {
      final client = createMockClient({
        'GET /movies/unknown': (_) async =>
            jsonResponse(errorNotFoundResponse, statusCode: 404),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        MovieDetailScreen(apiClient: apiClient, movieId: 'unknown'),
      ));
      await tester.pumpAndSettle();

      expect(find.text('O filme informado não foi encontrado.'), findsOneWidget);
    });
  });

  group('PracticeScreen', () {
    testWidgets('exibe card com instrução e opções', (tester) async {
      final client = createMockClient({
        'GET /movies/f1a2b3c4/practice/next': (_) async =>
            jsonResponse(practiceNextResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        PracticeScreen(apiClient: apiClient, movieId: 'f1a2b3c4'),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Prática'), findsOneWidget);
      expect(find.text('Ouça o trecho e selecione a tradução correta.'), findsOneWidget);
      expect(find.text('Ouvir áudio'), findsOneWidget);
      expect(find.text('Você acha que o ar que respira é real?'), findsOneWidget);
      expect(find.text('Infelizmente, ninguém pode ser informado sobre o que é Matrix.'), findsOneWidget);
      expect(find.text('Você tomou a pílula errada.'), findsOneWidget);
      expect(find.text('Eu sei que você está aqui, Neo.'), findsOneWidget);
    });

    testWidgets('exibe estado vazio quando nenhum card disponível', (tester) async {
      final client = createMockClient({
        'GET /movies/d5e6f7g8/practice/next': (_) async =>
            jsonResponse(practiceNextEmptyResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        PracticeScreen(apiClient: apiClient, movieId: 'd5e6f7g8'),
      ));
      await tester.pumpAndSettle();

      expect(
        find.text('Nenhum card disponível no momento. Volte em breve para a próxima revisão.'),
        findsOneWidget,
      );
      expect(find.text('Voltar'), findsOneWidget);
    });

    testWidgets('exibe resultado correto após selecionar opção', (tester) async {
      final client = createMockClient({
        'GET /movies/f1a2b3c4/practice/next': (_) async =>
            jsonResponse(practiceNextResponse),
        'POST /movies/f1a2b3c4/practice/cards/card_7h8i9j0k/review': (_) async =>
            jsonResponse(reviewCorrectResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        PracticeScreen(apiClient: apiClient, movieId: 'f1a2b3c4'),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text(
        'Infelizmente, ninguém pode ser informado sobre o que é Matrix.',
      ));
      await tester.pumpAndSettle();

      expect(find.text('Correto!'), findsOneWidget);
      expect(find.text('Resposta correta:'), findsOneWidget);
      expect(find.text('8'), findsOneWidget);
      expect(find.text('4'), findsOneWidget);
      expect(find.text('Próximo card'), findsOneWidget);
      expect(find.text('Voltar ao filme'), findsOneWidget);
    });

    testWidgets('exibe resultado incorreto após selecionar opção errada', (tester) async {
      final client = createMockClient({
        'GET /movies/f1a2b3c4/practice/next': (_) async =>
            jsonResponse(practiceNextResponse),
        'POST /movies/f1a2b3c4/practice/cards/card_7h8i9j0k/review': (_) async =>
            jsonResponse(reviewIncorrectResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        PracticeScreen(apiClient: apiClient, movieId: 'f1a2b3c4'),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Você tomou a pílula errada.'));
      await tester.pumpAndSettle();

      expect(find.text('Incorreto'), findsOneWidget);
      expect(find.text('Resposta correta:'), findsOneWidget);
      expect(
        find.text('Infelizmente, ninguém pode ser informado sobre o que é Matrix.'),
        findsOneWidget,
      );
      expect(find.text('9'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
    });

    testWidgets('botão Próximo card carrega novo card', (tester) async {
      final client = createMockClient({
        'GET /movies/f1a2b3c4/practice/next': (_) async =>
            jsonResponse(practiceNextResponse),
        'POST /movies/f1a2b3c4/practice/cards/card_7h8i9j0k/review': (_) async =>
            jsonResponse(reviewCorrectResponse),
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        PracticeScreen(apiClient: apiClient, movieId: 'f1a2b3c4'),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text(
        'Infelizmente, ninguém pode ser informado sobre o que é Matrix.',
      ));
      await tester.pumpAndSettle();

      expect(find.text('Correto!'), findsOneWidget);

      await tester.tap(find.text('Próximo card'));
      await tester.pumpAndSettle();

      expect(find.text('Ouça o trecho e selecione a tradução correta.'), findsOneWidget);
    });

    testWidgets('exibe erro quando API falha na prática', (tester) async {
      final client = createMockClient({
        'GET /movies/f1a2b3c4/practice/next': (_) async {
          throw Exception('Connection refused');
        },
      });
      final apiClient = buildApiClient(client);

      await tester.pumpWidget(buildTestApp(
        PracticeScreen(apiClient: apiClient, movieId: 'f1a2b3c4'),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Erro de conexão. Verifique sua rede.'), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);
    });
  });
}
