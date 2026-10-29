//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class CollaborationApi {
  CollaborationApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Accept Invite
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [InviteAccept] inviteAccept (required):
  Future<Response> acceptInviteV1InvitesAcceptPostWithHttpInfo(InviteAccept inviteAccept, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/invites/accept';

    // ignore: prefer_final_locals
    Object? postBody = inviteAccept;

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

  /// Accept Invite
  ///
  /// Parameters:
  ///
  /// * [InviteAccept] inviteAccept (required):
  Future<OrganizationOut?> acceptInviteV1InvitesAcceptPost(InviteAccept inviteAccept, { Future<void>? abortTrigger, }) async {
    final response = await acceptInviteV1InvitesAcceptPostWithHttpInfo(inviteAccept, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OrganizationOut',) as OrganizationOut;
    
    }
    return null;
  }

  /// Agents
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Response> agentsV1OrganizationsOrganizationIdAgentsGetWithHttpInfo(String organizationId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/agents'
      .replaceAll('{organization_id}', organizationId);

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

  /// Agents
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<List<AgentOut>?> agentsV1OrganizationsOrganizationIdAgentsGet(String organizationId, { Future<void>? abortTrigger, }) async {
    final response = await agentsV1OrganizationsOrganizationIdAgentsGetWithHttpInfo(organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AgentOut>') as List)
        .cast<AgentOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Create Agent
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [AgentCreate] agentCreate (required):
  Future<Response> createAgentV1OrganizationsOrganizationIdAgentsPostWithHttpInfo(String organizationId, AgentCreate agentCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/agents'
      .replaceAll('{organization_id}', organizationId);

    // ignore: prefer_final_locals
    Object? postBody = agentCreate;

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

  /// Create Agent
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [AgentCreate] agentCreate (required):
  Future<AgentOut?> createAgentV1OrganizationsOrganizationIdAgentsPost(String organizationId, AgentCreate agentCreate, { Future<void>? abortTrigger, }) async {
    final response = await createAgentV1OrganizationsOrganizationIdAgentsPostWithHttpInfo(organizationId, agentCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AgentOut',) as AgentOut;
    
    }
    return null;
  }

  /// Create Organization
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [OrganizationCreate] organizationCreate (required):
  Future<Response> createOrganizationV1OrganizationsPostWithHttpInfo(OrganizationCreate organizationCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations';

    // ignore: prefer_final_locals
    Object? postBody = organizationCreate;

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

  /// Create Organization
  ///
  /// Parameters:
  ///
  /// * [OrganizationCreate] organizationCreate (required):
  Future<OrganizationOut?> createOrganizationV1OrganizationsPost(OrganizationCreate organizationCreate, { Future<void>? abortTrigger, }) async {
    final response = await createOrganizationV1OrganizationsPostWithHttpInfo(organizationCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OrganizationOut',) as OrganizationOut;
    
    }
    return null;
  }

  /// Create Task
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [TaskCreate] taskCreate (required):
  Future<Response> createTaskV1ProjectsProjectIdTasksPostWithHttpInfo(String projectId, TaskCreate taskCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/tasks'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = taskCreate;

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

  /// Create Task
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [TaskCreate] taskCreate (required):
  Future<TaskOut?> createTaskV1ProjectsProjectIdTasksPost(String projectId, TaskCreate taskCreate, { Future<void>? abortTrigger, }) async {
    final response = await createTaskV1ProjectsProjectIdTasksPostWithHttpInfo(projectId, taskCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TaskOut',) as TaskOut;
    
    }
    return null;
  }

  /// Delete Agent
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] agentId (required):
  Future<Response> deleteAgentV1OrganizationsOrganizationIdAgentsAgentIdDeleteWithHttpInfo(String organizationId, String agentId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/agents/{agent_id}'
      .replaceAll('{organization_id}', organizationId)
      .replaceAll('{agent_id}', agentId);

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

  /// Delete Agent
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] agentId (required):
  Future<void> deleteAgentV1OrganizationsOrganizationIdAgentsAgentIdDelete(String organizationId, String agentId, { Future<void>? abortTrigger, }) async {
    final response = await deleteAgentV1OrganizationsOrganizationIdAgentsAgentIdDeleteWithHttpInfo(organizationId, agentId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get Organization
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Response> getOrganizationV1OrganizationsOrganizationIdGetWithHttpInfo(String organizationId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}'
      .replaceAll('{organization_id}', organizationId);

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

  /// Get Organization
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<OrganizationOut?> getOrganizationV1OrganizationsOrganizationIdGet(String organizationId, { Future<void>? abortTrigger, }) async {
    final response = await getOrganizationV1OrganizationsOrganizationIdGetWithHttpInfo(organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OrganizationOut',) as OrganizationOut;
    
    }
    return null;
  }

  /// Get Policy
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Response> getPolicyV1OrganizationsOrganizationIdPolicyGetWithHttpInfo(String organizationId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/policy'
      .replaceAll('{organization_id}', organizationId);

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

  /// Get Policy
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<PolicyPut?> getPolicyV1OrganizationsOrganizationIdPolicyGet(String organizationId, { Future<void>? abortTrigger, }) async {
    final response = await getPolicyV1OrganizationsOrganizationIdPolicyGetWithHttpInfo(organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PolicyPut',) as PolicyPut;
    
    }
    return null;
  }

  /// Invite
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [InviteCreate] inviteCreate (required):
  Future<Response> inviteV1OrganizationsOrganizationIdInvitesPostWithHttpInfo(String organizationId, InviteCreate inviteCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/invites'
      .replaceAll('{organization_id}', organizationId);

    // ignore: prefer_final_locals
    Object? postBody = inviteCreate;

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

  /// Invite
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [InviteCreate] inviteCreate (required):
  Future<InviteCreated?> inviteV1OrganizationsOrganizationIdInvitesPost(String organizationId, InviteCreate inviteCreate, { Future<void>? abortTrigger, }) async {
    final response = await inviteV1OrganizationsOrganizationIdInvitesPostWithHttpInfo(organizationId, inviteCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'InviteCreated',) as InviteCreated;
    
    }
    return null;
  }

  /// Invites
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Response> invitesV1OrganizationsOrganizationIdInvitesGetWithHttpInfo(String organizationId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/invites'
      .replaceAll('{organization_id}', organizationId);

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

  /// Invites
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<List<InviteOut>?> invitesV1OrganizationsOrganizationIdInvitesGet(String organizationId, { Future<void>? abortTrigger, }) async {
    final response = await invitesV1OrganizationsOrganizationIdInvitesGetWithHttpInfo(organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<InviteOut>') as List)
        .cast<InviteOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Members
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Response> membersV1OrganizationsOrganizationIdMembersGetWithHttpInfo(String organizationId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/members'
      .replaceAll('{organization_id}', organizationId);

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

  /// Members
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<List<MemberOut>?> membersV1OrganizationsOrganizationIdMembersGet(String organizationId, { Future<void>? abortTrigger, }) async {
    final response = await membersV1OrganizationsOrganizationIdMembersGetWithHttpInfo(organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MemberOut>') as List)
        .cast<MemberOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// My Tasks
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [bool] assignedToMe:
  ///
  /// * [String] organizationId:
  Future<Response> myTasksV1TasksGetWithHttpInfo({ bool? assignedToMe, String? organizationId, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/tasks';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (assignedToMe != null) {
      queryParams.addAll(_queryParams('', 'assigned_to_me', assignedToMe));
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

  /// My Tasks
  ///
  /// Parameters:
  ///
  /// * [bool] assignedToMe:
  ///
  /// * [String] organizationId:
  Future<List<TaskOut>?> myTasksV1TasksGet({ bool? assignedToMe, String? organizationId, Future<void>? abortTrigger, }) async {
    final response = await myTasksV1TasksGetWithHttpInfo(assignedToMe: assignedToMe, organizationId: organizationId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<TaskOut>') as List)
        .cast<TaskOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Organizations
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> organizationsV1OrganizationsGetWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations';

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

  /// Organizations
  Future<List<OrganizationOut>?> organizationsV1OrganizationsGet({ Future<void>? abortTrigger, }) async {
    final response = await organizationsV1OrganizationsGetWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<OrganizationOut>') as List)
        .cast<OrganizationOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Patch Agent
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] agentId (required):
  ///
  /// * [AgentPatch] agentPatch (required):
  Future<Response> patchAgentV1OrganizationsOrganizationIdAgentsAgentIdPatchWithHttpInfo(String organizationId, String agentId, AgentPatch agentPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/agents/{agent_id}'
      .replaceAll('{organization_id}', organizationId)
      .replaceAll('{agent_id}', agentId);

    // ignore: prefer_final_locals
    Object? postBody = agentPatch;

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

  /// Patch Agent
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] agentId (required):
  ///
  /// * [AgentPatch] agentPatch (required):
  Future<AgentOut?> patchAgentV1OrganizationsOrganizationIdAgentsAgentIdPatch(String organizationId, String agentId, AgentPatch agentPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchAgentV1OrganizationsOrganizationIdAgentsAgentIdPatchWithHttpInfo(organizationId, agentId, agentPatch, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AgentOut',) as AgentOut;
    
    }
    return null;
  }

  /// Patch Member
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] userId (required):
  ///
  /// * [MemberPatch] memberPatch (required):
  Future<Response> patchMemberV1OrganizationsOrganizationIdMembersUserIdPatchWithHttpInfo(String organizationId, String userId, MemberPatch memberPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/members/{user_id}'
      .replaceAll('{organization_id}', organizationId)
      .replaceAll('{user_id}', userId);

    // ignore: prefer_final_locals
    Object? postBody = memberPatch;

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

  /// Patch Member
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] userId (required):
  ///
  /// * [MemberPatch] memberPatch (required):
  Future<MemberOut?> patchMemberV1OrganizationsOrganizationIdMembersUserIdPatch(String organizationId, String userId, MemberPatch memberPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchMemberV1OrganizationsOrganizationIdMembersUserIdPatchWithHttpInfo(organizationId, userId, memberPatch, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MemberOut',) as MemberOut;
    
    }
    return null;
  }

  /// Patch Task
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] taskId (required):
  ///
  /// * [TaskPatch] taskPatch (required):
  Future<Response> patchTaskV1TasksTaskIdPatchWithHttpInfo(String taskId, TaskPatch taskPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/tasks/{task_id}'
      .replaceAll('{task_id}', taskId);

    // ignore: prefer_final_locals
    Object? postBody = taskPatch;

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

  /// Patch Task
  ///
  /// Parameters:
  ///
  /// * [String] taskId (required):
  ///
  /// * [TaskPatch] taskPatch (required):
  Future<TaskOut?> patchTaskV1TasksTaskIdPatch(String taskId, TaskPatch taskPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchTaskV1TasksTaskIdPatchWithHttpInfo(taskId, taskPatch, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TaskOut',) as TaskOut;
    
    }
    return null;
  }

  /// Project Tasks
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<Response> projectTasksV1ProjectsProjectIdTasksGetWithHttpInfo(String projectId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/tasks'
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

  /// Project Tasks
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<List<TaskOut>?> projectTasksV1ProjectsProjectIdTasksGet(String projectId, { Future<void>? abortTrigger, }) async {
    final response = await projectTasksV1ProjectsProjectIdTasksGetWithHttpInfo(projectId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<TaskOut>') as List)
        .cast<TaskOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Remove Member
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] userId (required):
  Future<Response> removeMemberV1OrganizationsOrganizationIdMembersUserIdDeleteWithHttpInfo(String organizationId, String userId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/members/{user_id}'
      .replaceAll('{organization_id}', organizationId)
      .replaceAll('{user_id}', userId);

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

  /// Remove Member
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] userId (required):
  Future<void> removeMemberV1OrganizationsOrganizationIdMembersUserIdDelete(String organizationId, String userId, { Future<void>? abortTrigger, }) async {
    final response = await removeMemberV1OrganizationsOrganizationIdMembersUserIdDeleteWithHttpInfo(organizationId, userId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Revoke Invite
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] inviteId (required):
  Future<Response> revokeInviteV1OrganizationsOrganizationIdInvitesInviteIdDeleteWithHttpInfo(String organizationId, String inviteId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/invites/{invite_id}'
      .replaceAll('{organization_id}', organizationId)
      .replaceAll('{invite_id}', inviteId);

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

  /// Revoke Invite
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [String] inviteId (required):
  Future<void> revokeInviteV1OrganizationsOrganizationIdInvitesInviteIdDelete(String organizationId, String inviteId, { Future<void>? abortTrigger, }) async {
    final response = await revokeInviteV1OrganizationsOrganizationIdInvitesInviteIdDeleteWithHttpInfo(organizationId, inviteId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Set Policy
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [PolicyPut] policyPut (required):
  Future<Response> setPolicyV1OrganizationsOrganizationIdPolicyPutWithHttpInfo(String organizationId, PolicyPut policyPut, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/policy'
      .replaceAll('{organization_id}', organizationId);

    // ignore: prefer_final_locals
    Object? postBody = policyPut;

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

  /// Set Policy
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  ///
  /// * [PolicyPut] policyPut (required):
  Future<PolicyPut?> setPolicyV1OrganizationsOrganizationIdPolicyPut(String organizationId, PolicyPut policyPut, { Future<void>? abortTrigger, }) async {
    final response = await setPolicyV1OrganizationsOrganizationIdPolicyPutWithHttpInfo(organizationId, policyPut, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PolicyPut',) as PolicyPut;
    
    }
    return null;
  }

  /// Task Chat
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] taskId (required):
  Future<Response> taskChatV1TasksTaskIdChatPutWithHttpInfo(String taskId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/tasks/{task_id}/chat'
      .replaceAll('{task_id}', taskId);

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

  /// Task Chat
  ///
  /// Parameters:
  ///
  /// * [String] taskId (required):
  Future<ChatOut?> taskChatV1TasksTaskIdChatPut(String taskId, { Future<void>? abortTrigger, }) async {
    final response = await taskChatV1TasksTaskIdChatPutWithHttpInfo(taskId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ChatOut',) as ChatOut;
    
    }
    return null;
  }

  /// Usage
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Response> usageV1OrganizationsOrganizationIdUsageGetWithHttpInfo(String organizationId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/organizations/{organization_id}/usage'
      .replaceAll('{organization_id}', organizationId);

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

  /// Usage
  ///
  /// Parameters:
  ///
  /// * [String] organizationId (required):
  Future<Object?> usageV1OrganizationsOrganizationIdUsageGet(String organizationId, { Future<void>? abortTrigger, }) async {
    final response = await usageV1OrganizationsOrganizationIdUsageGetWithHttpInfo(organizationId, abortTrigger: abortTrigger,);
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
