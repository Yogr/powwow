//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageVocabulary {
  /// Returns a new [LanguageVocabulary] instance.
  LanguageVocabulary({
    required this.text,
    required this.translation,
    this.note = '',
  });

  String text;

  String translation;

  String note;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageVocabulary &&
    other.text == text &&
    other.translation == translation &&
    other.note == note;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (text.hashCode) +
    (translation.hashCode) +
    (note.hashCode);

  @override
  String toString() => 'LanguageVocabulary[text=$text, translation=$translation, note=$note]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'text'] = this.text;
      json[r'translation'] = this.translation;
      json[r'note'] = this.note;
    return json;
  }

  /// Returns a new [LanguageVocabulary] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageVocabulary? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'text'), 'Required key "LanguageVocabulary[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguageVocabulary[text]" has a null value in JSON.');
        assert(json.containsKey(r'translation'), 'Required key "LanguageVocabulary[translation]" is missing from JSON.');
        assert(json[r'translation'] != null, 'Required key "LanguageVocabulary[translation]" has a null value in JSON.');
        return true;
      }());

      return LanguageVocabulary(
        text: mapValueOfType<String>(json, r'text')!,
        translation: mapValueOfType<String>(json, r'translation')!,
        note: mapValueOfType<String>(json, r'note') ?? '',
      );
    }
    return null;
  }

  static List<LanguageVocabulary> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageVocabulary>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageVocabulary.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageVocabulary> mapFromJson(dynamic json) {
    final map = <String, LanguageVocabulary>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageVocabulary.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageVocabulary-objects as value to a dart map
  static Map<String, List<LanguageVocabulary>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageVocabulary>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageVocabulary.listFromJson(entry.value, growable: growable,);
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

