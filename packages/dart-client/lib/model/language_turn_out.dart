//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageTurnOut {
  /// Returns a new [LanguageTurnOut] instance.
  LanguageTurnOut({
    required this.id,
    required this.role,
    required this.text,
    this.reply,
    this.runId,
    required this.createdAt,
  });

  String id;

  LanguageTurnOutRoleEnum role;

  String text;

  LanguageReply? reply;

  String? runId;

  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageTurnOut &&
    other.id == id &&
    other.role == role &&
    other.text == text &&
    other.reply == reply &&
    other.runId == runId &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (role.hashCode) +
    (text.hashCode) +
    (reply == null ? 0 : reply!.hashCode) +
    (runId == null ? 0 : runId!.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'LanguageTurnOut[id=$id, role=$role, text=$text, reply=$reply, runId=$runId, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'role'] = this.role;
      json[r'text'] = this.text;
    if (this.reply != null) {
      json[r'reply'] = this.reply;
    } else {
      json[r'reply'] = null;
    }
    if (this.runId != null) {
      json[r'run_id'] = this.runId;
    } else {
      json[r'run_id'] = null;
    }
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [LanguageTurnOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageTurnOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "LanguageTurnOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "LanguageTurnOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'role'), 'Required key "LanguageTurnOut[role]" is missing from JSON.');
        assert(json[r'role'] != null, 'Required key "LanguageTurnOut[role]" has a null value in JSON.');
        assert(json.containsKey(r'text'), 'Required key "LanguageTurnOut[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguageTurnOut[text]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "LanguageTurnOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "LanguageTurnOut[created_at]" has a null value in JSON.');
        return true;
      }());

      return LanguageTurnOut(
        id: mapValueOfType<String>(json, r'id')!,
        role: LanguageTurnOutRoleEnum.fromJson(json[r'role'])!,
        text: mapValueOfType<String>(json, r'text')!,
        reply: LanguageReply.fromJson(json[r'reply']),
        runId: mapValueOfType<String>(json, r'run_id'),
        createdAt: mapDateTime(json, r'created_at', r'')!,
      );
    }
    return null;
  }

  static List<LanguageTurnOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageTurnOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageTurnOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageTurnOut> mapFromJson(dynamic json) {
    final map = <String, LanguageTurnOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageTurnOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageTurnOut-objects as value to a dart map
  static Map<String, List<LanguageTurnOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageTurnOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageTurnOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'role',
    'text',
    'created_at',
  };
}


enum LanguageTurnOutRoleEnum {
  user._(r'user'),
  assistant._(r'assistant'),
  ;

  /// Instantiate a new enum with the provided value.
  const LanguageTurnOutRoleEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [LanguageTurnOutRoleEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static LanguageTurnOutRoleEnum? fromJson(dynamic value) => LanguageTurnOutRoleEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [LanguageTurnOutRoleEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<LanguageTurnOutRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageTurnOutRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageTurnOutRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LanguageTurnOutRoleEnum] to String,
/// and [decode] dynamic data back to [LanguageTurnOutRoleEnum].
class LanguageTurnOutRoleEnumTypeTransformer {
  factory LanguageTurnOutRoleEnumTypeTransformer() => _instance ??= const LanguageTurnOutRoleEnumTypeTransformer._();

  const LanguageTurnOutRoleEnumTypeTransformer._();

  String encode(LanguageTurnOutRoleEnum data) => data._value;

  /// Returns the instance of [LanguageTurnOutRoleEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LanguageTurnOutRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is LanguageTurnOutRoleEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'user': return LanguageTurnOutRoleEnum.user;
        case r'assistant': return LanguageTurnOutRoleEnum.assistant;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static LanguageTurnOutRoleEnumTypeTransformer? _instance;
}


