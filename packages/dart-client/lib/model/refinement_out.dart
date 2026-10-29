//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RefinementOut {
  /// Returns a new [RefinementOut] instance.
  RefinementOut({
    required this.design,
    this.tasks = const [],
    required this.runId,
    required this.version,
  });

  String design;

  List<BuilderTask> tasks;

  String runId;

  int version;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RefinementOut &&
    other.design == design &&
    _deepEquality.equals(other.tasks, tasks) &&
    other.runId == runId &&
    other.version == version;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (design.hashCode) +
    (tasks.hashCode) +
    (runId.hashCode) +
    (version.hashCode);

  @override
  String toString() => 'RefinementOut[design=$design, tasks=$tasks, runId=$runId, version=$version]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'design'] = this.design;
      json[r'tasks'] = this.tasks;
      json[r'run_id'] = this.runId;
      json[r'version'] = this.version;
    return json;
  }

  /// Returns a new [RefinementOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RefinementOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'design'), 'Required key "RefinementOut[design]" is missing from JSON.');
        assert(json[r'design'] != null, 'Required key "RefinementOut[design]" has a null value in JSON.');
        assert(json.containsKey(r'run_id'), 'Required key "RefinementOut[run_id]" is missing from JSON.');
        assert(json[r'run_id'] != null, 'Required key "RefinementOut[run_id]" has a null value in JSON.');
        assert(json.containsKey(r'version'), 'Required key "RefinementOut[version]" is missing from JSON.');
        assert(json[r'version'] != null, 'Required key "RefinementOut[version]" has a null value in JSON.');
        return true;
      }());

      return RefinementOut(
        design: mapValueOfType<String>(json, r'design')!,
        tasks: BuilderTask.listFromJson(json[r'tasks']),
        runId: mapValueOfType<String>(json, r'run_id')!,
        version: mapValueOfType<int>(json, r'version')!,
      );
    }
    return null;
  }

  static List<RefinementOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RefinementOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RefinementOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RefinementOut> mapFromJson(dynamic json) {
    final map = <String, RefinementOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RefinementOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RefinementOut-objects as value to a dart map
  static Map<String, List<RefinementOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RefinementOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RefinementOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'design',
    'run_id',
    'version',
  };
}

