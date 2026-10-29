//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OrganizationOut {
  /// Returns a new [OrganizationOut] instance.
  OrganizationOut({
    required this.id,
    required this.name,
    required this.role,
    required this.plan,
    this.limits = const {},
    required this.currentUserId,
    required this.createdAt,
  });

  String id;

  String name;

  OrganizationOutRoleEnum role;

  String plan;

  Map<String, int> limits;

  String currentUserId;

  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OrganizationOut &&
    other.id == id &&
    other.name == name &&
    other.role == role &&
    other.plan == plan &&
    _deepEquality.equals(other.limits, limits) &&
    other.currentUserId == currentUserId &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode) +
    (role.hashCode) +
    (plan.hashCode) +
    (limits.hashCode) +
    (currentUserId.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'OrganizationOut[id=$id, name=$name, role=$role, plan=$plan, limits=$limits, currentUserId=$currentUserId, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'role'] = this.role;
      json[r'plan'] = this.plan;
      json[r'limits'] = this.limits;
      json[r'current_user_id'] = this.currentUserId;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [OrganizationOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OrganizationOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "OrganizationOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "OrganizationOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'name'), 'Required key "OrganizationOut[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "OrganizationOut[name]" has a null value in JSON.');
        assert(json.containsKey(r'role'), 'Required key "OrganizationOut[role]" is missing from JSON.');
        assert(json[r'role'] != null, 'Required key "OrganizationOut[role]" has a null value in JSON.');
        assert(json.containsKey(r'plan'), 'Required key "OrganizationOut[plan]" is missing from JSON.');
        assert(json[r'plan'] != null, 'Required key "OrganizationOut[plan]" has a null value in JSON.');
        assert(json.containsKey(r'limits'), 'Required key "OrganizationOut[limits]" is missing from JSON.');
        assert(json[r'limits'] != null, 'Required key "OrganizationOut[limits]" has a null value in JSON.');
        assert(json.containsKey(r'current_user_id'), 'Required key "OrganizationOut[current_user_id]" is missing from JSON.');
        assert(json[r'current_user_id'] != null, 'Required key "OrganizationOut[current_user_id]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "OrganizationOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "OrganizationOut[created_at]" has a null value in JSON.');
        return true;
      }());

      return OrganizationOut(
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        role: OrganizationOutRoleEnum.fromJson(json[r'role'])!,
        plan: mapValueOfType<String>(json, r'plan')!,
        limits: mapCastOfType<String, int>(json, r'limits')!,
        currentUserId: mapValueOfType<String>(json, r'current_user_id')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
      );
    }
    return null;
  }

  static List<OrganizationOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OrganizationOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OrganizationOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OrganizationOut> mapFromJson(dynamic json) {
    final map = <String, OrganizationOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OrganizationOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OrganizationOut-objects as value to a dart map
  static Map<String, List<OrganizationOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OrganizationOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OrganizationOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'role',
    'plan',
    'limits',
    'current_user_id',
    'created_at',
  };
}


enum OrganizationOutRoleEnum {
  owner._(r'owner'),
  admin._(r'admin'),
  member._(r'member'),
  viewer._(r'viewer'),
  ;

  /// Instantiate a new enum with the provided value.
  const OrganizationOutRoleEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [OrganizationOutRoleEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static OrganizationOutRoleEnum? fromJson(dynamic value) => OrganizationOutRoleEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [OrganizationOutRoleEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<OrganizationOutRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OrganizationOutRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OrganizationOutRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [OrganizationOutRoleEnum] to String,
/// and [decode] dynamic data back to [OrganizationOutRoleEnum].
class OrganizationOutRoleEnumTypeTransformer {
  factory OrganizationOutRoleEnumTypeTransformer() => _instance ??= const OrganizationOutRoleEnumTypeTransformer._();

  const OrganizationOutRoleEnumTypeTransformer._();

  String encode(OrganizationOutRoleEnum data) => data._value;

  /// Returns the instance of [OrganizationOutRoleEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  OrganizationOutRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is OrganizationOutRoleEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'owner': return OrganizationOutRoleEnum.owner;
        case r'admin': return OrganizationOutRoleEnum.admin;
        case r'member': return OrganizationOutRoleEnum.member;
        case r'viewer': return OrganizationOutRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static OrganizationOutRoleEnumTypeTransformer? _instance;
}


