//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageSuggestion {
  /// Returns a new [LanguageSuggestion] instance.
  LanguageSuggestion({
    required this.text,
    required this.translation,
  });

  String text;

  String translation;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageSuggestion &&
    other.text == text &&
    other.translation == translation;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (text.hashCode) +
    (translation.hashCode);

  @override
  String toString() => 'LanguageSuggestion[text=$text, translation=$translation]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'text'] = this.text;
      json[r'translation'] = this.translation;
    return json;
  }

  /// Returns a new [LanguageSuggestion] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageSuggestion? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'text'), 'Required key "LanguageSuggestion[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguageSuggestion[text]" has a null value in JSON.');
        assert(json.containsKey(r'translation'), 'Required key "LanguageSuggestion[translation]" is missing from JSON.');
        assert(json[r'translation'] != null, 'Required key "LanguageSuggestion[translation]" has a null value in JSON.');
        return true;
      }());

      return LanguageSuggestion(
        text: mapValueOfType<String>(json, r'text')!,
        translation: mapValueOfType<String>(json, r'translation')!,
      );
    }
    return null;
  }

  static List<LanguageSuggestion> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageSuggestion>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageSuggestion.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageSuggestion> mapFromJson(dynamic json) {
    final map = <String, LanguageSuggestion>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageSuggestion.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageSuggestion-objects as value to a dart map
  static Map<String, List<LanguageSuggestion>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageSuggestion>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageSuggestion.listFromJson(entry.value, growable: growable,);
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

