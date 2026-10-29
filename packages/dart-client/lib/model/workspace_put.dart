//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkspacePut {
  /// Returns a new [WorkspacePut] instance.
  WorkspacePut({
    required this.version,
    required this.workspace,
  });

  /// Minimum value: 0
  int version;

  BuilderWorkspace workspace;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkspacePut &&
    other.version == version &&
    other.workspace == workspace;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (version.hashCode) +
    (workspace.hashCode);

  @override
  String toString() => 'WorkspacePut[version=$version, workspace=$workspace]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'version'] = this.version;
      json[r'workspace'] = this.workspace;
    return json;
  }

  /// Returns a new [WorkspacePut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkspacePut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'version'), 'Required key "WorkspacePut[version]" is missing from JSON.');
        assert(json[r'version'] != null, 'Required key "WorkspacePut[version]" has a null value in JSON.');
        assert(json.containsKey(r'workspace'), 'Required key "WorkspacePut[workspace]" is missing from JSON.');
        assert(json[r'workspace'] != null, 'Required key "WorkspacePut[workspace]" has a null value in JSON.');
        return true;
      }());

      return WorkspacePut(
        version: mapValueOfType<int>(json, r'version')!,
        workspace: BuilderWorkspace.fromJson(json[r'workspace'])!,
      );
    }
    return null;
  }

  static List<WorkspacePut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkspacePut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkspacePut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkspacePut> mapFromJson(dynamic json) {
    final map = <String, WorkspacePut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkspacePut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkspacePut-objects as value to a dart map
  static Map<String, List<WorkspacePut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkspacePut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkspacePut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'version',
    'workspace',
  };
}

