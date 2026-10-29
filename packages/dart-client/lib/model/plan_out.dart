//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PlanOut {
  /// Returns a new [PlanOut] instance.
  PlanOut({
    required this.version,
    required this.workspace,
    required this.eligible,
    this.reason,
  });

  /// Minimum value: 0
  int version;

  BuilderWorkspace workspace;

  bool eligible;

  String? reason;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PlanOut &&
    other.version == version &&
    other.workspace == workspace &&
    other.eligible == eligible &&
    other.reason == reason;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (version.hashCode) +
    (workspace.hashCode) +
    (eligible.hashCode) +
    (reason == null ? 0 : reason!.hashCode);

  @override
  String toString() => 'PlanOut[version=$version, workspace=$workspace, eligible=$eligible, reason=$reason]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'version'] = this.version;
      json[r'workspace'] = this.workspace;
      json[r'eligible'] = this.eligible;
    if (this.reason != null) {
      json[r'reason'] = this.reason;
    } else {
      json[r'reason'] = null;
    }
    return json;
  }

  /// Returns a new [PlanOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PlanOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'version'), 'Required key "PlanOut[version]" is missing from JSON.');
        assert(json[r'version'] != null, 'Required key "PlanOut[version]" has a null value in JSON.');
        assert(json.containsKey(r'workspace'), 'Required key "PlanOut[workspace]" is missing from JSON.');
        assert(json[r'workspace'] != null, 'Required key "PlanOut[workspace]" has a null value in JSON.');
        assert(json.containsKey(r'eligible'), 'Required key "PlanOut[eligible]" is missing from JSON.');
        assert(json[r'eligible'] != null, 'Required key "PlanOut[eligible]" has a null value in JSON.');
        return true;
      }());

      return PlanOut(
        version: mapValueOfType<int>(json, r'version')!,
        workspace: BuilderWorkspace.fromJson(json[r'workspace'])!,
        eligible: mapValueOfType<bool>(json, r'eligible')!,
        reason: mapValueOfType<String>(json, r'reason'),
      );
    }
    return null;
  }

  static List<PlanOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PlanOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PlanOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PlanOut> mapFromJson(dynamic json) {
    final map = <String, PlanOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PlanOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PlanOut-objects as value to a dart map
  static Map<String, List<PlanOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PlanOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PlanOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'version',
    'workspace',
    'eligible',
  };
}

