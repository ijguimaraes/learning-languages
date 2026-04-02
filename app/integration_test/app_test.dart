import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:app/core/api_client.dart';
import 'package:app/main.dart';

/// Integration tests — requerem WireMock rodando em localhost:8080.
/// Executar: flutter test integration_test/app_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late ApiClient apiClient;

  setUp(() {
    apiClient = ApiClient(
      baseUrl: 'http://192.168.1.19:3000/v1',
      token: 'fake-token-for-wiremock',
    );
  });

  group('Fluxo completo', () {
    testWidgets('lista filmes, abre detalhes e inicia prática', (tester) async {
      await tester.pumpWidget(MyApp(apiClient: apiClient));
      await tester.pumpAndSettle();

      // Tela de lista: verifica filmes carregados
      expect(find.text('Filmes'), findsOneWidget);
      expect(find.text('Matrix'), findsOneWidget);
      expect(find.text('Interstellar'), findsOneWidget);
      expect(find.text('5 cards para praticar'), findsOneWidget);
      expect(find.text('Nenhum card pendente'), findsOneWidget);

      // Navega para detalhes do Matrix
      await tester.tap(find.text('Matrix'));
      await tester.pumpAndSettle();

      // Tela de detalhes
      expect(find.text('Total de cards'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
      expect(find.text('Cards revisados'), findsOneWidget);
      expect(find.text('30'), findsOneWidget);
      expect(find.text('Cards pendentes'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
      expect(find.text('Praticar'), findsOneWidget);

      // Inicia prática
      await tester.tap(find.text('Praticar'));
      await tester.pumpAndSettle();

      // Tela de prática: verifica card carregado
      expect(find.text('Prática'), findsOneWidget);
      expect(find.text('Ouça o trecho e selecione a tradução correta.'), findsOneWidget);
      expect(find.text('Ouvir áudio'), findsOneWidget);
      expect(find.text('Você acha que o ar que respira é real?'), findsOneWidget);
      expect(find.text('Infelizmente, ninguém pode ser informado sobre o que é Matrix.'), findsOneWidget);
      expect(find.text('Você tomou a pílula errada.'), findsOneWidget);
      expect(find.text('Eu sei que você está aqui, Neo.'), findsOneWidget);

      // Seleciona resposta (WireMock alterna: primeira é correta)
      await tester.tap(find.text(
        'Infelizmente, ninguém pode ser informado sobre o que é Matrix.',
      ));
      await tester.pumpAndSettle();

      // Verifica resultado
      expect(find.text('Correto!'), findsOneWidget);
      expect(find.text('Resposta correta:'), findsOneWidget);
      expect(find.text('Cards revisados hoje'), findsOneWidget);
      expect(find.text('Cards pendentes'), findsOneWidget);
      expect(find.text('Próximo card'), findsOneWidget);
      expect(find.text('Voltar ao filme'), findsOneWidget);

      // Clica em próximo card
      await tester.tap(find.text('Próximo card'));
      await tester.pumpAndSettle();

      // Volta para exibição do card
      expect(find.text('Ouça o trecho e selecione a tradução correta.'), findsOneWidget);

      // Seleciona resposta (WireMock alterna: segunda é incorreta)
      await tester.tap(find.text('Você tomou a pílula errada.'));
      await tester.pumpAndSettle();

      expect(find.text('Incorreto'), findsOneWidget);
      expect(find.text('Resposta correta:'), findsOneWidget);

      // Volta ao filme
      await tester.tap(find.text('Voltar ao filme'));
      await tester.pumpAndSettle();

      // Verifica que voltou para detalhes
      expect(find.text('Total de cards'), findsOneWidget);
    });

    testWidgets('filme sem cards pendentes mostra estado vazio na prática', (tester) async {
      await tester.pumpWidget(MyApp(apiClient: apiClient));
      await tester.pumpAndSettle();

      // Navega para Interstellar
      await tester.tap(find.text('Interstellar'));
      await tester.pumpAndSettle();

      // Botão Praticar desabilitado — texto "Praticar" não aparece, só "Nenhum card pendente"
      expect(find.text('Nenhum card pendente'), findsAtLeast(1));
      expect(find.text('Praticar'), findsNothing);
    });
  });
}
