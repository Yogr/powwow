//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChatOut {
  /// Returns a new [ChatOut] instance.
  ChatOut({
    this.projectId,
    this.title = 'New chat',
    required this.contextMode,
    required this.id,
    this.componentId,
    required this.archived,
    required this.createdAt,
    required this.updatedAt,
  });

  String? projectId;

  String title;

  ChatOutContextModeEnum contextMode;

  String id;

  String? componentId;

  bool archived;

  DateTime createdAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChatOut &&
    other.projectId == projectId &&
    other.title == title &&
    other.contextMode == contextMode &&
    other.id == id &&
    other.componentId == componentId &&
    other.archived == archived &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (projectId == null ? 0 : projectId!.hashCode) +
    (title.hashCode) +
    (contextMode.hashCode) +
    (id.hashCode) +
    (componentId == null ? 0 : componentId!.hashCode) +
    (archived.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'ChatOut[projectId=$projectId, title=$title, contextMode=$contextMode, id=$id, componentId=$componentId, archived=$archived, createdAt=$createdAt, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.projectId != null) {
      json[r'project_id'] = this.projectId;
    } else {
      json[r'project_id'] = null;
    }
      json[r'title'] = this.title;
      json[r'context_mode'] = this.contextMode;
      json[r'id'] = this.id;
    if (this.componentId != null) {
      json[r'component_id'] = this.componentId;
    } else {
      json[r'component_id'] = null;
    }
      json[r'archived'] = this.archived;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [ChatOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChatOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'context_mode'), 'Required key "ChatOut[context_mode]" is missing from JSON.');
        assert(json[r'context_mode'] != null, 'Required key "ChatOut[context_mode]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "ChatOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "ChatOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'archived'), 'Required key "ChatOut[archived]" is missing from JSON.');
        assert(json[r'archived'] != null, 'Required key "ChatOut[archived]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "ChatOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "ChatOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "ChatOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "ChatOut[updated_at]" has a null value in JSON.');
        return true;
      }());

      return ChatOut(
        projectId: mapValueOfType<String>(json, r'project_id'),
        title: mapValueOfType<String>(json, r'title') ?? 'New chat',
        contextMode: ChatOutContextModeEnum.fromJson(json[r'context_mode'])!,
        id: mapValueOfType<String>(json, r'id')!,
        componentId: mapValueOfType<String>(json, r'component_id'),
        archived: mapValueOfType<bool>(json, r'archived')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
      );
    }
    return null;
  }

  static List<ChatOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChatOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChatOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChatOut> mapFromJson(dynamic json) {
    final map = <String, ChatOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChatOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChatOut-objects as value to a dart map
  static Map<String, List<ChatOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChatOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChatOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'context_mode',
    'id',
    'archived',
    'created_at',
    'updated_at',
  };
}


enum ChatOutContextModeEnum {
  chat._(r'chat'),
  project._(r'project'),
  selected._(r'selected'),
  ;

  /// Instantiate a new enum with the provided value.
  const ChatOutContextModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ChatOutContextModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ChatOutContextModeEnum? fromJson(dynamic value) => ChatOutContextModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ChatOutContextModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ChatOutContextModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChatOutContextModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChatOutContextModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ChatOutContextModeEnum] to String,
/// and [decode] dynamic data back to [ChatOutContextModeEnum].
class ChatOutContextModeEnumTypeTransformer {
  factory ChatOutContextModeEnumTypeTransformer() => _instance ??= const ChatOutContextModeEnumTypeTransformer._();

  const ChatOutContextModeEnumTypeTransformer._();

  String encode(ChatOutContextModeEnum data) => data._value;

  /// Returns the instance of [ChatOutContextModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ChatOutContextModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ChatOutContextModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return ChatOutContextModeEnum.chat;
        case r'project': return ChatOutContextModeEnum.project;
        case r'selected': return ChatOutContextModeEnum.selected;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ChatOutContextModeEnumTypeTransformer? _instance;
}


