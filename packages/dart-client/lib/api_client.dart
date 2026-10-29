//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ApiClient {
  ApiClient({this.basePath = 'http://localhost', this.authentication,});

  final String basePath;
  final Authentication? authentication;

  var _client = Client();
  final _defaultHeaderMap = <String, String>{};

  /// Returns the current HTTP [Client] instance to use in this class.
  ///
  /// The return value is guaranteed to never be null.
  Client get client => _client;

  /// Requests to use a new HTTP [Client] in this class.
  set client(Client newClient) {
    _client = newClient;
  }

  Map<String, String> get defaultHeaderMap => _defaultHeaderMap;

  void addDefaultHeader(String key, String value) {
     _defaultHeaderMap[key] = value;
  }

  // We don't use a Map<String, String> for queryParams.
  // If collectionFormat is 'multi', a key might appear multiple times.
  Future<Response> invokeAPI(
    String path,
    String method,
    List<QueryParam> queryParams,
    Object? body,
    Map<String, String> headerParams,
    Map<String, String> formParams,
    String? contentType, {
    Future<void>? abortTrigger,
  }) async {
    await authentication?.applyToParams(queryParams, headerParams);

    headerParams.addAll(_defaultHeaderMap);
    if (contentType != null) {
      headerParams['Content-Type'] = contentType;
    }

    final urlEncodedQueryParams = queryParams.map((param) => '$param');
    final queryString = urlEncodedQueryParams.isNotEmpty ? '?${urlEncodedQueryParams.join('&')}' : '';
    final uri = Uri.parse('$basePath$path$queryString');

    try {
      // Special case for uploading a single file which isn't a 'multipart/form-data'.
      if (
        body is MultipartFile && (contentType == null ||
        !contentType.toLowerCase().startsWith('multipart/form-data'))
      ) {
        final request = AbortableStreamedRequest(method, uri, abortTrigger: abortTrigger);
        request.headers.addAll(headerParams);
        request.contentLength = body.length;
        body.finalize().listen(
          request.sink.add,
          onDone: request.sink.close,
          // ignore: avoid_types_on_closure_parameters
          onError: (Object error, StackTrace trace) => request.sink.close(),
          cancelOnError: true,
        );
        final response = await _client.send(request);
        return Response.fromStream(response);
      }

      if (body is MultipartRequest) {
        final request = AbortableMultipartRequest(method, uri, abortTrigger: abortTrigger);
        request.fields.addAll(body.fields);
        request.files.addAll(body.files);
        request.headers.addAll(body.headers);
        request.headers.addAll(headerParams);
        final response = await _client.send(request);
        return Response.fromStream(response);
      }

      final msgBody = contentType == 'application/x-www-form-urlencoded'
        ? formParams
        : await serializeAsync(body);
      final nullableHeaderParams = headerParams.isEmpty ? null : headerParams;

      final request = AbortableRequest(method, uri, abortTrigger: abortTrigger);
      if (nullableHeaderParams != null) {
        request.headers.addAll(nullableHeaderParams);
      }
      if (msgBody is String && msgBody.isNotEmpty) {
        request.body = msgBody;
      } else if (msgBody is List<int> && msgBody.isNotEmpty) {
        request.bodyBytes = msgBody;
      } else if (msgBody is Map<String, String>) {
        request.bodyFields = msgBody;
      }
      final response = await _client.send(request);
      return Response.fromStream(response);
    } on SocketException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'Socket operation failed: $method $path',
        error,
        trace,
      );
    } on TlsException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'TLS/SSL communication failed: $method $path',
        error,
        trace,
      );
    } on IOException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'I/O operation failed: $method $path',
        error,
        trace,
      );
    } on ClientException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'HTTP connection failed: $method $path',
        error,
        trace,
      );
    } on Exception catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'Exception occurred: $method $path',
        error,
        trace,
      );
    }
  }

  Future<dynamic> deserializeAsync(String value, String targetType, {bool growable = false,}) async =>
    // ignore: deprecated_member_use_from_same_package
    deserialize(value, targetType, growable: growable);

  @Deprecated('Scheduled for removal in OpenAPI Generator 6.x. Use deserializeAsync() instead.')
  dynamic deserialize(String value, String targetType, {bool growable = false,}) {
    // Remove all spaces. Necessary for regular expressions as well.
    targetType = targetType.replaceAll(' ', ''); // ignore: parameter_assignments

    // If the expected target type is String, nothing to do...
    return targetType == 'String'
      ? value
      : fromJson(json.decode(value), targetType, growable: growable);
  }

  // ignore: deprecated_member_use_from_same_package
  Future<String> serializeAsync(Object? value) async => serialize(value);

  @Deprecated('Scheduled for removal in OpenAPI Generator 6.x. Use serializeAsync() instead.')
  String serialize(Object? value) => value == null ? '' : json.encode(value);

  /// Returns a native instance of an OpenAPI class matching the [specified type][targetType].
  static dynamic fromJson(dynamic value, String targetType, {bool growable = false,}) {
    try {
      switch (targetType) {
        case 'String':
          return value is String ? value : value.toString();
        case 'int':
          return value is int ? value : int.parse('$value');
        case 'double':
          return value is double ? value : double.parse('$value');
        case 'bool':
          if (value is bool) {
            return value;
          }
          final valueString = '$value'.toLowerCase();
          return valueString == 'true' || valueString == '1';
        case 'DateTime':
          return value is DateTime ? value : DateTime.tryParse(value);
        case 'AgentCreate':
          return AgentCreate.fromJson(value);
        case 'AgentOut':
          return AgentOut.fromJson(value);
        case 'AgentPatch':
          return AgentPatch.fromJson(value);
        case 'ArtifactOut':
          return ArtifactOut.fromJson(value);
        case 'ArtifactPatch':
          return ArtifactPatch.fromJson(value);
        case 'BuilderRecord':
          return BuilderRecord.fromJson(value);
        case 'BuilderTask':
          return BuilderTask.fromJson(value);
        case 'BuilderWorkspace':
          return BuilderWorkspace.fromJson(value);
        case 'ChatCreate':
          return ChatCreate.fromJson(value);
        case 'ChatOut':
          return ChatOut.fromJson(value);
        case 'ChatPatch':
          return ChatPatch.fromJson(value);
        case 'DetailCategory':
          return DetailCategory.fromJson(value);
        case 'EntryImageTarget':
          return EntryImageTarget.fromJson(value);
        case 'EventOut':
          return EventOut.fromJson(value);
        case 'GenerationSettings':
          return GenerationSettings.fromJson(value);
        case 'GrantCreate':
          return GrantCreate.fromJson(value);
        case 'GrantOut':
          return GrantOut.fromJson(value);
        case 'HTTPValidationError':
          return HTTPValidationError.fromJson(value);
        case 'IntentOut':
          return IntentOut.fromJson(value);
        case 'IntentRequest':
          return IntentRequest.fromJson(value);
        case 'InviteAccept':
          return InviteAccept.fromJson(value);
        case 'InviteCreate':
          return InviteCreate.fromJson(value);
        case 'InviteCreated':
          return InviteCreated.fromJson(value);
        case 'InviteOut':
          return InviteOut.fromJson(value);
        case 'LanguageCorrection':
          return LanguageCorrection.fromJson(value);
        case 'LanguageDayDetail':
          return LanguageDayDetail.fromJson(value);
        case 'LanguageDayOut':
          return LanguageDayOut.fromJson(value);
        case 'LanguageDaysOut':
          return LanguageDaysOut.fromJson(value);
        case 'LanguagePhraseCreate':
          return LanguagePhraseCreate.fromJson(value);
        case 'LanguagePhraseOut':
          return LanguagePhraseOut.fromJson(value);
        case 'LanguagePhraseReview':
          return LanguagePhraseReview.fromJson(value);
        case 'LanguageProfileCreate':
          return LanguageProfileCreate.fromJson(value);
        case 'LanguageProfileOut':
          return LanguageProfileOut.fromJson(value);
        case 'LanguageReply':
          return LanguageReply.fromJson(value);
        case 'LanguageSegment':
          return LanguageSegment.fromJson(value);
        case 'LanguageSuggestion':
          return LanguageSuggestion.fromJson(value);
        case 'LanguageTurnCreate':
          return LanguageTurnCreate.fromJson(value);
        case 'LanguageTurnOut':
          return LanguageTurnOut.fromJson(value);
        case 'LanguageVocabulary':
          return LanguageVocabulary.fromJson(value);
        case 'LocalSaveReceipt':
          return LocalSaveReceipt.fromJson(value);
        case 'LocationInner':
          return LocationInner.fromJson(value);
        case 'MemberOut':
          return MemberOut.fromJson(value);
        case 'MemberPatch':
          return MemberPatch.fromJson(value);
        case 'MessageCreate':
          return MessageCreate.fromJson(value);
        case 'MessageOut':
          return MessageOut.fromJson(value);
        case 'OrganizationCreate':
          return OrganizationCreate.fromJson(value);
        case 'OrganizationOut':
          return OrganizationOut.fromJson(value);
        case 'PlanOut':
          return PlanOut.fromJson(value);
        case 'PlanPreview':
          return PlanPreview.fromJson(value);
        case 'PlanRequest':
          return PlanRequest.fromJson(value);
        case 'PolicyPut':
          return PolicyPut.fromJson(value);
        case 'PreferencesOut':
          return PreferencesOut.fromJson(value);
        case 'PreferencesPatch':
          return PreferencesPatch.fromJson(value);
        case 'ProjectCreate':
          return ProjectCreate.fromJson(value);
        case 'ProjectOut':
          return ProjectOut.fromJson(value);
        case 'ProjectPatch':
          return ProjectPatch.fromJson(value);
        case 'RefinementApply':
          return RefinementApply.fromJson(value);
        case 'RefinementOut':
          return RefinementOut.fromJson(value);
        case 'RefinementRequest':
          return RefinementRequest.fromJson(value);
        case 'RunCreate':
          return RunCreate.fromJson(value);
        case 'RunOut':
          return RunOut.fromJson(value);
        case 'RunRetry':
          return RunRetry.fromJson(value);
        case 'TaskCreate':
          return TaskCreate.fromJson(value);
        case 'TaskOut':
          return TaskOut.fromJson(value);
        case 'TaskPatch':
          return TaskPatch.fromJson(value);
        case 'ValidationError':
          return ValidationError.fromJson(value);
        case 'WorkspaceOut':
          return WorkspaceOut.fromJson(value);
        case 'WorkspacePut':
          return WorkspacePut.fromJson(value);
        default:
          dynamic match;
          if (value is List && (match = _regList.firstMatch(targetType)?.group(1)) != null) {
            return value
              .map<dynamic>((dynamic v) => fromJson(v, match, growable: growable,))
              .toList(growable: growable);
          }
          if (value is Set && (match = _regSet.firstMatch(targetType)?.group(1)) != null) {
            return value
              .map<dynamic>((dynamic v) => fromJson(v, match, growable: growable,))
              .toSet();
          }
          if (value is Map && (match = _regMap.firstMatch(targetType)?.group(1)) != null) {
            return Map<String, dynamic>.fromIterables(
              value.keys.cast<String>(),
              value.values.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable,)),
            );
          }
      }
    } on Exception catch (error, trace) {
      throw ApiException.withInner(HttpStatus.internalServerError, 'Exception during deserialization.', error, trace,);
    }
    throw ApiException(HttpStatus.internalServerError, 'Could not find a suitable class for deserialization',);
  }
}

/// Primarily intended for use in an isolate.
class DeserializationMessage {
  const DeserializationMessage({
    required this.json,
    required this.targetType,
    this.growable = false,
  });

  /// The JSON value to deserialize.
  final String json;

  /// Target type to deserialize to.
  final String targetType;

  /// Whether to make deserialized lists or maps growable.
  final bool growable;
}

/// Primarily intended for use in an isolate.
Future<dynamic> decodeAsync(DeserializationMessage message) async {
  // Remove all spaces. Necessary for regular expressions as well.
  final targetType = message.targetType.replaceAll(' ', '');

  // If the expected target type is String, nothing to do...
  return targetType == 'String'
    ? message.json
    : json.decode(message.json);
}

/// Primarily intended for use in an isolate.
Future<dynamic> deserializeAsync(DeserializationMessage message) async {
  // Remove all spaces. Necessary for regular expressions as well.
  final targetType = message.targetType.replaceAll(' ', '');

  // If the expected target type is String, nothing to do...
  return targetType == 'String'
    ? message.json
    : ApiClient.fromJson(
        json.decode(message.json),
        targetType,
        growable: message.growable,
      );
}

/// Primarily intended for use in an isolate.
Future<String> serializeAsync(Object? value) async => value == null ? '' : json.encode(value);
