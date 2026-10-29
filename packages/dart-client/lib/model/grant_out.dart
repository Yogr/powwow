//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GrantOut {
  /// Returns a new [GrantOut] instance.
  GrantOut({
    required this.destinationProjectId,
    required this.sourceType,
    required this.sourceId,
    this.mode = GrantOutModeEnum.snapshot,
    required this.id,
    required this.sourceName,
    required this.createdAt,
    required this.revokedAt,
  });

  String destinationProjectId;

  GrantOutSourceTypeEnum sourceType;

  String sourceId;

  GrantOutModeEnum mode;

  String id;

  String sourceName;

  DateTime createdAt;

  DateTime? revokedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GrantOut &&
    other.destinationProjectId == destinationProjectId &&
    other.sourceType == sourceType &&
    other.sourceId == sourceId &&
    other.mode == mode &&
    other.id == id &&
    other.sourceName == sourceName &&
    other.createdAt == createdAt &&
    other.revokedAt == revokedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (destinationProjectId.hashCode) +
    (sourceType.hashCode) +
    (sourceId.hashCode) +
    (mode.hashCode) +
    (id.hashCode) +
    (sourceName.hashCode) +
    (createdAt.hashCode) +
    (revokedAt == null ? 0 : revokedAt!.hashCode);

  @override
  String toString() => 'GrantOut[destinationProjectId=$destinationProjectId, sourceType=$sourceType, sourceId=$sourceId, mode=$mode, id=$id, sourceName=$sourceName, createdAt=$createdAt, revokedAt=$revokedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'destination_project_id'] = this.destinationProjectId;
      json[r'source_type'] = this.sourceType;
      json[r'source_id'] = this.sourceId;
      json[r'mode'] = this.mode;
      json[r'id'] = this.id;
      json[r'source_name'] = this.sourceName;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
    if (this.revokedAt != null) {
      json[r'revoked_at'] = this.revokedAt!.toUtc().toIso8601String();
    } else {
      json[r'revoked_at'] = null;
    }
    return json;
  }

  /// Returns a new [GrantOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GrantOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'destination_project_id'), 'Required key "GrantOut[destination_project_id]" is missing from JSON.');
        assert(json[r'destination_project_id'] != null, 'Required key "GrantOut[destination_project_id]" has a null value in JSON.');
        assert(json.containsKey(r'source_type'), 'Required key "GrantOut[source_type]" is missing from JSON.');
        assert(json[r'source_type'] != null, 'Required key "GrantOut[source_type]" has a null value in JSON.');
        assert(json.containsKey(r'source_id'), 'Required key "GrantOut[source_id]" is missing from JSON.');
        assert(json[r'source_id'] != null, 'Required key "GrantOut[source_id]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "GrantOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "GrantOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'source_name'), 'Required key "GrantOut[source_name]" is missing from JSON.');
        assert(json[r'source_name'] != null, 'Required key "GrantOut[source_name]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "GrantOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "GrantOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'revoked_at'), 'Required key "GrantOut[revoked_at]" is missing from JSON.');
        return true;
      }());

      return GrantOut(
        destinationProjectId: mapValueOfType<String>(json, r'destination_project_id')!,
        sourceType: GrantOutSourceTypeEnum.fromJson(json[r'source_type'])!,
        sourceId: mapValueOfType<String>(json, r'source_id')!,
        mode: GrantOutModeEnum.fromJson(json[r'mode']) ?? GrantOutModeEnum.snapshot,
        id: mapValueOfType<String>(json, r'id')!,
        sourceName: mapValueOfType<String>(json, r'source_name')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
        revokedAt: mapDateTime(json, r'revoked_at', r''),
      );
    }
    return null;
  }

  static List<GrantOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GrantOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GrantOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GrantOut> mapFromJson(dynamic json) {
    final map = <String, GrantOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GrantOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GrantOut-objects as value to a dart map
  static Map<String, List<GrantOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GrantOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GrantOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'destination_project_id',
    'source_type',
    'source_id',
    'id',
    'source_name',
    'created_at',
    'revoked_at',
  };
}


enum GrantOutSourceTypeEnum {
  project._(r'project'),
  chat._(r'chat'),
  artifact._(r'artifact'),
  ;

  /// Instantiate a new enum with the provided value.
  const GrantOutSourceTypeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GrantOutSourceTypeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GrantOutSourceTypeEnum? fromJson(dynamic value) => GrantOutSourceTypeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GrantOutSourceTypeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GrantOutSourceTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GrantOutSourceTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GrantOutSourceTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GrantOutSourceTypeEnum] to String,
/// and [decode] dynamic data back to [GrantOutSourceTypeEnum].
class GrantOutSourceTypeEnumTypeTransformer {
  factory GrantOutSourceTypeEnumTypeTransformer() => _instance ??= const GrantOutSourceTypeEnumTypeTransformer._();

  const GrantOutSourceTypeEnumTypeTransformer._();

  String encode(GrantOutSourceTypeEnum data) => data._value;

  /// Returns the instance of [GrantOutSourceTypeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GrantOutSourceTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GrantOutSourceTypeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'project': return GrantOutSourceTypeEnum.project;
        case r'chat': return GrantOutSourceTypeEnum.chat;
        case r'artifact': return GrantOutSourceTypeEnum.artifact;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GrantOutSourceTypeEnumTypeTransformer? _instance;
}



enum GrantOutModeEnum {
  snapshot._(r'snapshot'),
  live._(r'live'),
  ;

  /// Instantiate a new enum with the provided value.
  const GrantOutModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GrantOutModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GrantOutModeEnum? fromJson(dynamic value) => GrantOutModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GrantOutModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GrantOutModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GrantOutModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GrantOutModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GrantOutModeEnum] to String,
/// and [decode] dynamic data back to [GrantOutModeEnum].
class GrantOutModeEnumTypeTransformer {
  factory GrantOutModeEnumTypeTransformer() => _instance ??= const GrantOutModeEnumTypeTransformer._();

  const GrantOutModeEnumTypeTransformer._();

  String encode(GrantOutModeEnum data) => data._value;

  /// Returns the instance of [GrantOutModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GrantOutModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GrantOutModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'snapshot': return GrantOutModeEnum.snapshot;
        case r'live': return GrantOutModeEnum.live;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GrantOutModeEnumTypeTransformer? _instance;
}


