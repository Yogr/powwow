import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:powwow_api/api.dart' as contract;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';

class ApiFailure implements Exception {
  ApiFailure(this.status, this.message);
  final int status;
  final String message;
  @override
  String toString() => 'Request failed ($status): $message';
}

class RequestUnavailable implements Exception {
  RequestUnavailable(this.message);
  final String message;
  @override
  String toString() => message;
}

class PowwowApi {
  PowwowApi({
    http.Client? client,
    this.endpoint = apiUrl,
    String? Function()? accessToken,
  }) : client = client ?? http.Client(),
       token =
           accessToken ??
           (() => Supabase.instance.client.auth.currentSession?.accessToken);
  final http.Client client;
  final String endpoint;
  final String? Function() token;
  String? _accountIdentity(String? value) {
    if (value == null) return null;
    try {
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(value.split('.')[1]))),
      );
      return payload['sub'] as String? ?? value;
    } catch (_) {
      return value;
    }
  }

  Map<String, String> get headers {
    final value = token();
    if (value == null) {
      throw RequestUnavailable('Sign in to use your shared Powwow workspace.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $value',
    };
  }

  Future<dynamic> request(
    String path, {
    String method = 'GET',
    Object? body,
  }) async {
    final account = _accountIdentity(token());
    final request = http.Request(method, Uri.parse('$endpoint/v1$path'))
      ..headers.addAll(headers);
    if (body != null) request.body = jsonEncode(body);
    final timeout = Duration(seconds: path == '/intent' ? 120 : 20);
    final response = await http.Response.fromStream(
      await client.send(request).timeout(timeout),
    ).timeout(timeout);
    if (_accountIdentity(token()) != account) {
      throw RequestUnavailable(
        'Your account changed. Open your current workspace to continue.',
      );
    }
    if (response.statusCode >= 400) {
      throw ApiFailure(response.statusCode, response.body);
    }
    return response.body.isEmpty ? null : jsonDecode(response.body);
  }

  Future<contract.IntentOut> prepareRequest(
    String text,
    String capability,
  ) async {
    final json = await request(
      '/intent',
      method: 'POST',
      body: contract.IntentRequest(
        prompt: text,
        capability: contract.IntentRequestCapabilityEnum.fromJson(capability)!,
      ),
    );
    final intent = contract.IntentOut.fromJson(json)!;
    if (!intent.available) {
      throw RequestUnavailable(
        '${intent.summary} This feature is not available on the current backend yet.',
      );
    }
    if (intent.needsImage) {
      throw RequestUnavailable(
        'This request needs an image. Open Powwow on the web to attach an image and run this workflow.',
      );
    }
    return intent;
  }

  void close() => client.close();
}
