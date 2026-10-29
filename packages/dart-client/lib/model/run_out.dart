//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunOut {
  /// Returns a new [RunOut] instance.
  RunOut({
    required this.id,
    required this.chatId,
    required this.messageId,
    required this.projectId,
    required this.capability,
    required this.workflowId,
    required this.status,
    required this.stage,
    required this.progress,
    required this.prompt,
    this.settings = const {},
    this.attachmentIds = const [],
    this.artifactIds = const [],
    required this.outputText,
    this.error = const {},
    required this.estimatedCostUsd,
    required this.actualCostUsd,
    required this.budgetUsd,
    required this.provider,
    required this.model,
    this.modelProvenance = const {},
    this.contextSnapshot = const [],
    required this.attempt,
    required this.parentRunId,
    required this.createdAt,
    required this.updatedAt,
    required this.startedAt,
    required this.completedAt,
  });

  String id;

  String chatId;

  String messageId;

  String? projectId;

  String capability;

  String workflowId;

  String status;

  String stage;

  num? progress;

  String prompt;

  Map<String, dynamic> settings;

  List<String> attachmentIds;

  List<String> artifactIds;

  String outputText;

  Map<String, dynamic>? error;

  num estimatedCostUsd;

  num actualCostUsd;

  num budgetUsd;

  String provider;

  String model;

  Map<String, dynamic> modelProvenance;

  List<Map<String, dynamic>> contextSnapshot;

  int attempt;

  String? parentRunId;

  DateTime createdAt;

  DateTime updatedAt;

  DateTime? startedAt;

  DateTime? completedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunOut &&
    other.id == id &&
    other.chatId == chatId &&
    other.messageId == messageId &&
    other.projectId == projectId &&
    other.capability == capability &&
    other.workflowId == workflowId &&
    other.status == status &&
    other.stage == stage &&
    other.progress == progress &&
    other.prompt == prompt &&
    _deepEquality.equals(other.settings, settings) &&
    _deepEquality.equals(other.attachmentIds, attachmentIds) &&
    _deepEquality.equals(other.artifactIds, artifactIds) &&
    other.outputText == outputText &&
    _deepEquality.equals(other.error, error) &&
    other.estimatedCostUsd == estimatedCostUsd &&
    other.actualCostUsd == actualCostUsd &&
    other.budgetUsd == budgetUsd &&
    other.provider == provider &&
    other.model == model &&
    _deepEquality.equals(other.modelProvenance, modelProvenance) &&
    _deepEquality.equals(other.contextSnapshot, contextSnapshot) &&
    other.attempt == attempt &&
    other.parentRunId == parentRunId &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt &&
    other.startedAt == startedAt &&
    other.completedAt == completedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (chatId.hashCode) +
    (messageId.hashCode) +
    (projectId == null ? 0 : projectId!.hashCode) +
    (capability.hashCode) +
    (workflowId.hashCode) +
    (status.hashCode) +
    (stage.hashCode) +
    (progress == null ? 0 : progress!.hashCode) +
    (prompt.hashCode) +
    (settings.hashCode) +
    (attachmentIds.hashCode) +
    (artifactIds.hashCode) +
    (outputText.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (estimatedCostUsd.hashCode) +
    (actualCostUsd.hashCode) +
    (budgetUsd.hashCode) +
    (provider.hashCode) +
    (model.hashCode) +
    (modelProvenance.hashCode) +
    (contextSnapshot.hashCode) +
    (attempt.hashCode) +
    (parentRunId == null ? 0 : parentRunId!.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode) +
    (startedAt == null ? 0 : startedAt!.hashCode) +
    (completedAt == null ? 0 : completedAt!.hashCode);

  @override
  String toString() => 'RunOut[id=$id, chatId=$chatId, messageId=$messageId, projectId=$projectId, capability=$capability, workflowId=$workflowId, status=$status, stage=$stage, progress=$progress, prompt=$prompt, settings=$settings, attachmentIds=$attachmentIds, artifactIds=$artifactIds, outputText=$outputText, error=$error, estimatedCostUsd=$estimatedCostUsd, actualCostUsd=$actualCostUsd, budgetUsd=$budgetUsd, provider=$provider, model=$model, modelProvenance=$modelProvenance, contextSnapshot=$contextSnapshot, attempt=$attempt, parentRunId=$parentRunId, createdAt=$createdAt, updatedAt=$updatedAt, startedAt=$startedAt, completedAt=$completedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'chat_id'] = this.chatId;
      json[r'message_id'] = this.messageId;
    if (this.projectId != null) {
      json[r'project_id'] = this.projectId;
    } else {
      json[r'project_id'] = null;
    }
      json[r'capability'] = this.capability;
      json[r'workflow_id'] = this.workflowId;
      json[r'status'] = this.status;
      json[r'stage'] = this.stage;
    if (this.progress != null) {
      json[r'progress'] = this.progress;
    } else {
      json[r'progress'] = null;
    }
      json[r'prompt'] = this.prompt;
      json[r'settings'] = this.settings;
      json[r'attachment_ids'] = this.attachmentIds;
      json[r'artifact_ids'] = this.artifactIds;
      json[r'output_text'] = this.outputText;
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
      json[r'error'] = null;
    }
      json[r'estimated_cost_usd'] = this.estimatedCostUsd;
      json[r'actual_cost_usd'] = this.actualCostUsd;
      json[r'budget_usd'] = this.budgetUsd;
      json[r'provider'] = this.provider;
      json[r'model'] = this.model;
      json[r'model_provenance'] = this.modelProvenance;
      json[r'context_snapshot'] = this.contextSnapshot;
      json[r'attempt'] = this.attempt;
    if (this.parentRunId != null) {
      json[r'parent_run_id'] = this.parentRunId;
    } else {
      json[r'parent_run_id'] = null;
    }
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
    if (this.startedAt != null) {
      json[r'started_at'] = this.startedAt!.toUtc().toIso8601String();
    } else {
      json[r'started_at'] = null;
    }
    if (this.completedAt != null) {
      json[r'completed_at'] = this.completedAt!.toUtc().toIso8601String();
    } else {
      json[r'completed_at'] = null;
    }
    return json;
  }

  /// Returns a new [RunOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "RunOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "RunOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'chat_id'), 'Required key "RunOut[chat_id]" is missing from JSON.');
        assert(json[r'chat_id'] != null, 'Required key "RunOut[chat_id]" has a null value in JSON.');
        assert(json.containsKey(r'message_id'), 'Required key "RunOut[message_id]" is missing from JSON.');
        assert(json[r'message_id'] != null, 'Required key "RunOut[message_id]" has a null value in JSON.');
        assert(json.containsKey(r'project_id'), 'Required key "RunOut[project_id]" is missing from JSON.');
        assert(json.containsKey(r'capability'), 'Required key "RunOut[capability]" is missing from JSON.');
        assert(json[r'capability'] != null, 'Required key "RunOut[capability]" has a null value in JSON.');
        assert(json.containsKey(r'workflow_id'), 'Required key "RunOut[workflow_id]" is missing from JSON.');
        assert(json[r'workflow_id'] != null, 'Required key "RunOut[workflow_id]" has a null value in JSON.');
        assert(json.containsKey(r'status'), 'Required key "RunOut[status]" is missing from JSON.');
        assert(json[r'status'] != null, 'Required key "RunOut[status]" has a null value in JSON.');
        assert(json.containsKey(r'stage'), 'Required key "RunOut[stage]" is missing from JSON.');
        assert(json[r'stage'] != null, 'Required key "RunOut[stage]" has a null value in JSON.');
        assert(json.containsKey(r'progress'), 'Required key "RunOut[progress]" is missing from JSON.');
        assert(json.containsKey(r'prompt'), 'Required key "RunOut[prompt]" is missing from JSON.');
        assert(json[r'prompt'] != null, 'Required key "RunOut[prompt]" has a null value in JSON.');
        assert(json.containsKey(r'settings'), 'Required key "RunOut[settings]" is missing from JSON.');
        assert(json[r'settings'] != null, 'Required key "RunOut[settings]" has a null value in JSON.');
        assert(json.containsKey(r'attachment_ids'), 'Required key "RunOut[attachment_ids]" is missing from JSON.');
        assert(json[r'attachment_ids'] != null, 'Required key "RunOut[attachment_ids]" has a null value in JSON.');
        assert(json.containsKey(r'artifact_ids'), 'Required key "RunOut[artifact_ids]" is missing from JSON.');
        assert(json[r'artifact_ids'] != null, 'Required key "RunOut[artifact_ids]" has a null value in JSON.');
        assert(json.containsKey(r'output_text'), 'Required key "RunOut[output_text]" is missing from JSON.');
        assert(json[r'output_text'] != null, 'Required key "RunOut[output_text]" has a null value in JSON.');
        assert(json.containsKey(r'error'), 'Required key "RunOut[error]" is missing from JSON.');
        assert(json.containsKey(r'estimated_cost_usd'), 'Required key "RunOut[estimated_cost_usd]" is missing from JSON.');
        assert(json[r'estimated_cost_usd'] != null, 'Required key "RunOut[estimated_cost_usd]" has a null value in JSON.');
        assert(json.containsKey(r'actual_cost_usd'), 'Required key "RunOut[actual_cost_usd]" is missing from JSON.');
        assert(json[r'actual_cost_usd'] != null, 'Required key "RunOut[actual_cost_usd]" has a null value in JSON.');
        assert(json.containsKey(r'budget_usd'), 'Required key "RunOut[budget_usd]" is missing from JSON.');
        assert(json[r'budget_usd'] != null, 'Required key "RunOut[budget_usd]" has a null value in JSON.');
        assert(json.containsKey(r'provider'), 'Required key "RunOut[provider]" is missing from JSON.');
        assert(json[r'provider'] != null, 'Required key "RunOut[provider]" has a null value in JSON.');
        assert(json.containsKey(r'model'), 'Required key "RunOut[model]" is missing from JSON.');
        assert(json[r'model'] != null, 'Required key "RunOut[model]" has a null value in JSON.');
        assert(json.containsKey(r'model_provenance'), 'Required key "RunOut[model_provenance]" is missing from JSON.');
        assert(json[r'model_provenance'] != null, 'Required key "RunOut[model_provenance]" has a null value in JSON.');
        assert(json.containsKey(r'context_snapshot'), 'Required key "RunOut[context_snapshot]" is missing from JSON.');
        assert(json[r'context_snapshot'] != null, 'Required key "RunOut[context_snapshot]" has a null value in JSON.');
        assert(json.containsKey(r'attempt'), 'Required key "RunOut[attempt]" is missing from JSON.');
        assert(json[r'attempt'] != null, 'Required key "RunOut[attempt]" has a null value in JSON.');
        assert(json.containsKey(r'parent_run_id'), 'Required key "RunOut[parent_run_id]" is missing from JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "RunOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "RunOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "RunOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "RunOut[updated_at]" has a null value in JSON.');
        assert(json.containsKey(r'started_at'), 'Required key "RunOut[started_at]" is missing from JSON.');
        assert(json.containsKey(r'completed_at'), 'Required key "RunOut[completed_at]" is missing from JSON.');
        return true;
      }());

      return RunOut(
        id: mapValueOfType<String>(json, r'id')!,
        chatId: mapValueOfType<String>(json, r'chat_id')!,
        messageId: mapValueOfType<String>(json, r'message_id')!,
        projectId: mapValueOfType<String>(json, r'project_id'),
        capability: mapValueOfType<String>(json, r'capability')!,
        workflowId: mapValueOfType<String>(json, r'workflow_id')!,
        status: mapValueOfType<String>(json, r'status')!,
        stage: mapValueOfType<String>(json, r'stage')!,
        progress: json[r'progress'] == null
            ? null
            : num.parse('${json[r'progress']}'),
        prompt: mapValueOfType<String>(json, r'prompt')!,
        settings: mapCastOfType<String, Object>(json, r'settings')!,
        attachmentIds: json[r'attachment_ids'] is Iterable
            ? (json[r'attachment_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        artifactIds: json[r'artifact_ids'] is Iterable
            ? (json[r'artifact_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        outputText: mapValueOfType<String>(json, r'output_text')!,
        error: mapCastOfType<String, Object>(json, r'error'),
        estimatedCostUsd: num.parse('${json[r'estimated_cost_usd']}'),
        actualCostUsd: num.parse('${json[r'actual_cost_usd']}'),
        budgetUsd: num.parse('${json[r'budget_usd']}'),
        provider: mapValueOfType<String>(json, r'provider')!,
        model: mapValueOfType<String>(json, r'model')!,
        modelProvenance: mapCastOfType<String, Object>(json, r'model_provenance')!,
        contextSnapshot: (json[r'context_snapshot'] as List? ?? []).map((value) => Map<String, dynamic>.from(value as Map)).toList(),
        attempt: mapValueOfType<int>(json, r'attempt')!,
        parentRunId: mapValueOfType<String>(json, r'parent_run_id'),
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
        startedAt: mapDateTime(json, r'started_at', r''),
        completedAt: mapDateTime(json, r'completed_at', r''),
      );
    }
    return null;
  }

  static List<RunOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunOut> mapFromJson(dynamic json) {
    final map = <String, RunOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunOut-objects as value to a dart map
  static Map<String, List<RunOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'chat_id',
    'message_id',
    'project_id',
    'capability',
    'workflow_id',
    'status',
    'stage',
    'progress',
    'prompt',
    'settings',
    'attachment_ids',
    'artifact_ids',
    'output_text',
    'error',
    'estimated_cost_usd',
    'actual_cost_usd',
    'budget_usd',
    'provider',
    'model',
    'model_provenance',
    'context_snapshot',
    'attempt',
    'parent_run_id',
    'created_at',
    'updated_at',
    'started_at',
    'completed_at',
  };
}

