//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class InviteCreate {
  /// Returns a new [InviteCreate] instance.
  InviteCreate({
    this.role = InviteCreateRoleEnum.member,
    this.expiresInDays = 7,
    this.maxUses = 1,
    this.email,
  });

  InviteCreateRoleEnum role;

  /// Minimum value: 1
  /// Maximum value: 30
  int expiresInDays;

  /// Minimum value: 1
  /// Maximum value: 100
  int maxUses;

  String? email;

  @override
  bool operator ==(Object other) => identical(this, other) || other is InviteCreate &&
    other.role == role &&
    other.expiresInDays == expiresInDays &&
    other.maxUses == maxUses &&
    other.email == email;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role.hashCode) +
    (expiresInDays.hashCode) +
    (maxUses.hashCode) +
    (email == null ? 0 : email!.hashCode);

  @override
  String toString() => 'InviteCreate[role=$role, expiresInDays=$expiresInDays, maxUses=$maxUses, email=$email]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'role'] = this.role;
      json[r'expires_in_days'] = this.expiresInDays;
      json[r'max_uses'] = this.maxUses;
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
      json[r'email'] = null;
    }
    return json;
  }

  /// Returns a new [InviteCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static InviteCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return InviteCreate(
        role: InviteCreateRoleEnum.fromJson(json[r'role']) ?? InviteCreateRoleEnum.member,
        expiresInDays: mapValueOfType<int>(json, r'expires_in_days') ?? 7,
        maxUses: mapValueOfType<int>(json, r'max_uses') ?? 1,
        email: mapValueOfType<String>(json, r'email'),
      );
    }
    return null;
  }

  static List<InviteCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <InviteCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = InviteCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, InviteCreate> mapFromJson(dynamic json) {
    final map = <String, InviteCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = InviteCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of InviteCreate-objects as value to a dart map
  static Map<String, List<InviteCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<InviteCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = InviteCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum InviteCreateRoleEnum {
  admin._(r'admin'),
  member._(r'member'),
  viewer._(r'viewer'),
  ;

  /// Instantiate a new enum with the provided value.
  const InviteCreateRoleEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [InviteCreateRoleEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static InviteCreateRoleEnum? fromJson(dynamic value) => InviteCreateRoleEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [InviteCreateRoleEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<InviteCreateRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <InviteCreateRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = InviteCreateRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [InviteCreateRoleEnum] to String,
/// and [decode] dynamic data back to [InviteCreateRoleEnum].
class InviteCreateRoleEnumTypeTransformer {
  factory InviteCreateRoleEnumTypeTransformer() => _instance ??= const InviteCreateRoleEnumTypeTransformer._();

  const InviteCreateRoleEnumTypeTransformer._();

  String encode(InviteCreateRoleEnum data) => data._value;

  /// Returns the instance of [InviteCreateRoleEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  InviteCreateRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is InviteCreateRoleEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'admin': return InviteCreateRoleEnum.admin;
        case r'member': return InviteCreateRoleEnum.member;
        case r'viewer': return InviteCreateRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static InviteCreateRoleEnumTypeTransformer? _instance;
}


