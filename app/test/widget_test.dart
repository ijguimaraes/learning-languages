import 'package:flutter_test/flutter_test.dart';

import 'package:app/core/api_client.dart';
import 'package:app/main.dart';

void main() {
  testWidgets('App renders movie list screen', (WidgetTester tester) async {
    await tester.pumpWidget(MyApp(apiClient: ApiClient()));
    expect(find.text('Filmes'), findsOneWidget);
  });
}
