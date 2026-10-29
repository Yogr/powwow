//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AgentPatch {
  /// Returns a new [AgentPatch] instance.
  AgentPatch({
    this.name,
    this.description,
    this.instructions,
    this.modelId,
    this.mcpIds = const [],
    this.enabled,
  });

  String? name;

  String? description;

  String? instructions;

  String? modelId;

  List<String>? mcpIds;

  bool? enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AgentPatch &&
    other.name == name &&
    other.description == description &&
    other.instructions == instructions &&
    other.modelId == modelId &&
    _deepEquality.equals(other.mcpIds, mcpIds) &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (instructions == null ? 0 : instructions!.hashCode) +
    (modelId == null ? 0 : modelId!.hashCode) +
    (mcpIds == null ? 0 : mcpIds!.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode);

  @override
  String toString() => 'AgentPatch[name=$name, description=$description, instructions=$instructions, modelId=$modelId, mcpIds=$mcpIds, enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
      json[r'name'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
      json[r'description'] = null;
    }
    if (this.instructions != null) {
      json[r'instructions'] = this.instructions;
    } else {
      json[r'instructions'] = null;
    }
    if (this.modelId != null) {
      json[r'model_id'] = this.modelId;
    } else {
      json[r'model_id'] = null;
    }
    if (this.mcpIds != null) {
      json[r'mcp_ids'] = this.mcpIds;
    } else {
      json[r'mcp_ids'] = null;
    }
    if (this.enabled != null) {
      json[r'enabled'] = this.enabled;
    } else {
      json[r'enabled'] = null;
    }
    return json;
  }

  /// Returns a new [AgentPatch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AgentPatch? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return AgentPatch(
        name: mapValueOfType<String>(json, r'name'),
        description: mapValueOfType<String>(json, r'description'),
        instructions: mapValueOfType<String>(json, r'instructions'),
        modelId: mapValueOfType<String>(json, r'model_id'),
        mcpIds: json[r'mcp_ids'] is Iterable
            ? (json[r'mcp_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        enabled: mapValueOfType<bool>(json, r'enabled'),
      );
    }
    return null;
  }

  static List<AgentPatch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AgentPatch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AgentPatch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AgentPatch> mapFromJson(dynamic json) {
    final map = <String, AgentPatch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AgentPatch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AgentPatch-objects as value to a dart map
  static Map<String, List<AgentPatch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AgentPatch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AgentPatch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

