//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemberOut {
  /// Returns a new [MemberOut] instance.
  MemberOut({
    required this.userId,
    required this.displayName,
    required this.role,
    required this.createdAt,
  });

  String userId;

  String displayName;

  MemberOutRoleEnum role;

  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemberOut &&
    other.userId == userId &&
    other.displayName == displayName &&
    other.role == role &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userId.hashCode) +
    (displayName.hashCode) +
    (role.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'MemberOut[userId=$userId, displayName=$displayName, role=$role, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'user_id'] = this.userId;
      json[r'display_name'] = this.displayName;
      json[r'role'] = this.role;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [MemberOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemberOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'user_id'), 'Required key "MemberOut[user_id]" is missing from JSON.');
        assert(json[r'user_id'] != null, 'Required key "MemberOut[user_id]" has a null value in JSON.');
        assert(json.containsKey(r'display_name'), 'Required key "MemberOut[display_name]" is missing from JSON.');
        assert(json[r'display_name'] != null, 'Required key "MemberOut[display_name]" has a null value in JSON.');
        assert(json.containsKey(r'role'), 'Required key "MemberOut[role]" is missing from JSON.');
        assert(json[r'role'] != null, 'Required key "MemberOut[role]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "MemberOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "MemberOut[created_at]" has a null value in JSON.');
        return true;
      }());

      return MemberOut(
        userId: mapValueOfType<String>(json, r'user_id')!,
        displayName: mapValueOfType<String>(json, r'display_name')!,
        role: MemberOutRoleEnum.fromJson(json[r'role'])!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
      );
    }
    return null;
  }

  static List<MemberOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemberOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemberOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemberOut> mapFromJson(dynamic json) {
    final map = <String, MemberOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemberOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemberOut-objects as value to a dart map
  static Map<String, List<MemberOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemberOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemberOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'user_id',
    'display_name',
    'role',
    'created_at',
  };
}


enum MemberOutRoleEnum {
  owner._(r'owner'),
  admin._(r'admin'),
  member._(r'member'),
  viewer._(r'viewer'),
  ;

  /// Instantiate a new enum with the provided value.
  const MemberOutRoleEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [MemberOutRoleEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static MemberOutRoleEnum? fromJson(dynamic value) => MemberOutRoleEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [MemberOutRoleEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<MemberOutRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemberOutRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemberOutRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MemberOutRoleEnum] to String,
/// and [decode] dynamic data back to [MemberOutRoleEnum].
class MemberOutRoleEnumTypeTransformer {
  factory MemberOutRoleEnumTypeTransformer() => _instance ??= const MemberOutRoleEnumTypeTransformer._();

  const MemberOutRoleEnumTypeTransformer._();

  String encode(MemberOutRoleEnum data) => data._value;

  /// Returns the instance of [MemberOutRoleEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MemberOutRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is MemberOutRoleEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'owner': return MemberOutRoleEnum.owner;
        case r'admin': return MemberOutRoleEnum.admin;
        case r'member': return MemberOutRoleEnum.member;
        case r'viewer': return MemberOutRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static MemberOutRoleEnumTypeTransformer? _instance;
}


