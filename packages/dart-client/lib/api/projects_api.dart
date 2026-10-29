//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ProjectsApi {
  ProjectsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create Project
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [ProjectCreate] projectCreate (required):
  Future<Response> createProjectV1ProjectsPostWithHttpInfo(ProjectCreate projectCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects';

    // ignore: prefer_final_locals
    Object? postBody = projectCreate;

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

  /// Create Project
  ///
  /// Parameters:
  ///
  /// * [ProjectCreate] projectCreate (required):
  Future<ProjectOut?> createProjectV1ProjectsPost(ProjectCreate projectCreate, { Future<void>? abortTrigger, }) async {
    final response = await createProjectV1ProjectsPostWithHttpInfo(projectCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ProjectOut',) as ProjectOut;
    
    }
    return null;
  }

  /// Get Project
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<Response> getProjectV1ProjectsProjectIdGetWithHttpInfo(String projectId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}'
      .replaceAll('{project_id}', projectId);

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

  /// Get Project
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<ProjectOut?> getProjectV1ProjectsProjectIdGet(String projectId, { Future<void>? abortTrigger, }) async {
    final response = await getProjectV1ProjectsProjectIdGetWithHttpInfo(projectId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ProjectOut',) as ProjectOut;
    
    }
    return null;
  }

  /// List Projects
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [bool] archived:
  ///
  /// * [String] q:
  ///
  /// * [String] organizationId:
  Future<Response> listProjectsV1ProjectsGetWithHttpInfo({ bool? archived, String? q, String? organizationId, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (archived != null) {
      queryParams.addAll(_queryParams('', 'archived', archived));
    }
    if (q != null) {
      queryParams.addAll(_queryParams('', 'q', q));
    }
    if (organizationId != null) {
      queryParams.addAll(_queryParams('', 'organization_id', organizationId));
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

  /// List Projects
  ///
  /// Parameters:
  ///
  /// * [bool] archived:
  ///
  /// * [String] q:
  ///
  /// * [String] organizationId:
  Future<List<ProjectOut>?> listProjectsV1ProjectsGet({ bool? archived, String? q, String? organizationId, Future<void>? abortTrigger, }) async {
    final response = await listProjectsV1ProjectsGetWithHttpInfo(archived: archived, q: q, organizationId: organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ProjectOut>') as List)
        .cast<ProjectOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Patch Project
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [ProjectPatch] projectPatch (required):
  Future<Response> patchProjectV1ProjectsProjectIdPatchWithHttpInfo(String projectId, ProjectPatch projectPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = projectPatch;

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

  /// Patch Project
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [ProjectPatch] projectPatch (required):
  Future<ProjectOut?> patchProjectV1ProjectsProjectIdPatch(String projectId, ProjectPatch projectPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchProjectV1ProjectsProjectIdPatchWithHttpInfo(projectId, projectPatch, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ProjectOut',) as ProjectOut;
    
    }
    return null;
  }
}
