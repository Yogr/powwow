//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RefinementApply {
  /// Returns a new [RefinementApply] instance.
  RefinementApply({
    required this.runId,
    required this.version,
  });

  String runId;

  /// Minimum value: 1
  int version;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RefinementApply &&
    other.runId == runId &&
    other.version == version;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (runId.hashCode) +
    (version.hashCode);

  @override
  String toString() => 'RefinementApply[runId=$runId, version=$version]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'run_id'] = this.runId;
      json[r'version'] = this.version;
    return json;
  }

  /// Returns a new [RefinementApply] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RefinementApply? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'run_id'), 'Required key "RefinementApply[run_id]" is missing from JSON.');
        assert(json[r'run_id'] != null, 'Required key "RefinementApply[run_id]" has a null value in JSON.');
        assert(json.containsKey(r'version'), 'Required key "RefinementApply[version]" is missing from JSON.');
        assert(json[r'version'] != null, 'Required key "RefinementApply[version]" has a null value in JSON.');
        return true;
      }());

      return RefinementApply(
        runId: mapValueOfType<String>(json, r'run_id')!,
        version: mapValueOfType<int>(json, r'version')!,
      );
    }
    return null;
  }

  static List<RefinementApply> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RefinementApply>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RefinementApply.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RefinementApply> mapFromJson(dynamic json) {
    final map = <String, RefinementApply>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RefinementApply.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RefinementApply-objects as value to a dart map
  static Map<String, List<RefinementApply>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RefinementApply>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RefinementApply.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'run_id',
    'version',
  };
}

