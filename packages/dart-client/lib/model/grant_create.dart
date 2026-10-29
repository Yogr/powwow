//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GrantCreate {
  /// Returns a new [GrantCreate] instance.
  GrantCreate({
    required this.destinationProjectId,
    required this.sourceType,
    required this.sourceId,
    this.mode = GrantCreateModeEnum.snapshot,
  });

  String destinationProjectId;

  GrantCreateSourceTypeEnum sourceType;

  String sourceId;

  GrantCreateModeEnum mode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GrantCreate &&
    other.destinationProjectId == destinationProjectId &&
    other.sourceType == sourceType &&
    other.sourceId == sourceId &&
    other.mode == mode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (destinationProjectId.hashCode) +
    (sourceType.hashCode) +
    (sourceId.hashCode) +
    (mode.hashCode);

  @override
  String toString() => 'GrantCreate[destinationProjectId=$destinationProjectId, sourceType=$sourceType, sourceId=$sourceId, mode=$mode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'destination_project_id'] = this.destinationProjectId;
      json[r'source_type'] = this.sourceType;
      json[r'source_id'] = this.sourceId;
      json[r'mode'] = this.mode;
    return json;
  }

  /// Returns a new [GrantCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GrantCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'destination_project_id'), 'Required key "GrantCreate[destination_project_id]" is missing from JSON.');
        assert(json[r'destination_project_id'] != null, 'Required key "GrantCreate[destination_project_id]" has a null value in JSON.');
        assert(json.containsKey(r'source_type'), 'Required key "GrantCreate[source_type]" is missing from JSON.');
        assert(json[r'source_type'] != null, 'Required key "GrantCreate[source_type]" has a null value in JSON.');
        assert(json.containsKey(r'source_id'), 'Required key "GrantCreate[source_id]" is missing from JSON.');
        assert(json[r'source_id'] != null, 'Required key "GrantCreate[source_id]" has a null value in JSON.');
        return true;
      }());

      return GrantCreate(
        destinationProjectId: mapValueOfType<String>(json, r'destination_project_id')!,
        sourceType: GrantCreateSourceTypeEnum.fromJson(json[r'source_type'])!,
        sourceId: mapValueOfType<String>(json, r'source_id')!,
        mode: GrantCreateModeEnum.fromJson(json[r'mode']) ?? GrantCreateModeEnum.snapshot,
      );
    }
    return null;
  }

  static List<GrantCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GrantCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GrantCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GrantCreate> mapFromJson(dynamic json) {
    final map = <String, GrantCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GrantCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GrantCreate-objects as value to a dart map
  static Map<String, List<GrantCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GrantCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GrantCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'destination_project_id',
    'source_type',
    'source_id',
  };
}


enum GrantCreateSourceTypeEnum {
  project._(r'project'),
  chat._(r'chat'),
  artifact._(r'artifact'),
  ;

  /// Instantiate a new enum with the provided value.
  const GrantCreateSourceTypeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GrantCreateSourceTypeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GrantCreateSourceTypeEnum? fromJson(dynamic value) => GrantCreateSourceTypeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GrantCreateSourceTypeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GrantCreateSourceTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GrantCreateSourceTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GrantCreateSourceTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GrantCreateSourceTypeEnum] to String,
/// and [decode] dynamic data back to [GrantCreateSourceTypeEnum].
class GrantCreateSourceTypeEnumTypeTransformer {
  factory GrantCreateSourceTypeEnumTypeTransformer() => _instance ??= const GrantCreateSourceTypeEnumTypeTransformer._();

  const GrantCreateSourceTypeEnumTypeTransformer._();

  String encode(GrantCreateSourceTypeEnum data) => data._value;

  /// Returns the instance of [GrantCreateSourceTypeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GrantCreateSourceTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GrantCreateSourceTypeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'project': return GrantCreateSourceTypeEnum.project;
        case r'chat': return GrantCreateSourceTypeEnum.chat;
        case r'artifact': return GrantCreateSourceTypeEnum.artifact;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GrantCreateSourceTypeEnumTypeTransformer? _instance;
}



enum GrantCreateModeEnum {
  snapshot._(r'snapshot'),
  live._(r'live'),
  ;

  /// Instantiate a new enum with the provided value.
  const GrantCreateModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GrantCreateModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GrantCreateModeEnum? fromJson(dynamic value) => GrantCreateModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GrantCreateModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GrantCreateModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GrantCreateModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GrantCreateModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GrantCreateModeEnum] to String,
/// and [decode] dynamic data back to [GrantCreateModeEnum].
class GrantCreateModeEnumTypeTransformer {
  factory GrantCreateModeEnumTypeTransformer() => _instance ??= const GrantCreateModeEnumTypeTransformer._();

  const GrantCreateModeEnumTypeTransformer._();

  String encode(GrantCreateModeEnum data) => data._value;

  /// Returns the instance of [GrantCreateModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GrantCreateModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GrantCreateModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'snapshot': return GrantCreateModeEnum.snapshot;
        case r'live': return GrantCreateModeEnum.live;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GrantCreateModeEnumTypeTransformer? _instance;
}


