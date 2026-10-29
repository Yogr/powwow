//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BuilderRecord {
  /// Returns a new [BuilderRecord] instance.
  BuilderRecord({
    required this.id,
    required this.title,
    this.fields = const {},
  });

  String id;

  String title;

  Map<String, String> fields;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BuilderRecord &&
    other.id == id &&
    other.title == title &&
    _deepEquality.equals(other.fields, fields);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (title.hashCode) +
    (fields.hashCode);

  @override
  String toString() => 'BuilderRecord[id=$id, title=$title, fields=$fields]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'title'] = this.title;
      json[r'fields'] = this.fields;
    return json;
  }

  /// Returns a new [BuilderRecord] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BuilderRecord? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "BuilderRecord[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "BuilderRecord[id]" has a null value in JSON.');
        assert(json.containsKey(r'title'), 'Required key "BuilderRecord[title]" is missing from JSON.');
        assert(json[r'title'] != null, 'Required key "BuilderRecord[title]" has a null value in JSON.');
        return true;
      }());

      return BuilderRecord(
        id: mapValueOfType<String>(json, r'id')!,
        title: mapValueOfType<String>(json, r'title')!,
        fields: mapCastOfType<String, String>(json, r'fields') ?? const {},
      );
    }
    return null;
  }

  static List<BuilderRecord> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BuilderRecord>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BuilderRecord.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BuilderRecord> mapFromJson(dynamic json) {
    final map = <String, BuilderRecord>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BuilderRecord.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BuilderRecord-objects as value to a dart map
  static Map<String, List<BuilderRecord>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BuilderRecord>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BuilderRecord.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'title',
  };
}

