//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguagePhraseCreate {
  /// Returns a new [LanguagePhraseCreate] instance.
  LanguagePhraseCreate({
    required this.text,
    required this.translation,
    this.note = '',
    this.sourceTurnId,
  });

  String text;

  String translation;

  String note;

  String? sourceTurnId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguagePhraseCreate &&
    other.text == text &&
    other.translation == translation &&
    other.note == note &&
    other.sourceTurnId == sourceTurnId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (text.hashCode) +
    (translation.hashCode) +
    (note.hashCode) +
    (sourceTurnId == null ? 0 : sourceTurnId!.hashCode);

  @override
  String toString() => 'LanguagePhraseCreate[text=$text, translation=$translation, note=$note, sourceTurnId=$sourceTurnId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'text'] = this.text;
      json[r'translation'] = this.translation;
      json[r'note'] = this.note;
    if (this.sourceTurnId != null) {
      json[r'source_turn_id'] = this.sourceTurnId;
    } else {
      json[r'source_turn_id'] = null;
    }
    return json;
  }

  /// Returns a new [LanguagePhraseCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguagePhraseCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'text'), 'Required key "LanguagePhraseCreate[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguagePhraseCreate[text]" has a null value in JSON.');
        assert(json.containsKey(r'translation'), 'Required key "LanguagePhraseCreate[translation]" is missing from JSON.');
        assert(json[r'translation'] != null, 'Required key "LanguagePhraseCreate[translation]" has a null value in JSON.');
        return true;
      }());

      return LanguagePhraseCreate(
        text: mapValueOfType<String>(json, r'text')!,
        translation: mapValueOfType<String>(json, r'translation')!,
        note: mapValueOfType<String>(json, r'note') ?? '',
        sourceTurnId: mapValueOfType<String>(json, r'source_turn_id'),
      );
    }
    return null;
  }

  static List<LanguagePhraseCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguagePhraseCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguagePhraseCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguagePhraseCreate> mapFromJson(dynamic json) {
    final map = <String, LanguagePhraseCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguagePhraseCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguagePhraseCreate-objects as value to a dart map
  static Map<String, List<LanguagePhraseCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguagePhraseCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguagePhraseCreate.listFromJson(entry.value, growable: growable,);
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

