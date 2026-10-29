//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

library openapi.api;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:http/http.dart';
import 'package:intl/intl.dart';
import 'package:meta/meta.dart';

part 'api_client.dart';
part 'api_helper.dart';
part 'api_exception.dart';
part 'auth/authentication.dart';
part 'auth/api_key_auth.dart';
part 'auth/oauth.dart';
part 'auth/http_basic_auth.dart';
part 'auth/http_bearer_auth.dart';

part 'api/account_api.dart';
part 'api/artifacts_api.dart';
part 'api/builder_api.dart';
part 'api/catalog_api.dart';
part 'api/chats_api.dart';
part 'api/collaboration_api.dart';
part 'api/context_api.dart';
part 'api/language_learning_api.dart';
part 'api/messages_api.dart';
part 'api/projects_api.dart';
part 'api/runs_api.dart';
part 'api/system_api.dart';
part 'api/usage_api.dart';

part 'model/agent_create.dart';
part 'model/agent_out.dart';
part 'model/agent_patch.dart';
part 'model/artifact_out.dart';
part 'model/artifact_patch.dart';
part 'model/builder_record.dart';
part 'model/builder_task.dart';
part 'model/builder_workspace.dart';
part 'model/chat_create.dart';
part 'model/chat_out.dart';
part 'model/chat_patch.dart';
part 'model/detail_category.dart';
part 'model/entry_image_target.dart';
part 'model/event_out.dart';
part 'model/generation_settings.dart';
part 'model/grant_create.dart';
part 'model/grant_out.dart';
part 'model/http_validation_error.dart';
part 'model/intent_out.dart';
part 'model/intent_request.dart';
part 'model/invite_accept.dart';
part 'model/invite_create.dart';
part 'model/invite_created.dart';
part 'model/invite_out.dart';
part 'model/language_correction.dart';
part 'model/language_day_detail.dart';
part 'model/language_day_out.dart';
part 'model/language_days_out.dart';
part 'model/language_phrase_create.dart';
part 'model/language_phrase_out.dart';
part 'model/language_phrase_review.dart';
part 'model/language_profile_create.dart';
part 'model/language_profile_out.dart';
part 'model/language_reply.dart';
part 'model/language_segment.dart';
part 'model/language_suggestion.dart';
part 'model/language_turn_create.dart';
part 'model/language_turn_out.dart';
part 'model/language_vocabulary.dart';
part 'model/local_save_receipt.dart';
part 'model/location_inner.dart';
part 'model/member_out.dart';
part 'model/member_patch.dart';
part 'model/message_create.dart';
part 'model/message_out.dart';
part 'model/organization_create.dart';
part 'model/organization_out.dart';
part 'model/plan_out.dart';
part 'model/plan_preview.dart';
part 'model/plan_request.dart';
part 'model/policy_put.dart';
part 'model/preferences_out.dart';
part 'model/preferences_patch.dart';
part 'model/project_create.dart';
part 'model/project_out.dart';
part 'model/project_patch.dart';
part 'model/refinement_apply.dart';
part 'model/refinement_out.dart';
part 'model/refinement_request.dart';
part 'model/run_create.dart';
part 'model/run_out.dart';
part 'model/run_retry.dart';
part 'model/task_create.dart';
part 'model/task_out.dart';
part 'model/task_patch.dart';
part 'model/validation_error.dart';
part 'model/workspace_out.dart';
part 'model/workspace_put.dart';


/// An [ApiClient] instance that uses the default values obtained from
/// the OpenAPI specification file.
var defaultApiClient = ApiClient();

const _delimiters = {'csv': ',', 'ssv': ' ', 'tsv': '\t', 'pipes': '|'};
const _dateEpochMarker = 'epoch';
const _deepEquality = DeepCollectionEquality();
final _dateFormatter = DateFormat('yyyy-MM-dd');
final _regList = RegExp(r'^List<(.*)>$');
final _regSet = RegExp(r'^Set<(.*)>$');
final _regMap = RegExp(r'^Map<String,(.*)>$');

bool _isEpochMarker(String? pattern) => pattern == _dateEpochMarker || pattern == '/$_dateEpochMarker/';
