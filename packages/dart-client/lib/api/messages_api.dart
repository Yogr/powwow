//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MessagesApi {
  MessagesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create Message
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  ///
  /// * [MessageCreate] messageCreate (required):
  Future<Response> createMessageV1ChatsChatIdMessagesPostWithHttpInfo(String chatId, MessageCreate messageCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/chats/{chat_id}/messages'
      .replaceAll('{chat_id}', chatId);

    // ignore: prefer_final_locals
    Object? postBody = messageCreate;

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

  /// Create Message
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  ///
  /// * [MessageCreate] messageCreate (required):
  Future<MessageOut?> createMessageV1ChatsChatIdMessagesPost(String chatId, MessageCreate messageCreate, { Future<void>? abortTrigger, }) async {
    final response = await createMessageV1ChatsChatIdMessagesPostWithHttpInfo(chatId, messageCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MessageOut',) as MessageOut;
    
    }
    return null;
  }

  /// List Messages
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  Future<Response> listMessagesV1ChatsChatIdMessagesGetWithHttpInfo(String chatId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/chats/{chat_id}/messages'
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

  /// List Messages
  ///
  /// Parameters:
  ///
  /// * [String] chatId (required):
  Future<List<MessageOut>?> listMessagesV1ChatsChatIdMessagesGet(String chatId, { Future<void>? abortTrigger, }) async {
    final response = await listMessagesV1ChatsChatIdMessagesGetWithHttpInfo(chatId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MessageOut>') as List)
        .cast<MessageOut>()
        .toList(growable: false);

    }
    return null;
  }
}
