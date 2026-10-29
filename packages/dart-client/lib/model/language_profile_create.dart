//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageProfileCreate {
  /// Returns a new [LanguageProfileCreate] instance.
  LanguageProfileCreate({
    required this.learnerName,
    required this.targetLanguage,
    this.nativeLanguage = 'en',
    this.level = 'beginner',
    this.timezone = 'UTC',
  });

  String learnerName;

  String targetLanguage;

  String nativeLanguage;

  String level;

  String timezone;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageProfileCreate &&
    other.learnerName == learnerName &&
    other.targetLanguage == targetLanguage &&
    other.nativeLanguage == nativeLanguage &&
    other.level == level &&
    other.timezone == timezone;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (learnerName.hashCode) +
    (targetLanguage.hashCode) +
    (nativeLanguage.hashCode) +
    (level.hashCode) +
    (timezone.hashCode);

  @override
  String toString() => 'LanguageProfileCreate[learnerName=$learnerName, targetLanguage=$targetLanguage, nativeLanguage=$nativeLanguage, level=$level, timezone=$timezone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'learner_name'] = this.learnerName;
      json[r'target_language'] = this.targetLanguage;
      json[r'native_language'] = this.nativeLanguage;
      json[r'level'] = this.level;
      json[r'timezone'] = this.timezone;
    return json;
  }

  /// Returns a new [LanguageProfileCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageProfileCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'learner_name'), 'Required key "LanguageProfileCreate[learner_name]" is missing from JSON.');
        assert(json[r'learner_name'] != null, 'Required key "LanguageProfileCreate[learner_name]" has a null value in JSON.');
        assert(json.containsKey(r'target_language'), 'Required key "LanguageProfileCreate[target_language]" is missing from JSON.');
        assert(json[r'target_language'] != null, 'Required key "LanguageProfileCreate[target_language]" has a null value in JSON.');
        return true;
      }());

      return LanguageProfileCreate(
        learnerName: mapValueOfType<String>(json, r'learner_name')!,
        targetLanguage: mapValueOfType<String>(json, r'target_language')!,
        nativeLanguage: mapValueOfType<String>(json, r'native_language') ?? 'en',
        level: mapValueOfType<String>(json, r'level') ?? 'beginner',
        timezone: mapValueOfType<String>(json, r'timezone') ?? 'UTC',
      );
    }
    return null;
  }

  static List<LanguageProfileCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageProfileCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageProfileCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageProfileCreate> mapFromJson(dynamic json) {
    final map = <String, LanguageProfileCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageProfileCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageProfileCreate-objects as value to a dart map
  static Map<String, List<LanguageProfileCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageProfileCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageProfileCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'learner_name',
    'target_language',
  };
}

