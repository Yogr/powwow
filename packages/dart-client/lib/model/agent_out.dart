//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AgentOut {
  /// Returns a new [AgentOut] instance.
  AgentOut({
    required this.name,
    this.description = '',
    this.instructions = '',
    this.modelId,
    this.mcpIds = const [],
    this.enabled = true,
    required this.id,
    required this.organizationId,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.executionAvailable = false,
  });

  String name;

  String description;

  String instructions;

  String? modelId;

  List<String> mcpIds;

  bool enabled;

  String id;

  String organizationId;

  String createdBy;

  DateTime createdAt;

  DateTime updatedAt;

  bool executionAvailable;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AgentOut &&
    other.name == name &&
    other.description == description &&
    other.instructions == instructions &&
    other.modelId == modelId &&
    _deepEquality.equals(other.mcpIds, mcpIds) &&
    other.enabled == enabled &&
    other.id == id &&
    other.organizationId == organizationId &&
    other.createdBy == createdBy &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt &&
    other.executionAvailable == executionAvailable;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (description.hashCode) +
    (instructions.hashCode) +
    (modelId == null ? 0 : modelId!.hashCode) +
    (mcpIds.hashCode) +
    (enabled.hashCode) +
    (id.hashCode) +
    (organizationId.hashCode) +
    (createdBy.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode) +
    (executionAvailable.hashCode);

  @override
  String toString() => 'AgentOut[name=$name, description=$description, instructions=$instructions, modelId=$modelId, mcpIds=$mcpIds, enabled=$enabled, id=$id, organizationId=$organizationId, createdBy=$createdBy, createdAt=$createdAt, updatedAt=$updatedAt, executionAvailable=$executionAvailable]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
      json[r'description'] = this.description;
      json[r'instructions'] = this.instructions;
    if (this.modelId != null) {
      json[r'model_id'] = this.modelId;
    } else {
      json[r'model_id'] = null;
    }
      json[r'mcp_ids'] = this.mcpIds;
      json[r'enabled'] = this.enabled;
      json[r'id'] = this.id;
      json[r'organization_id'] = this.organizationId;
      json[r'created_by'] = this.createdBy;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
      json[r'execution_available'] = this.executionAvailable;
    return json;
  }

  /// Returns a new [AgentOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AgentOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "AgentOut[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "AgentOut[name]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "AgentOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "AgentOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'organization_id'), 'Required key "AgentOut[organization_id]" is missing from JSON.');
        assert(json[r'organization_id'] != null, 'Required key "AgentOut[organization_id]" has a null value in JSON.');
        assert(json.containsKey(r'created_by'), 'Required key "AgentOut[created_by]" is missing from JSON.');
        assert(json[r'created_by'] != null, 'Required key "AgentOut[created_by]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "AgentOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "AgentOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "AgentOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "AgentOut[updated_at]" has a null value in JSON.');
        return true;
      }());

      return AgentOut(
        name: mapValueOfType<String>(json, r'name')!,
        description: mapValueOfType<String>(json, r'description') ?? '',
        instructions: mapValueOfType<String>(json, r'instructions') ?? '',
        modelId: mapValueOfType<String>(json, r'model_id'),
        mcpIds: json[r'mcp_ids'] is Iterable
            ? (json[r'mcp_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        enabled: mapValueOfType<bool>(json, r'enabled') ?? true,
        id: mapValueOfType<String>(json, r'id')!,
        organizationId: mapValueOfType<String>(json, r'organization_id')!,
        createdBy: mapValueOfType<String>(json, r'created_by')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
        executionAvailable: mapValueOfType<bool>(json, r'execution_available') ?? false,
      );
    }
    return null;
  }

  static List<AgentOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AgentOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AgentOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AgentOut> mapFromJson(dynamic json) {
    final map = <String, AgentOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AgentOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AgentOut-objects as value to a dart map
  static Map<String, List<AgentOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AgentOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AgentOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'id',
    'organization_id',
    'created_by',
    'created_at',
    'updated_at',
  };
}

