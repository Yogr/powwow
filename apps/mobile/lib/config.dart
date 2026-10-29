import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

const apiUrl = String.fromEnvironment('POWWOW_API_URL', defaultValue: 'http://10.0.2.2:8000');
const supabaseUrlOverride = String.fromEnvironment('SUPABASE_URL');
const supabaseKeyOverride = String.fromEnvironment('SUPABASE_ANON_KEY');

class AuthConfiguration {
  const AuthConfiguration(this.url, this.key);
  final String url;
  final String key;

  factory AuthConfiguration.fromConfig(Map<String, dynamic> config, {required String apiEndpoint, required bool androidEmulator}) {
    final url = config['supabase_url'] as String? ?? '';
    final key = config['supabase_anon_key'] as String? ?? '';
    if (config['auth_mode'] != 'supabase' || url.isEmpty || key.isEmpty) {
      throw StateError('Powwow requires Supabase sign-in. Start the shared authenticated backend, then retry.');
    }
    final uri = Uri.tryParse(url);
    if (uri == null || uri.host.isEmpty || uri.userInfo.isNotEmpty || !['http', 'https'].contains(uri.scheme)) {
      throw StateError('The backend returned an invalid authentication address.');
    }
    // Only change the mobile transport address. The API keeps the Supabase
    // issuer configured by the server when it validates the returned JWT.
    final host = androidEmulator && Uri.parse(apiEndpoint).host == '10.0.2.2' &&
        ['127.0.0.1', 'localhost', '::1'].contains(uri.host) ? '10.0.2.2' : uri.host;
    if (uri.scheme != 'https' && (kReleaseMode || !['127.0.0.1', 'localhost', '::1', '10.0.2.2'].contains(host))) {
      throw StateError('Use HTTPS for the deployed authentication service.');
    }
    return AuthConfiguration(uri.replace(host: host).toString(), key);
  }
}

Future<AuthConfiguration> loadAuthConfiguration({http.Client? client, String endpoint = apiUrl,
  String urlOverride = supabaseUrlOverride, String keyOverride = supabaseKeyOverride, bool? androidEmulator}) async {
  if (urlOverride.isEmpty != keyOverride.isEmpty) {
    throw StateError('Supply both SUPABASE_URL and SUPABASE_ANON_KEY, or let the shared API supply both.');
  }
  Map<String, dynamic> config;
  if (urlOverride.isNotEmpty) {
    config = {'auth_mode': 'supabase', 'supabase_url': urlOverride, 'supabase_anon_key': keyOverride};
  } else {
    final transport = client ?? http.Client();
    try {
      final response = await transport.get(Uri.parse('$endpoint/v1/config')).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) throw StateError('The shared API could not provide sign-in configuration.');
      config = Map<String, dynamic>.from(jsonDecode(response.body));
    } finally {
      if (client == null) transport.close();
    }
  }
  return AuthConfiguration.fromConfig(config, apiEndpoint: endpoint,
      androidEmulator: androidEmulator ?? (!kIsWeb && defaultTargetPlatform == TargetPlatform.android));
}
