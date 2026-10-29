//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageCorrection {
  /// Returns a new [LanguageCorrection] instance.
  LanguageCorrection({
    required this.original,
    required this.corrected,
    required this.explanation,
  });

  String original;

  String corrected;

  String explanation;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageCorrection &&
    other.original == original &&
    other.corrected == corrected &&
    other.explanation == explanation;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (original.hashCode) +
    (corrected.hashCode) +
    (explanation.hashCode);

  @override
  String toString() => 'LanguageCorrection[original=$original, corrected=$corrected, explanation=$explanation]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'original'] = this.original;
      json[r'corrected'] = this.corrected;
      json[r'explanation'] = this.explanation;
    return json;
  }

  /// Returns a new [LanguageCorrection] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageCorrection? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'original'), 'Required key "LanguageCorrection[original]" is missing from JSON.');
        assert(json[r'original'] != null, 'Required key "LanguageCorrection[original]" has a null value in JSON.');
        assert(json.containsKey(r'corrected'), 'Required key "LanguageCorrection[corrected]" is missing from JSON.');
        assert(json[r'corrected'] != null, 'Required key "LanguageCorrection[corrected]" has a null value in JSON.');
        assert(json.containsKey(r'explanation'), 'Required key "LanguageCorrection[explanation]" is missing from JSON.');
        assert(json[r'explanation'] != null, 'Required key "LanguageCorrection[explanation]" has a null value in JSON.');
        return true;
      }());

      return LanguageCorrection(
        original: mapValueOfType<String>(json, r'original')!,
        corrected: mapValueOfType<String>(json, r'corrected')!,
        explanation: mapValueOfType<String>(json, r'explanation')!,
      );
    }
    return null;
  }

  static List<LanguageCorrection> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageCorrection>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageCorrection.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageCorrection> mapFromJson(dynamic json) {
    final map = <String, LanguageCorrection>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageCorrection.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageCorrection-objects as value to a dart map
  static Map<String, List<LanguageCorrection>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageCorrection>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageCorrection.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'original',
    'corrected',
    'explanation',
  };
}

