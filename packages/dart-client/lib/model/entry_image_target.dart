//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EntryImageTarget {
  /// Returns a new [EntryImageTarget] instance.
  EntryImageTarget({
    required this.categoryId,
    required this.recordId,
    this.field = EntryImageTargetFieldEnum.reference,
    this.expectedReference = '',
  });

  String categoryId;

  String recordId;

  EntryImageTargetFieldEnum field;

  String expectedReference;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EntryImageTarget &&
    other.categoryId == categoryId &&
    other.recordId == recordId &&
    other.field == field &&
    other.expectedReference == expectedReference;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (categoryId.hashCode) +
    (recordId.hashCode) +
    (field.hashCode) +
    (expectedReference.hashCode);

  @override
  String toString() => 'EntryImageTarget[categoryId=$categoryId, recordId=$recordId, field=$field, expectedReference=$expectedReference]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'category_id'] = this.categoryId;
      json[r'record_id'] = this.recordId;
      json[r'field'] = this.field;
      json[r'expected_reference'] = this.expectedReference;
    return json;
  }

  /// Returns a new [EntryImageTarget] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EntryImageTarget? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'category_id'), 'Required key "EntryImageTarget[category_id]" is missing from JSON.');
        assert(json[r'category_id'] != null, 'Required key "EntryImageTarget[category_id]" has a null value in JSON.');
        assert(json.containsKey(r'record_id'), 'Required key "EntryImageTarget[record_id]" is missing from JSON.');
        assert(json[r'record_id'] != null, 'Required key "EntryImageTarget[record_id]" has a null value in JSON.');
        return true;
      }());

      return EntryImageTarget(
        categoryId: mapValueOfType<String>(json, r'category_id')!,
        recordId: mapValueOfType<String>(json, r'record_id')!,
        field: EntryImageTargetFieldEnum.fromJson(json[r'field']) ?? EntryImageTargetFieldEnum.reference,
        expectedReference: mapValueOfType<String>(json, r'expected_reference') ?? '',
      );
    }
    return null;
  }

  static List<EntryImageTarget> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EntryImageTarget>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EntryImageTarget.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EntryImageTarget> mapFromJson(dynamic json) {
    final map = <String, EntryImageTarget>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EntryImageTarget.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EntryImageTarget-objects as value to a dart map
  static Map<String, List<EntryImageTarget>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EntryImageTarget>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EntryImageTarget.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'category_id',
    'record_id',
  };
}


enum EntryImageTargetFieldEnum {
  reference._(r'reference'),
  firstImage._(r'first_image'),
  lastImage._(r'last_image'),
  ;

  /// Instantiate a new enum with the provided value.
  const EntryImageTargetFieldEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [EntryImageTargetFieldEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static EntryImageTargetFieldEnum? fromJson(dynamic value) => EntryImageTargetFieldEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [EntryImageTargetFieldEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<EntryImageTargetFieldEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EntryImageTargetFieldEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EntryImageTargetFieldEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [EntryImageTargetFieldEnum] to String,
/// and [decode] dynamic data back to [EntryImageTargetFieldEnum].
class EntryImageTargetFieldEnumTypeTransformer {
  factory EntryImageTargetFieldEnumTypeTransformer() => _instance ??= const EntryImageTargetFieldEnumTypeTransformer._();

  const EntryImageTargetFieldEnumTypeTransformer._();

  String encode(EntryImageTargetFieldEnum data) => data._value;

  /// Returns the instance of [EntryImageTargetFieldEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  EntryImageTargetFieldEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is EntryImageTargetFieldEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'reference': return EntryImageTargetFieldEnum.reference;
        case r'first_image': return EntryImageTargetFieldEnum.firstImage;
        case r'last_image': return EntryImageTargetFieldEnum.lastImage;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static EntryImageTargetFieldEnumTypeTransformer? _instance;
}


