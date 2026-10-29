//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChatCreate {
  /// Returns a new [ChatCreate] instance.
  ChatCreate({
    this.projectId,
    this.title = 'New chat',
    this.contextMode,
  });

  String? projectId;

  String title;

  ChatCreateContextModeEnum? contextMode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChatCreate &&
    other.projectId == projectId &&
    other.title == title &&
    other.contextMode == contextMode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (projectId == null ? 0 : projectId!.hashCode) +
    (title.hashCode) +
    (contextMode == null ? 0 : contextMode!.hashCode);

  @override
  String toString() => 'ChatCreate[projectId=$projectId, title=$title, contextMode=$contextMode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.projectId != null) {
      json[r'project_id'] = this.projectId;
    } else {
      json[r'project_id'] = null;
    }
      json[r'title'] = this.title;
    if (this.contextMode != null) {
      json[r'context_mode'] = this.contextMode;
    } else {
      json[r'context_mode'] = null;
    }
    return json;
  }

  /// Returns a new [ChatCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChatCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return ChatCreate(
        projectId: mapValueOfType<String>(json, r'project_id'),
        title: mapValueOfType<String>(json, r'title') ?? 'New chat',
        contextMode: ChatCreateContextModeEnum.fromJson(json[r'context_mode']),
      );
    }
    return null;
  }

  static List<ChatCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChatCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChatCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChatCreate> mapFromJson(dynamic json) {
    final map = <String, ChatCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChatCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChatCreate-objects as value to a dart map
  static Map<String, List<ChatCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChatCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChatCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum ChatCreateContextModeEnum {
  chat._(r'chat'),
  project._(r'project'),
  selected._(r'selected'),
  ;

  /// Instantiate a new enum with the provided value.
  const ChatCreateContextModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ChatCreateContextModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ChatCreateContextModeEnum? fromJson(dynamic value) => ChatCreateContextModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ChatCreateContextModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ChatCreateContextModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChatCreateContextModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChatCreateContextModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ChatCreateContextModeEnum] to String,
/// and [decode] dynamic data back to [ChatCreateContextModeEnum].
class ChatCreateContextModeEnumTypeTransformer {
  factory ChatCreateContextModeEnumTypeTransformer() => _instance ??= const ChatCreateContextModeEnumTypeTransformer._();

  const ChatCreateContextModeEnumTypeTransformer._();

  String encode(ChatCreateContextModeEnum data) => data._value;

  /// Returns the instance of [ChatCreateContextModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ChatCreateContextModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ChatCreateContextModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return ChatCreateContextModeEnum.chat;
        case r'project': return ChatCreateContextModeEnum.project;
        case r'selected': return ChatCreateContextModeEnum.selected;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ChatCreateContextModeEnumTypeTransformer? _instance;
}


