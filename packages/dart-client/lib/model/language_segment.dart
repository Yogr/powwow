//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageSegment {
  /// Returns a new [LanguageSegment] instance.
  LanguageSegment({
    required this.text,
    required this.translation,
  });

  String text;

  String translation;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageSegment &&
    other.text == text &&
    other.translation == translation;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (text.hashCode) +
    (translation.hashCode);

  @override
  String toString() => 'LanguageSegment[text=$text, translation=$translation]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'text'] = this.text;
      json[r'translation'] = this.translation;
    return json;
  }

  /// Returns a new [LanguageSegment] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageSegment? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'text'), 'Required key "LanguageSegment[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguageSegment[text]" has a null value in JSON.');
        assert(json.containsKey(r'translation'), 'Required key "LanguageSegment[translation]" is missing from JSON.');
        assert(json[r'translation'] != null, 'Required key "LanguageSegment[translation]" has a null value in JSON.');
        return true;
      }());

      return LanguageSegment(
        text: mapValueOfType<String>(json, r'text')!,
        translation: mapValueOfType<String>(json, r'translation')!,
      );
    }
    return null;
  }

  static List<LanguageSegment> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageSegment>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageSegment.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageSegment> mapFromJson(dynamic json) {
    final map = <String, LanguageSegment>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageSegment.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageSegment-objects as value to a dart map
  static Map<String, List<LanguageSegment>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageSegment>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageSegment.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'text',
    'translation',
  };
}

