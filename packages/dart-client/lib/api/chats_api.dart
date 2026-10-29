//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ChatsApi {
  ChatsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Component Chat
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [String] componentId (required):
  Future<Response> componentChatV1ProjectsProjectIdComponentsComponentIdChatPutWithHttpInfo(String projectId, String componentId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/components/{component_id}/chat'
      .replaceAll('{project_id}', projectId)
      .replaceAll('{component_id}', componentId);

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

  /// Component Chat
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [String] componentId (required):
  Future<ChatOut?> componentChatV1ProjectsProjectIdComponentsComponentIdChatPut(String projectId, String componentId, { Future<void>? abortTrigger, }) async {
    final response = await componentChatV1ProjectsProjectIdComponentsComponentIdChatPutWithHttpInfo(projectId, componentId, abortTrigger: abortTrigger,);
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

  /// Create Chat
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [ChatCreate] chatCreate (required):
  Future<Response> createChatV1ChatsPostWithHttpInfo(ChatCreate chatCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/chats';

    // ignore: prefer_final_locals
    Object? postBody = chatCreate;

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

  /// Create Chat
  ///
  /// Parameters:
  ///
  /// * [ChatCreate] chatCreate (required):
  Future<ChatOut?> createChatV1ChatsPost(ChatCreate chatCreate, { Future<void>? abortTrigger, }) async {
    final response = await createChatV1ChatsPostWithHttpInfo(chatCreate, abortTrigger: abortTrigger,);
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

  /// Get Chat
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  Future<Response> getChatV1ChatsChatIdGetWithHttpInfo(String chatId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/chats/{chat_id}'
      .replaceAll('{chat_id}', chatId);

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

  /// Get Chat
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  Future<ChatOut?> getChatV1ChatsChatIdGet(String chatId, { Future<void>? abortTrigger, }) async {
    final response = await getChatV1ChatsChatIdGetWithHttpInfo(chatId, abortTrigger: abortTrigger,);
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

  /// List Chats
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId:
  ///
  /// * [bool] archived:
  ///
  /// * [String] q:
  ///
  /// * [bool] standalone:
  Future<Response> listChatsV1ChatsGetWithHttpInfo({ String? projectId, bool? archived, String? q, bool? standalone, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/chats';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (projectId != null) {
      queryParams.addAll(_queryParams('', 'project_id', projectId));
    }
    if (archived != null) {
      queryParams.addAll(_queryParams('', 'archived', archived));
    }
    if (q != null) {
      queryParams.addAll(_queryParams('', 'q', q));
    }
    if (standalone != null) {
      queryParams.addAll(_queryParams('', 'standalone', standalone));
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

  /// List Chats
  ///
  /// Parameters:
  ///
  /// * [String] projectId:
  ///
  /// * [bool] archived:
  ///
  /// * [String] q:
  ///
  /// * [bool] standalone:
  Future<List<ChatOut>?> listChatsV1ChatsGet({ String? projectId, bool? archived, String? q, bool? standalone, Future<void>? abortTrigger, }) async {
    final response = await listChatsV1ChatsGetWithHttpInfo(projectId: projectId, archived: archived, q: q, standalone: standalone, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ChatOut>') as List)
        .cast<ChatOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Patch Chat
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  ///
  /// * [ChatPatch] chatPatch (required):
  Future<Response> patchChatV1ChatsChatIdPatchWithHttpInfo(String chatId, ChatPatch chatPatch, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/chats/{chat_id}'
      .replaceAll('{chat_id}', chatId);

    // ignore: prefer_final_locals
    Object? postBody = chatPatch;

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

  /// Patch Chat
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  ///
  /// * [ChatPatch] chatPatch (required):
  Future<ChatOut?> patchChatV1ChatsChatIdPatch(String chatId, ChatPatch chatPatch, { Future<void>? abortTrigger, }) async {
    final response = await patchChatV1ChatsChatIdPatchWithHttpInfo(chatId, chatPatch, abortTrigger: abortTrigger,);
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
}
