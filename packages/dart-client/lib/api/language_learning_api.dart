//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LanguageLearningApi {
  LanguageLearningApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create Profile
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [LanguageProfileCreate] languageProfileCreate (required):
  Future<Response> createProfileV1ProjectsProjectIdLanguageProfilesPostWithHttpInfo(String projectId, LanguageProfileCreate languageProfileCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/language/profiles'
      .replaceAll('{project_id}', projectId);

    // ignore: prefer_final_locals
    Object? postBody = languageProfileCreate;

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

  /// Create Profile
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  ///
  /// * [LanguageProfileCreate] languageProfileCreate (required):
  Future<LanguageProfileOut?> createProfileV1ProjectsProjectIdLanguageProfilesPost(String projectId, LanguageProfileCreate languageProfileCreate, { Future<void>? abortTrigger, }) async {
    final response = await createProfileV1ProjectsProjectIdLanguageProfilesPostWithHttpInfo(projectId, languageProfileCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LanguageProfileOut',) as LanguageProfileOut;
    
    }
    return null;
  }

  /// Language Catalog
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> languageCatalogV1LanguagesCatalogGetWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/languages/catalog';

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

  /// Language Catalog
  Future<Object?> languageCatalogV1LanguagesCatalogGet({ Future<void>? abortTrigger, }) async {
    final response = await languageCatalogV1LanguagesCatalogGetWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// List Days
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  Future<Response> listDaysV1LanguageProfilesProfileIdDaysGetWithHttpInfo(String profileId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/profiles/{profile_id}/days'
      .replaceAll('{profile_id}', profileId);

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

  /// List Days
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  Future<LanguageDaysOut?> listDaysV1LanguageProfilesProfileIdDaysGet(String profileId, { Future<void>? abortTrigger, }) async {
    final response = await listDaysV1LanguageProfilesProfileIdDaysGetWithHttpInfo(profileId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LanguageDaysOut',) as LanguageDaysOut;
    
    }
    return null;
  }

  /// List Phrases
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  Future<Response> listPhrasesV1LanguageProfilesProfileIdPhrasesGetWithHttpInfo(String profileId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/profiles/{profile_id}/phrases'
      .replaceAll('{profile_id}', profileId);

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

  /// List Phrases
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  Future<List<LanguagePhraseOut>?> listPhrasesV1LanguageProfilesProfileIdPhrasesGet(String profileId, { Future<void>? abortTrigger, }) async {
    final response = await listPhrasesV1LanguageProfilesProfileIdPhrasesGetWithHttpInfo(profileId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<LanguagePhraseOut>') as List)
        .cast<LanguagePhraseOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// List Profiles
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<Response> listProfilesV1ProjectsProjectIdLanguageProfilesGetWithHttpInfo(String projectId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/projects/{project_id}/language/profiles'
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

  /// List Profiles
  ///
  /// Parameters:
  ///
  /// * [String] projectId (required):
  Future<List<LanguageProfileOut>?> listProfilesV1ProjectsProjectIdLanguageProfilesGet(String projectId, { Future<void>? abortTrigger, }) async {
    final response = await listProfilesV1ProjectsProjectIdLanguageProfilesGetWithHttpInfo(projectId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<LanguageProfileOut>') as List)
        .cast<LanguageProfileOut>()
        .toList(growable: false);

    }
    return null;
  }

  /// Queue Turn
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] dayId (required):
  ///
  /// * [LanguageTurnCreate] languageTurnCreate (required):
  Future<Response> queueTurnV1LanguageDaysDayIdTurnsPostWithHttpInfo(String dayId, LanguageTurnCreate languageTurnCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/days/{day_id}/turns'
      .replaceAll('{day_id}', dayId);

    // ignore: prefer_final_locals
    Object? postBody = languageTurnCreate;

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

  /// Queue Turn
  ///
  /// Parameters:
  ///
  /// * [String] dayId (required):
  ///
  /// * [LanguageTurnCreate] languageTurnCreate (required):
  Future<RunOut?> queueTurnV1LanguageDaysDayIdTurnsPost(String dayId, LanguageTurnCreate languageTurnCreate, { Future<void>? abortTrigger, }) async {
    final response = await queueTurnV1LanguageDaysDayIdTurnsPostWithHttpInfo(dayId, languageTurnCreate, abortTrigger: abortTrigger,);
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

  /// Read Day
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] dayId (required):
  Future<Response> readDayV1LanguageDaysDayIdGetWithHttpInfo(String dayId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/days/{day_id}'
      .replaceAll('{day_id}', dayId);

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

  /// Read Day
  ///
  /// Parameters:
  ///
  /// * [String] dayId (required):
  Future<LanguageDayDetail?> readDayV1LanguageDaysDayIdGet(String dayId, { Future<void>? abortTrigger, }) async {
    final response = await readDayV1LanguageDaysDayIdGetWithHttpInfo(dayId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LanguageDayDetail',) as LanguageDayDetail;
    
    }
    return null;
  }

  /// Read Profile
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  Future<Response> readProfileV1LanguageProfilesProfileIdGetWithHttpInfo(String profileId, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/profiles/{profile_id}'
      .replaceAll('{profile_id}', profileId);

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

  /// Read Profile
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  Future<LanguageProfileOut?> readProfileV1LanguageProfilesProfileIdGet(String profileId, { Future<void>? abortTrigger, }) async {
    final response = await readProfileV1LanguageProfilesProfileIdGetWithHttpInfo(profileId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LanguageProfileOut',) as LanguageProfileOut;
    
    }
    return null;
  }

  /// Review Phrase
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] phraseId (required):
  ///
  /// * [LanguagePhraseReview] languagePhraseReview (required):
  Future<Response> reviewPhraseV1LanguagePhrasesPhraseIdPatchWithHttpInfo(String phraseId, LanguagePhraseReview languagePhraseReview, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/phrases/{phrase_id}'
      .replaceAll('{phrase_id}', phraseId);

    // ignore: prefer_final_locals
    Object? postBody = languagePhraseReview;

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

  /// Review Phrase
  ///
  /// Parameters:
  ///
  /// * [String] phraseId (required):
  ///
  /// * [LanguagePhraseReview] languagePhraseReview (required):
  Future<LanguagePhraseOut?> reviewPhraseV1LanguagePhrasesPhraseIdPatch(String phraseId, LanguagePhraseReview languagePhraseReview, { Future<void>? abortTrigger, }) async {
    final response = await reviewPhraseV1LanguagePhrasesPhraseIdPatchWithHttpInfo(phraseId, languagePhraseReview, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LanguagePhraseOut',) as LanguagePhraseOut;
    
    }
    return null;
  }

  /// Save Phrase
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  ///
  /// * [LanguagePhraseCreate] languagePhraseCreate (required):
  Future<Response> savePhraseV1LanguageProfilesProfileIdPhrasesPostWithHttpInfo(String profileId, LanguagePhraseCreate languagePhraseCreate, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/v1/language/profiles/{profile_id}/phrases'
      .replaceAll('{profile_id}', profileId);

    // ignore: prefer_final_locals
    Object? postBody = languagePhraseCreate;

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

  /// Save Phrase
  ///
  /// Parameters:
  ///
  /// * [String] profileId (required):
  ///
  /// * [LanguagePhraseCreate] languagePhraseCreate (required):
  Future<LanguagePhraseOut?> savePhraseV1LanguageProfilesProfileIdPhrasesPost(String profileId, LanguagePhraseCreate languagePhraseCreate, { Future<void>? abortTrigger, }) async {
    final response = await savePhraseV1LanguageProfilesProfileIdPhrasesPostWithHttpInfo(profileId, languagePhraseCreate, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LanguagePhraseOut',) as LanguagePhraseOut;
    
    }
    return null;
  }
}
