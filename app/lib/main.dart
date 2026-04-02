import 'package:flutter/material.dart';

import 'core/api_client.dart';
import 'screens/movie_list/movie_list_screen.dart';

void main() {
  final apiClient = ApiClient();

  runApp(MyApp(apiClient: apiClient));
}

class MyApp extends StatelessWidget {
  final ApiClient apiClient;

  const MyApp({super.key, required this.apiClient});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aprenda com Filmes',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.green,
        useMaterial3: true,
      ),
      home: MovieListScreen(apiClient: apiClient),
    );
  }
}
