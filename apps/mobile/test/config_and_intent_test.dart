import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/api.dart';
import 'package:mobile/config.dart';

void main() {
  test('public backend config maps only emulator auth transport', () async {
    final original = {'auth_mode': 'supabase', 'supabase_url': 'http://127.0.0.1:56321', 'supabase_anon_key': 'public-key'};
    final client = MockClient((request) async {
      expect(request.url.path, '/v1/config');
      expect(request.headers.containsKey('Authorization'), isFalse);
      return http.Response(jsonEncode(original), 200);
    });
    final config = await loadAuthConfiguration(client: client, endpoint: 'http://10.0.2.2:8000', androidEmulator: true);
    expect(config.url, 'http://10.0.2.2:56321');
    expect(config.key, 'public-key');
    expect(original['supabase_url'], 'http://127.0.0.1:56321');
    final hosted = AuthConfiguration.fromConfig({'auth_mode': 'supabase', 'supabase_url': 'https://project.supabase.co', 'supabase_anon_key': 'public-key'},
        apiEndpoint: 'http://10.0.2.2:8000', androidEmulator: true);
    expect(hosted.url, 'https://project.supabase.co');
  });

  test('missing or local-only backend auth fails closed', () async {
    for (final config in [<String, dynamic>{}, {'auth_mode': 'local', 'supabase_url': '', 'supabase_anon_key': ''}]) {
      expect(() => AuthConfiguration.fromConfig(config, apiEndpoint: 'http://10.0.2.2:8000', androidEmulator: true), throwsStateError);
    }
    await expectLater(loadAuthConfiguration(urlOverride: 'https://example.supabase.co', keyOverride: ''), throwsStateError);
  });

  test('intent preflight sends auto selection and preserves decision id', () async {
    final paths = <String>[];
    final api = PowwowApi(accessToken: () => 'test-session', client: MockClient((request) async {
      paths.add(request.url.path);
      expect(request.headers['Authorization'], 'Bearer test-session');
      expect(jsonDecode(request.body)['capability'], 'auto');
      return http.Response(jsonEncode(intent()), 200);
    }));
    final decision = await api.prepareRequest('Write a short story', 'auto');
    expect(decision.id, 'decision-1');
    expect(paths, ['/v1/intent']);
    api.close();
  });

  test('missing image and unavailable capability stop before message creation', () async {
    for (final result in [intent(needsImage: true), intent(available: false)]) {
      final paths = <String>[];
      final api = PowwowApi(accessToken: () => 'test-session', client: MockClient((request) async {
        paths.add(request.url.path);
        return http.Response(jsonEncode(result), 200);
      }));
      await expectLater(api.prepareRequest('Make a 3D model', 'auto'), throwsA(isA<RequestUnavailable>()));
      expect(paths, ['/v1/intent']);
      api.close();
    }
  });

  test('no session means no authenticated workspace network request', () async {
    var contacted = false;
    final api = PowwowApi(accessToken: () => null, client: MockClient((request) async {
      contacted = true;
      return http.Response('[]', 200);
    }));
    await expectLater(api.request('/projects'), throwsA(isA<RequestUnavailable>()));
    expect(contacted, isFalse);
    api.close();
  });
}

Map<String, dynamic> intent({bool available = true, bool needsImage = false}) => {
  'id': 'decision-1', 'capability': 'chat', 'task': 'creative_writing', 'available': available,
  'needs_image': needsImage, 'summary': 'Write a story.', 'skill_ids': ['story_development@1'], 'method': 'rules',
};
