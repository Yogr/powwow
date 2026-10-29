//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemberPatch {
  /// Returns a new [MemberPatch] instance.
  MemberPatch({
    this.role,
    this.displayName,
  });

  MemberPatchRoleEnum? role;

  String? displayName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemberPatch &&
    other.role == role &&
    other.displayName == displayName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role == null ? 0 : role!.hashCode) +
    (displayName == null ? 0 : displayName!.hashCode);

  @override
  String toString() => 'MemberPatch[role=$role, displayName=$displayName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.role != null) {
      json[r'role'] = this.role;
    } else {
      json[r'role'] = null;
    }
    if (this.displayName != null) {
      json[r'display_name'] = this.displayName;
    } else {
      json[r'display_name'] = null;
    }
    return json;
  }

  /// Returns a new [MemberPatch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemberPatch? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return MemberPatch(
        role: MemberPatchRoleEnum.fromJson(json[r'role']),
        displayName: mapValueOfType<String>(json, r'display_name'),
      );
    }
    return null;
  }

  static List<MemberPatch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemberPatch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemberPatch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemberPatch> mapFromJson(dynamic json) {
    final map = <String, MemberPatch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemberPatch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemberPatch-objects as value to a dart map
  static Map<String, List<MemberPatch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemberPatch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemberPatch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum MemberPatchRoleEnum {
  owner._(r'owner'),
  admin._(r'admin'),
  member._(r'member'),
  viewer._(r'viewer'),
  ;

  /// Instantiate a new enum with the provided value.
  const MemberPatchRoleEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [MemberPatchRoleEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static MemberPatchRoleEnum? fromJson(dynamic value) => MemberPatchRoleEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [MemberPatchRoleEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<MemberPatchRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemberPatchRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemberPatchRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MemberPatchRoleEnum] to String,
/// and [decode] dynamic data back to [MemberPatchRoleEnum].
class MemberPatchRoleEnumTypeTransformer {
  factory MemberPatchRoleEnumTypeTransformer() => _instance ??= const MemberPatchRoleEnumTypeTransformer._();

  const MemberPatchRoleEnumTypeTransformer._();

  String encode(MemberPatchRoleEnum data) => data._value;

  /// Returns the instance of [MemberPatchRoleEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MemberPatchRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is MemberPatchRoleEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'owner': return MemberPatchRoleEnum.owner;
        case r'admin': return MemberPatchRoleEnum.admin;
        case r'member': return MemberPatchRoleEnum.member;
        case r'viewer': return MemberPatchRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static MemberPatchRoleEnumTypeTransformer? _instance;
}


