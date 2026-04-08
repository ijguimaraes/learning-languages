import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeAudioPlayer extends Fake implements AudioPlayer {
  final _stateController = StreamController<PlayerState>.broadcast();
  String? lastPlayedUrl;
  int playCount = 0;

  @override
  Stream<PlayerState> get onPlayerStateChanged => _stateController.stream;

  @override
  Future<void> play(
    Source source, {
    double? volume,
    double? balance,
    AudioContext? ctx,
    Duration? position,
    PlayerMode? mode,
  }) async {
    playCount++;
    if (source is UrlSource) {
      lastPlayedUrl = source.url;
    }
    _stateController.add(PlayerState.playing);
  }

  @override
  Future<void> stop() async {
    _stateController.add(PlayerState.stopped);
  }

  @override
  Future<void> dispose() async {
    await _stateController.close();
  }

  void simulateAudioEnd() {
    _stateController.add(PlayerState.completed);
  }
}
