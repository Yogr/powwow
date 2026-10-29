//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LocalSaveReceipt {
  /// Returns a new [LocalSaveReceipt] instance.
  LocalSaveReceipt({
    required this.sha256,
    required this.sizeBytes,
  });

  String sha256;

  /// Minimum value: 0
  int sizeBytes;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LocalSaveReceipt &&
    other.sha256 == sha256 &&
    other.sizeBytes == sizeBytes;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sha256.hashCode) +
    (sizeBytes.hashCode);

  @override
  String toString() => 'LocalSaveReceipt[sha256=$sha256, sizeBytes=$sizeBytes]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'sha256'] = this.sha256;
      json[r'size_bytes'] = this.sizeBytes;
    return json;
  }

  /// Returns a new [LocalSaveReceipt] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LocalSaveReceipt? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'sha256'), 'Required key "LocalSaveReceipt[sha256]" is missing from JSON.');
        assert(json[r'sha256'] != null, 'Required key "LocalSaveReceipt[sha256]" has a null value in JSON.');
        assert(json.containsKey(r'size_bytes'), 'Required key "LocalSaveReceipt[size_bytes]" is missing from JSON.');
        assert(json[r'size_bytes'] != null, 'Required key "LocalSaveReceipt[size_bytes]" has a null value in JSON.');
        return true;
      }());

      return LocalSaveReceipt(
        sha256: mapValueOfType<String>(json, r'sha256')!,
        sizeBytes: mapValueOfType<int>(json, r'size_bytes')!,
      );
    }
    return null;
  }

  static List<LocalSaveReceipt> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LocalSaveReceipt>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LocalSaveReceipt.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LocalSaveReceipt> mapFromJson(dynamic json) {
    final map = <String, LocalSaveReceipt>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LocalSaveReceipt.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LocalSaveReceipt-objects as value to a dart map
  static Map<String, List<LocalSaveReceipt>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LocalSaveReceipt>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LocalSaveReceipt.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sha256',
    'size_bytes',
  };
}

