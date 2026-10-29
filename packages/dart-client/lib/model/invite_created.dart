//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class InviteCreated {
  /// Returns a new [InviteCreated] instance.
  InviteCreated({
    required this.id,
    required this.organizationId,
    required this.role,
    required this.email,
    required this.maxUses,
    required this.uses,
    required this.expiresAt,
    required this.revokedAt,
    required this.createdAt,
    required this.token,
    required this.inviteCode,
  });

  String id;

  String organizationId;

  String role;

  String? email;

  int maxUses;

  int uses;

  DateTime expiresAt;

  DateTime? revokedAt;

  DateTime createdAt;

  String token;

  String inviteCode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is InviteCreated &&
    other.id == id &&
    other.organizationId == organizationId &&
    other.role == role &&
    other.email == email &&
    other.maxUses == maxUses &&
    other.uses == uses &&
    other.expiresAt == expiresAt &&
    other.revokedAt == revokedAt &&
    other.createdAt == createdAt &&
    other.token == token &&
    other.inviteCode == inviteCode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (organizationId.hashCode) +
    (role.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (maxUses.hashCode) +
    (uses.hashCode) +
    (expiresAt.hashCode) +
    (revokedAt == null ? 0 : revokedAt!.hashCode) +
    (createdAt.hashCode) +
    (token.hashCode) +
    (inviteCode.hashCode);

  @override
  String toString() => 'InviteCreated[id=$id, organizationId=$organizationId, role=$role, email=$email, maxUses=$maxUses, uses=$uses, expiresAt=$expiresAt, revokedAt=$revokedAt, createdAt=$createdAt, token=$token, inviteCode=$inviteCode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'organization_id'] = this.organizationId;
      json[r'role'] = this.role;
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
      json[r'email'] = null;
    }
      json[r'max_uses'] = this.maxUses;
      json[r'uses'] = this.uses;
      json[r'expires_at'] = this.expiresAt.toUtc().toIso8601String();
    if (this.revokedAt != null) {
      json[r'revoked_at'] = this.revokedAt!.toUtc().toIso8601String();
    } else {
      json[r'revoked_at'] = null;
    }
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'token'] = this.token;
      json[r'invite_code'] = this.inviteCode;
    return json;
  }

  /// Returns a new [InviteCreated] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static InviteCreated? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "InviteCreated[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "InviteCreated[id]" has a null value in JSON.');
        assert(json.containsKey(r'organization_id'), 'Required key "InviteCreated[organization_id]" is missing from JSON.');
        assert(json[r'organization_id'] != null, 'Required key "InviteCreated[organization_id]" has a null value in JSON.');
        assert(json.containsKey(r'role'), 'Required key "InviteCreated[role]" is missing from JSON.');
        assert(json[r'role'] != null, 'Required key "InviteCreated[role]" has a null value in JSON.');
        assert(json.containsKey(r'email'), 'Required key "InviteCreated[email]" is missing from JSON.');
        assert(json.containsKey(r'max_uses'), 'Required key "InviteCreated[max_uses]" is missing from JSON.');
        assert(json[r'max_uses'] != null, 'Required key "InviteCreated[max_uses]" has a null value in JSON.');
        assert(json.containsKey(r'uses'), 'Required key "InviteCreated[uses]" is missing from JSON.');
        assert(json[r'uses'] != null, 'Required key "InviteCreated[uses]" has a null value in JSON.');
        assert(json.containsKey(r'expires_at'), 'Required key "InviteCreated[expires_at]" is missing from JSON.');
        assert(json[r'expires_at'] != null, 'Required key "InviteCreated[expires_at]" has a null value in JSON.');
        assert(json.containsKey(r'revoked_at'), 'Required key "InviteCreated[revoked_at]" is missing from JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "InviteCreated[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "InviteCreated[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'token'), 'Required key "InviteCreated[token]" is missing from JSON.');
        assert(json[r'token'] != null, 'Required key "InviteCreated[token]" has a null value in JSON.');
        assert(json.containsKey(r'invite_code'), 'Required key "InviteCreated[invite_code]" is missing from JSON.');
        assert(json[r'invite_code'] != null, 'Required key "InviteCreated[invite_code]" has a null value in JSON.');
        return true;
      }());

      return InviteCreated(
        id: mapValueOfType<String>(json, r'id')!,
        organizationId: mapValueOfType<String>(json, r'organization_id')!,
        role: mapValueOfType<String>(json, r'role')!,
        email: mapValueOfType<String>(json, r'email'),
        maxUses: mapValueOfType<int>(json, r'max_uses')!,
        uses: mapValueOfType<int>(json, r'uses')!,
        expiresAt: mapDateTime(json, r'expires_at', r'')!,
        revokedAt: mapDateTime(json, r'revoked_at', r''),
        createdAt: mapDateTime(json, r'created_at', r'')!,
        token: mapValueOfType<String>(json, r'token')!,
        inviteCode: mapValueOfType<String>(json, r'invite_code')!,
      );
    }
    return null;
  }

  static List<InviteCreated> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <InviteCreated>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = InviteCreated.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, InviteCreated> mapFromJson(dynamic json) {
    final map = <String, InviteCreated>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = InviteCreated.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of InviteCreated-objects as value to a dart map
  static Map<String, List<InviteCreated>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<InviteCreated>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = InviteCreated.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'organization_id',
    'role',
    'email',
    'max_uses',
    'uses',
    'expires_at',
    'revoked_at',
    'created_at',
    'token',
    'invite_code',
  };
}

