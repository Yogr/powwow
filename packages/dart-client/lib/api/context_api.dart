//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ContextApi {
  ContextApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create Grant
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [GrantCreate] grantCreate (required):
  Future<Response> createGrantV1ContextGrantsPostWithHttpInfo(GrantCreate grantCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/context-grants';

    // ignore: prefer_final_locals
    Object? postBody = grantCreate;

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

  /// Create Grant
  ///
  /// Parameters:
  ///
  /// * [GrantCreate] grantCreate (required):
  Future<GrantOut?> createGrantV1ContextGrantsPost(GrantCreate grantCreate, { Future<void>? abortTrigger, }) async {
    final response = await createGrantV1ContextGrantsPostWithHttpInfo(grantCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GrantOut',) as GrantOut;
    
    }
    return null;
  }

  /// List Grants
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] destinationProjectId:
  ///
  /// * [bool] includeRevoked:
  Future<Response> listGrantsV1ContextGrantsGetWithHttpInfo({ String? destinationProjectId, bool? includeRevoked, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/context-grants';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (destinationProjectId != null) {
      queryParams.addAll(_queryParams('', 'destination_project_id', destinationProjectId));
    }
    if (includeRevoked != null) {
      queryParams.addAll(_queryParams('', 'include_revoked', includeRevoked));
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

  /// List Grants
  ///
  /// Parameters:
  ///
  /// * [String] destinationProjectId:
  ///
  /// * [bool] includeRevoked:
  Future<List<GrantOut>?> listGrantsV1ContextGrantsGet({ String? destinationProjectId, bool? includeRevoked, Future<void>? abortTrigger, }) async {
    final response = await listGrantsV1ContextGrantsGetWithHttpInfo(destinationProjectId: destinationProjectId, includeRevoked: includeRevoked, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<GrantOut>') as List)
        .cast<GrantOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Revoke Grant
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] grantId (required):
  Future<Response> revokeGrantV1ContextGrantsGrantIdDeleteWithHttpInfo(String grantId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/context-grants/{grant_id}'
      .replaceAll('{grant_id}', grantId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Revoke Grant
  ///
  /// Parameters:
  ///
  /// * [String] grantId (required):
  Future<GrantOut?> revokeGrantV1ContextGrantsGrantIdDelete(String grantId, { Future<void>? abortTrigger, }) async {
    final response = await revokeGrantV1ContextGrantsGrantIdDeleteWithHttpInfo(grantId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GrantOut',) as GrantOut;
    
    }
    return null;
  }
}
