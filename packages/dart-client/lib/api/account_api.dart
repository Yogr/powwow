//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AccountApi {
  AccountApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Acknowledge Local Save
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  ///
  /// * [LocalSaveReceipt] localSaveReceipt (required):
  Future<Response> acknowledgeLocalSaveV1ArtifactsArtifactIdLocalSavePostWithHttpInfo(String artifactId, LocalSaveReceipt localSaveReceipt, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts/{artifact_id}/local-save'
      .replaceAll('{artifact_id}', artifactId);

    // ignore: prefer_final_locals
    Object? postBody = localSaveReceipt;

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

  /// Acknowledge Local Save
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  ///
  /// * [LocalSaveReceipt] localSaveReceipt (required):
  Future<Object?> acknowledgeLocalSaveV1ArtifactsArtifactIdLocalSavePost(String artifactId, LocalSaveReceipt localSaveReceipt, { Future<void>? abortTrigger, }) async {
    final response = await acknowledgeLocalSaveV1ArtifactsArtifactIdLocalSavePostWithHttpInfo(artifactId, localSaveReceipt, abortTrigger: abortTrigger,);
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

  /// Complete Experience Tour
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] kind (required):
  Future<Response> completeExperienceTourV1AccountExperienceToursKindPutWithHttpInfo(String kind, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/account/experience-tours/{kind}'
      .replaceAll('{kind}', kind);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Complete Experience Tour
  ///
  /// Parameters:
  ///
  /// * [String] kind (required):
  Future<Object?> completeExperienceTourV1AccountExperienceToursKindPut(String kind, { Future<void>? abortTrigger, }) async {
    final response = await completeExperienceTourV1AccountExperienceToursKindPutWithHttpInfo(kind, abortTrigger: abortTrigger,);
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

  /// Experience Tours
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> experienceToursV1AccountExperienceToursGetWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/account/experience-tours';

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

  /// Experience Tours
  Future<List<String?>?> experienceToursV1AccountExperienceToursGet({ Future<void>? abortTrigger, }) async {
    final response = await experienceToursV1AccountExperienceToursGetWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<String?>') as List)
        .cast<String>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get Preferences
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPreferencesV1AccountPreferencesGetWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/account/preferences';

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

  /// Get Preferences
  Future<PreferencesOut?> getPreferencesV1AccountPreferencesGet({ Future<void>? abortTrigger, }) async {
    final response = await getPreferencesV1AccountPreferencesGetWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PreferencesOut',) as PreferencesOut;
    
    }
    return null;
  }

  /// Patch Preferences
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PreferencesPatch] preferencesPatch (required):
  Future<Response> patchPreferencesV1AccountPreferencesPatchWithHttpInfo(PreferencesPatch preferencesPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/account/preferences';

    // ignore: prefer_final_locals
    Object? postBody = preferencesPatch;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Patch Preferences
  ///
  /// Parameters:
  ///
  /// * [PreferencesPatch] preferencesPatch (required):
  Future<PreferencesOut?> patchPreferencesV1AccountPreferencesPatch(PreferencesPatch preferencesPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchPreferencesV1AccountPreferencesPatchWithHttpInfo(preferencesPatch, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PreferencesOut',) as PreferencesOut;
    
    }
    return null;
  }
}
