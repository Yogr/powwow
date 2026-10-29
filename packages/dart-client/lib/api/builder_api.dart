//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class BuilderApi {
  BuilderApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Apply Project Refinement
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [RefinementApply] refinementApply (required):
  Future<Response> applyProjectRefinementV1ProjectsProjectIdApplyRefinementPostWithHttpInfo(String projectId, RefinementApply refinementApply, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/apply-refinement'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = refinementApply;

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

  /// Apply Project Refinement
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [RefinementApply] refinementApply (required):
  Future<WorkspaceOut?> applyProjectRefinementV1ProjectsProjectIdApplyRefinementPost(String projectId, RefinementApply refinementApply, { Future<void>? abortTrigger, }) async {
    final response = await applyProjectRefinementV1ProjectsProjectIdApplyRefinementPostWithHttpInfo(projectId, refinementApply, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkspaceOut',) as WorkspaceOut;
    
    }
    return null;
  }

  /// Create Project Plan
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [PlanRequest] planRequest (required):
  Future<Response> createProjectPlanV1ProjectsProjectIdPlanPostWithHttpInfo(String projectId, PlanRequest planRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/plan'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = planRequest;

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

  /// Create Project Plan
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [PlanRequest] planRequest (required):
  Future<PlanOut?> createProjectPlanV1ProjectsProjectIdPlanPost(String projectId, PlanRequest planRequest, { Future<void>? abortTrigger, }) async {
    final response = await createProjectPlanV1ProjectsProjectIdPlanPostWithHttpInfo(projectId, planRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PlanOut',) as PlanOut;
    
    }
    return null;
  }

  /// Export Project Memory
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<Response> exportProjectMemoryV1ProjectsProjectIdMemoryMdGetWithHttpInfo(String projectId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/memory.md'
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

  /// Export Project Memory
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<Object?> exportProjectMemoryV1ProjectsProjectIdMemoryMdGet(String projectId, { Future<void>? abortTrigger, }) async {
    final response = await exportProjectMemoryV1ProjectsProjectIdMemoryMdGetWithHttpInfo(projectId, abortTrigger: abortTrigger,);
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

  /// Get Builder Catalog
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getBuilderCatalogV1BuilderCatalogGetWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/builder/catalog';

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

  /// Get Builder Catalog
  Future<Object?> getBuilderCatalogV1BuilderCatalogGet({ Future<void>? abortTrigger, }) async {
    final response = await getBuilderCatalogV1BuilderCatalogGetWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// Preview New Idea
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PlanRequest] planRequest (required):
  Future<Response> previewNewIdeaV1BuilderPreviewPostWithHttpInfo(PlanRequest planRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/builder/preview';

    // ignore: prefer_final_locals
    Object? postBody = planRequest;

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

  /// Preview New Idea
  ///
  /// Parameters:
  ///
  /// * [PlanRequest] planRequest (required):
  Future<PlanPreview?> previewNewIdeaV1BuilderPreviewPost(PlanRequest planRequest, { Future<void>? abortTrigger, }) async {
    final response = await previewNewIdeaV1BuilderPreviewPostWithHttpInfo(planRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PlanPreview',) as PlanPreview;
    
    }
    return null;
  }

  /// Preview Project Plan
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [PlanRequest] planRequest (required):
  Future<Response> previewProjectPlanV1ProjectsProjectIdPlanPreviewPostWithHttpInfo(String projectId, PlanRequest planRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/plan-preview'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = planRequest;

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

  /// Preview Project Plan
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [PlanRequest] planRequest (required):
  Future<PlanPreview?> previewProjectPlanV1ProjectsProjectIdPlanPreviewPost(String projectId, PlanRequest planRequest, { Future<void>? abortTrigger, }) async {
    final response = await previewProjectPlanV1ProjectsProjectIdPlanPreviewPostWithHttpInfo(projectId, planRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PlanPreview',) as PlanPreview;
    
    }
    return null;
  }

  /// Read Project Workspace
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<Response> readProjectWorkspaceV1ProjectsProjectIdWorkspaceGetWithHttpInfo(String projectId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/workspace'
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

  /// Read Project Workspace
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<WorkspaceOut?> readProjectWorkspaceV1ProjectsProjectIdWorkspaceGet(String projectId, { Future<void>? abortTrigger, }) async {
    final response = await readProjectWorkspaceV1ProjectsProjectIdWorkspaceGetWithHttpInfo(projectId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkspaceOut',) as WorkspaceOut;
    
    }
    return null;
  }

  /// Refine Project Plan
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [RefinementRequest] refinementRequest (required):
  Future<Response> refineProjectPlanV1ProjectsProjectIdPlanRefinementPostWithHttpInfo(String projectId, RefinementRequest refinementRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/plan-refinement'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = refinementRequest;

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

  /// Refine Project Plan
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [RefinementRequest] refinementRequest (required):
  Future<RunOut?> refineProjectPlanV1ProjectsProjectIdPlanRefinementPost(String projectId, RefinementRequest refinementRequest, { Future<void>? abortTrigger, }) async {
    final response = await refineProjectPlanV1ProjectsProjectIdPlanRefinementPostWithHttpInfo(projectId, refinementRequest, abortTrigger: abortTrigger,);
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

  /// Review Project Refinement
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [String] runId (required):
  Future<Response> reviewProjectRefinementV1ProjectsProjectIdPlanRefinementsRunIdGetWithHttpInfo(String projectId, String runId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/plan-refinements/{run_id}'
      .replaceAll('{project_id}', projectId)
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

  /// Review Project Refinement
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [String] runId (required):
  Future<RefinementOut?> reviewProjectRefinementV1ProjectsProjectIdPlanRefinementsRunIdGet(String projectId, String runId, { Future<void>? abortTrigger, }) async {
    final response = await reviewProjectRefinementV1ProjectsProjectIdPlanRefinementsRunIdGetWithHttpInfo(projectId, runId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RefinementOut',) as RefinementOut;
    
    }
    return null;
  }

  /// Write Project Workspace
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [WorkspacePut] workspacePut (required):
  Future<Response> writeProjectWorkspaceV1ProjectsProjectIdWorkspacePutWithHttpInfo(String projectId, WorkspacePut workspacePut, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/workspace'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = workspacePut;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


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

  /// Write Project Workspace
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [WorkspacePut] workspacePut (required):
  Future<WorkspaceOut?> writeProjectWorkspaceV1ProjectsProjectIdWorkspacePut(String projectId, WorkspacePut workspacePut, { Future<void>? abortTrigger, }) async {
    final response = await writeProjectWorkspaceV1ProjectsProjectIdWorkspacePutWithHttpInfo(projectId, workspacePut, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkspaceOut',) as WorkspaceOut;
    
    }
    return null;
  }
}
