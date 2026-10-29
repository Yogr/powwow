//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class RunsApi {
  RunsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Cancel Run
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  Future<Response> cancelRunV1RunsRunIdCancelPostWithHttpInfo(String runId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs/{run_id}/cancel'
      .replaceAll('{run_id}', runId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Cancel Run
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  Future<RunOut?> cancelRunV1RunsRunIdCancelPost(String runId, { Future<void>? abortTrigger, }) async {
    final response = await cancelRunV1RunsRunIdCancelPostWithHttpInfo(runId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RunOut',) as RunOut;
    
    }
    return null;
  }

  /// Create Run
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [RunCreate] runCreate (required):
  Future<Response> createRunV1RunsPostWithHttpInfo(RunCreate runCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs';

    // ignore: prefer_final_locals
    Object? postBody = runCreate;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Create Run
  ///
  /// Parameters:
  ///
  /// * [RunCreate] runCreate (required):
  Future<RunOut?> createRunV1RunsPost(RunCreate runCreate, { Future<void>? abortTrigger, }) async {
    final response = await createRunV1RunsPostWithHttpInfo(runCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RunOut',) as RunOut;
    
    }
    return null;
  }

  /// Events
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  ///
  /// * [int] after:
  Future<Response> eventsV1RunsRunIdEventsGetWithHttpInfo(String runId, { int? after, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs/{run_id}/events'
      .replaceAll('{run_id}', runId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (after != null) {
      queryParams.addAll(_queryParams('', 'after', after));
    }

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Events
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  ///
  /// * [int] after:
  Future<List<EventOut>?> eventsV1RunsRunIdEventsGet(String runId, { int? after, Future<void>? abortTrigger, }) async {
    final response = await eventsV1RunsRunIdEventsGetWithHttpInfo(runId, after: after, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<EventOut>') as List)
        .cast<EventOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get Run
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  Future<Response> getRunV1RunsRunIdGetWithHttpInfo(String runId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs/{run_id}'
      .replaceAll('{run_id}', runId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get Run
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  Future<RunOut?> getRunV1RunsRunIdGet(String runId, { Future<void>? abortTrigger, }) async {
    final response = await getRunV1RunsRunIdGetWithHttpInfo(runId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RunOut',) as RunOut;
    
    }
    return null;
  }

  /// List Runs
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] chatId:
  ///
  /// * [String] projectId:
  Future<Response> listRunsV1RunsGetWithHttpInfo({ String? chatId, String? projectId, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (chatId != null) {
      queryParams.addAll(_queryParams('', 'chat_id', chatId));
    }
    if (projectId != null) {
      queryParams.addAll(_queryParams('', 'project_id', projectId));
    }

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// List Runs
  ///
  /// Parameters:
  ///
  /// * [String] chatId:
  ///
  /// * [String] projectId:
  Future<List<RunOut>?> listRunsV1RunsGet({ String? chatId, String? projectId, Future<void>? abortTrigger, }) async {
    final response = await listRunsV1RunsGetWithHttpInfo(chatId: chatId, projectId: projectId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<RunOut>') as List)
        .cast<RunOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Resolve Intent
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [IntentRequest] intentRequest (required):
  Future<Response> resolveIntentV1IntentPostWithHttpInfo(IntentRequest intentRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/intent';

    // ignore: prefer_final_locals
    Object? postBody = intentRequest;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Resolve Intent
  ///
  /// Parameters:
  ///
  /// * [IntentRequest] intentRequest (required):
  Future<IntentOut?> resolveIntentV1IntentPost(IntentRequest intentRequest, { Future<void>? abortTrigger, }) async {
    final response = await resolveIntentV1IntentPostWithHttpInfo(intentRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'IntentOut',) as IntentOut;
    
    }
    return null;
  }

  /// Retry Run
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  ///
  /// * [RunRetry] runRetry (required):
  Future<Response> retryRunV1RunsRunIdRetryPostWithHttpInfo(String runId, RunRetry runRetry, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs/{run_id}/retry'
      .replaceAll('{run_id}', runId);

    // ignore: prefer_final_locals
    Object? postBody = runRetry;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retry Run
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  ///
  /// * [RunRetry] runRetry (required):
  Future<RunOut?> retryRunV1RunsRunIdRetryPost(String runId, RunRetry runRetry, { Future<void>? abortTrigger, }) async {
    final response = await retryRunV1RunsRunIdRetryPostWithHttpInfo(runId, runRetry, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RunOut',) as RunOut;
    
    }
    return null;
  }

  /// Stages
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  Future<Response> stagesV1RunsRunIdStagesGetWithHttpInfo(String runId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/runs/{run_id}/stages'
      .replaceAll('{run_id}', runId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Stages
  ///
  /// Parameters:
  ///
  /// * [String] runId (required):
  Future<Object?> stagesV1RunsRunIdStagesGet(String runId, { Future<void>? abortTrigger, }) async {
    final response = await stagesV1RunsRunIdStagesGetWithHttpInfo(runId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }
}
