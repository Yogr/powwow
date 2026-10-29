//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MessageOut {
  /// Returns a new [MessageOut] instance.
  MessageOut({
    required this.content,
    this.attachmentIds = const [],
    required this.id,
    required this.chatId,
    required this.role,
    required this.runId,
    required this.createdAt,
  });

  String content;

  List<String> attachmentIds;

  String id;

  String chatId;

  MessageOutRoleEnum role;

  String? runId;

  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MessageOut &&
    other.content == content &&
    _deepEquality.equals(other.attachmentIds, attachmentIds) &&
    other.id == id &&
    other.chatId == chatId &&
    other.role == role &&
    other.runId == runId &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (content.hashCode) +
    (attachmentIds.hashCode) +
    (id.hashCode) +
    (chatId.hashCode) +
    (role.hashCode) +
    (runId == null ? 0 : runId!.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'MessageOut[content=$content, attachmentIds=$attachmentIds, id=$id, chatId=$chatId, role=$role, runId=$runId, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'content'] = this.content;
      json[r'attachment_ids'] = this.attachmentIds;
      json[r'id'] = this.id;
      json[r'chat_id'] = this.chatId;
      json[r'role'] = this.role;
    if (this.runId != null) {
      json[r'run_id'] = this.runId;
    } else {
      json[r'run_id'] = null;
    }
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [MessageOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MessageOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'content'), 'Required key "MessageOut[content]" is missing from JSON.');
        assert(json[r'content'] != null, 'Required key "MessageOut[content]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "MessageOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "MessageOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'chat_id'), 'Required key "MessageOut[chat_id]" is missing from JSON.');
        assert(json[r'chat_id'] != null, 'Required key "MessageOut[chat_id]" has a null value in JSON.');
        assert(json.containsKey(r'role'), 'Required key "MessageOut[role]" is missing from JSON.');
        assert(json[r'role'] != null, 'Required key "MessageOut[role]" has a null value in JSON.');
        assert(json.containsKey(r'run_id'), 'Required key "MessageOut[run_id]" is missing from JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "MessageOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "MessageOut[created_at]" has a null value in JSON.');
        return true;
      }());

      return MessageOut(
        content: mapValueOfType<String>(json, r'content')!,
        attachmentIds: json[r'attachment_ids'] is Iterable
            ? (json[r'attachment_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        id: mapValueOfType<String>(json, r'id')!,
        chatId: mapValueOfType<String>(json, r'chat_id')!,
        role: MessageOutRoleEnum.fromJson(json[r'role'])!,
        runId: mapValueOfType<String>(json, r'run_id'),
        createdAt: mapDateTime(json, r'created_at', r'')!,
      );
    }
    return null;
  }

  static List<MessageOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MessageOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MessageOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MessageOut> mapFromJson(dynamic json) {
    final map = <String, MessageOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MessageOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MessageOut-objects as value to a dart map
  static Map<String, List<MessageOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MessageOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MessageOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'content',
    'id',
    'chat_id',
    'role',
    'run_id',
    'created_at',
  };
}


enum MessageOutRoleEnum {
  user._(r'user'),
  assistant._(r'assistant'),
  ;

  /// Instantiate a new enum with the provided value.
  const MessageOutRoleEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [MessageOutRoleEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static MessageOutRoleEnum? fromJson(dynamic value) => MessageOutRoleEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [MessageOutRoleEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<MessageOutRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MessageOutRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MessageOutRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MessageOutRoleEnum] to String,
/// and [decode] dynamic data back to [MessageOutRoleEnum].
class MessageOutRoleEnumTypeTransformer {
  factory MessageOutRoleEnumTypeTransformer() => _instance ??= const MessageOutRoleEnumTypeTransformer._();

  const MessageOutRoleEnumTypeTransformer._();

  String encode(MessageOutRoleEnum data) => data._value;

  /// Returns the instance of [MessageOutRoleEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MessageOutRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is MessageOutRoleEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'user': return MessageOutRoleEnum.user;
        case r'assistant': return MessageOutRoleEnum.assistant;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static MessageOutRoleEnumTypeTransformer? _instance;
}


