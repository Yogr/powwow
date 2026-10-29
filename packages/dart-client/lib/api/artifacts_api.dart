//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ArtifactsApi {
  ArtifactsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Artifact Content
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<Response> artifactContentV1ArtifactsArtifactIdContentGetWithHttpInfo(String artifactId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts/{artifact_id}/content'
      .replaceAll('{artifact_id}', artifactId);

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

  /// Artifact Content
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<Object?> artifactContentV1ArtifactsArtifactIdContentGet(String artifactId, { Future<void>? abortTrigger, }) async {
    final response = await artifactContentV1ArtifactsArtifactIdContentGetWithHttpInfo(artifactId, abortTrigger: abortTrigger,);
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

  /// Delete Artifact
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<Response> deleteArtifactV1ArtifactsArtifactIdDeleteWithHttpInfo(String artifactId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts/{artifact_id}'
      .replaceAll('{artifact_id}', artifactId);

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

  /// Delete Artifact
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<void> deleteArtifactV1ArtifactsArtifactIdDelete(String artifactId, { Future<void>? abortTrigger, }) async {
    final response = await deleteArtifactV1ArtifactsArtifactIdDeleteWithHttpInfo(artifactId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Download Artifact
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<Response> downloadArtifactV1ArtifactsArtifactIdDownloadGetWithHttpInfo(String artifactId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts/{artifact_id}/download'
      .replaceAll('{artifact_id}', artifactId);

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

  /// Download Artifact
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<Object?> downloadArtifactV1ArtifactsArtifactIdDownloadGet(String artifactId, { Future<void>? abortTrigger, }) async {
    final response = await downloadArtifactV1ArtifactsArtifactIdDownloadGetWithHttpInfo(artifactId, abortTrigger: abortTrigger,);
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

  /// Get Artifact
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<Response> getArtifactV1ArtifactsArtifactIdGetWithHttpInfo(String artifactId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts/{artifact_id}'
      .replaceAll('{artifact_id}', artifactId);

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

  /// Get Artifact
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  Future<ArtifactOut?> getArtifactV1ArtifactsArtifactIdGet(String artifactId, { Future<void>? abortTrigger, }) async {
    final response = await getArtifactV1ArtifactsArtifactIdGetWithHttpInfo(artifactId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ArtifactOut',) as ArtifactOut;
    
    }
    return null;
  }

  /// List Artifacts
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId:
  ///
  /// * [String] chatId:
  Future<Response> listArtifactsV1ArtifactsGetWithHttpInfo({ String? projectId, String? chatId, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (projectId != null) {
      queryParams.addAll(_queryParams('', 'project_id', projectId));
    }
    if (chatId != null) {
      queryParams.addAll(_queryParams('', 'chat_id', chatId));
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

  /// List Artifacts
  ///
  /// Parameters:
  ///
  /// * [String] projectId:
  ///
  /// * [String] chatId:
  Future<List<ArtifactOut>?> listArtifactsV1ArtifactsGet({ String? projectId, String? chatId, Future<void>? abortTrigger, }) async {
    final response = await listArtifactsV1ArtifactsGetWithHttpInfo(projectId: projectId, chatId: chatId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ArtifactOut>') as List)
        .cast<ArtifactOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Patch Artifact
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  ///
  /// * [ArtifactPatch] artifactPatch (required):
  Future<Response> patchArtifactV1ArtifactsArtifactIdPatchWithHttpInfo(String artifactId, ArtifactPatch artifactPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/artifacts/{artifact_id}'
      .replaceAll('{artifact_id}', artifactId);

    // ignore: prefer_final_locals
    Object? postBody = artifactPatch;

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

  /// Patch Artifact
  ///
  /// Parameters:
  ///
  /// * [String] artifactId (required):
  ///
  /// * [ArtifactPatch] artifactPatch (required):
  Future<ArtifactOut?> patchArtifactV1ArtifactsArtifactIdPatch(String artifactId, ArtifactPatch artifactPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchArtifactV1ArtifactsArtifactIdPatchWithHttpInfo(artifactId, artifactPatch, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ArtifactOut',) as ArtifactOut;
    
    }
    return null;
  }

  /// Upload
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] file (required):
  ///
  /// * [String] projectId:
  ///
  /// * [String] chatId:
  Future<Response> uploadV1UploadsPostWithHttpInfo(MultipartFile file, { String? projectId, String? chatId, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/uploads';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(path));
    if (file != null) {
      hasFields = true;
      mp.fields[r'file'] = file.field;
      mp.files.add(file);
    }
    if (projectId != null) {
      hasFields = true;
      mp.fields[r'project_id'] = parameterToString(projectId);
    }
    if (chatId != null) {
      hasFields = true;
      mp.fields[r'chat_id'] = parameterToString(chatId);
    }
    if (hasFields) {
      postBody = mp;
    }

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

  /// Upload
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] file (required):
  ///
  /// * [String] projectId:
  ///
  /// * [String] chatId:
  Future<ArtifactOut?> uploadV1UploadsPost(MultipartFile file, { String? projectId, String? chatId, Future<void>? abortTrigger, }) async {
    final response = await uploadV1UploadsPostWithHttpInfo(file, projectId: projectId, chatId: chatId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ArtifactOut',) as ArtifactOut;
    
    }
    return null;
  }
}
