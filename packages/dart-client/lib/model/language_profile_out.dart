//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageProfileOut {
  /// Returns a new [LanguageProfileOut] instance.
  LanguageProfileOut({
    required this.learnerName,
    required this.targetLanguage,
    this.nativeLanguage = 'en',
    this.level = 'beginner',
    this.timezone = 'UTC',
    required this.id,
    required this.projectId,
    required this.startDate,
    required this.createdAt,
    required this.updatedAt,
  });

  String learnerName;

  String targetLanguage;

  String nativeLanguage;

  String level;

  String timezone;

  String id;

  String projectId;

  String startDate;

  DateTime createdAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageProfileOut &&
    other.learnerName == learnerName &&
    other.targetLanguage == targetLanguage &&
    other.nativeLanguage == nativeLanguage &&
    other.level == level &&
    other.timezone == timezone &&
    other.id == id &&
    other.projectId == projectId &&
    other.startDate == startDate &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (learnerName.hashCode) +
    (targetLanguage.hashCode) +
    (nativeLanguage.hashCode) +
    (level.hashCode) +
    (timezone.hashCode) +
    (id.hashCode) +
    (projectId.hashCode) +
    (startDate.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'LanguageProfileOut[learnerName=$learnerName, targetLanguage=$targetLanguage, nativeLanguage=$nativeLanguage, level=$level, timezone=$timezone, id=$id, projectId=$projectId, startDate=$startDate, createdAt=$createdAt, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'learner_name'] = this.learnerName;
      json[r'target_language'] = this.targetLanguage;
      json[r'native_language'] = this.nativeLanguage;
      json[r'level'] = this.level;
      json[r'timezone'] = this.timezone;
      json[r'id'] = this.id;
      json[r'project_id'] = this.projectId;
      json[r'start_date'] = this.startDate;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [LanguageProfileOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageProfileOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'learner_name'), 'Required key "LanguageProfileOut[learner_name]" is missing from JSON.');
        assert(json[r'learner_name'] != null, 'Required key "LanguageProfileOut[learner_name]" has a null value in JSON.');
        assert(json.containsKey(r'target_language'), 'Required key "LanguageProfileOut[target_language]" is missing from JSON.');
        assert(json[r'target_language'] != null, 'Required key "LanguageProfileOut[target_language]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "LanguageProfileOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "LanguageProfileOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'project_id'), 'Required key "LanguageProfileOut[project_id]" is missing from JSON.');
        assert(json[r'project_id'] != null, 'Required key "LanguageProfileOut[project_id]" has a null value in JSON.');
        assert(json.containsKey(r'start_date'), 'Required key "LanguageProfileOut[start_date]" is missing from JSON.');
        assert(json[r'start_date'] != null, 'Required key "LanguageProfileOut[start_date]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "LanguageProfileOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "LanguageProfileOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "LanguageProfileOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "LanguageProfileOut[updated_at]" has a null value in JSON.');
        return true;
      }());

      return LanguageProfileOut(
        learnerName: mapValueOfType<String>(json, r'learner_name')!,
        targetLanguage: mapValueOfType<String>(json, r'target_language')!,
        nativeLanguage: mapValueOfType<String>(json, r'native_language') ?? 'en',
        level: mapValueOfType<String>(json, r'level') ?? 'beginner',
        timezone: mapValueOfType<String>(json, r'timezone') ?? 'UTC',
        id: mapValueOfType<String>(json, r'id')!,
        projectId: mapValueOfType<String>(json, r'project_id')!,
        startDate: mapValueOfType<String>(json, r'start_date')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
      );
    }
    return null;
  }

  static List<LanguageProfileOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageProfileOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageProfileOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageProfileOut> mapFromJson(dynamic json) {
    final map = <String, LanguageProfileOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageProfileOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageProfileOut-objects as value to a dart map
  static Map<String, List<LanguageProfileOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageProfileOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageProfileOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'learner_name',
    'target_language',
    'id',
    'project_id',
    'start_date',
    'created_at',
    'updated_at',
  };
}

