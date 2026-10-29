//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AgentCreate {
  /// Returns a new [AgentCreate] instance.
  AgentCreate({
    required this.name,
    this.description = '',
    this.instructions = '',
    this.modelId,
    this.mcpIds = const [],
    this.enabled = true,
  });

  String name;

  String description;

  String instructions;

  String? modelId;

  List<String> mcpIds;

  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AgentCreate &&
    other.name == name &&
    other.description == description &&
    other.instructions == instructions &&
    other.modelId == modelId &&
    _deepEquality.equals(other.mcpIds, mcpIds) &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (description.hashCode) +
    (instructions.hashCode) +
    (modelId == null ? 0 : modelId!.hashCode) +
    (mcpIds.hashCode) +
    (enabled.hashCode);

  @override
  String toString() => 'AgentCreate[name=$name, description=$description, instructions=$instructions, modelId=$modelId, mcpIds=$mcpIds, enabled=$enabled]';

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
    return json;
  }

  /// Returns a new [AgentCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AgentCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "AgentCreate[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "AgentCreate[name]" has a null value in JSON.');
        return true;
      }());

      return AgentCreate(
        name: mapValueOfType<String>(json, r'name')!,
        description: mapValueOfType<String>(json, r'description') ?? '',
        instructions: mapValueOfType<String>(json, r'instructions') ?? '',
        modelId: mapValueOfType<String>(json, r'model_id'),
        mcpIds: json[r'mcp_ids'] is Iterable
            ? (json[r'mcp_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        enabled: mapValueOfType<bool>(json, r'enabled') ?? true,
      );
    }
    return null;
  }

  static List<AgentCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AgentCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AgentCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AgentCreate> mapFromJson(dynamic json) {
    final map = <String, AgentCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AgentCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AgentCreate-objects as value to a dart map
  static Map<String, List<AgentCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AgentCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AgentCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}

