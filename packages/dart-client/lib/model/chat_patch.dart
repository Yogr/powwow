//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChatPatch {
  /// Returns a new [ChatPatch] instance.
  ChatPatch({
    this.title,
    this.projectId,
    this.contextMode,
    this.archived,
  });

  String? title;

  String? projectId;

  ChatPatchContextModeEnum? contextMode;

  bool? archived;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChatPatch &&
    other.title == title &&
    other.projectId == projectId &&
    other.contextMode == contextMode &&
    other.archived == archived;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (title == null ? 0 : title!.hashCode) +
    (projectId == null ? 0 : projectId!.hashCode) +
    (contextMode == null ? 0 : contextMode!.hashCode) +
    (archived == null ? 0 : archived!.hashCode);

  @override
  String toString() => 'ChatPatch[title=$title, projectId=$projectId, contextMode=$contextMode, archived=$archived]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.title != null) {
      json[r'title'] = this.title;
    } else {
      json[r'title'] = null;
    }
    if (this.projectId != null) {
      json[r'project_id'] = this.projectId;
    } else {
      json[r'project_id'] = null;
    }
    if (this.contextMode != null) {
      json[r'context_mode'] = this.contextMode;
    } else {
      json[r'context_mode'] = null;
    }
    if (this.archived != null) {
      json[r'archived'] = this.archived;
    } else {
      json[r'archived'] = null;
    }
    return json;
  }

  /// Returns a new [ChatPatch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChatPatch? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return ChatPatch(
        title: mapValueOfType<String>(json, r'title'),
        projectId: mapValueOfType<String>(json, r'project_id'),
        contextMode: ChatPatchContextModeEnum.fromJson(json[r'context_mode']),
        archived: mapValueOfType<bool>(json, r'archived'),
      );
    }
    return null;
  }

  static List<ChatPatch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChatPatch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChatPatch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChatPatch> mapFromJson(dynamic json) {
    final map = <String, ChatPatch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChatPatch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChatPatch-objects as value to a dart map
  static Map<String, List<ChatPatch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChatPatch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChatPatch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum ChatPatchContextModeEnum {
  chat._(r'chat'),
  project._(r'project'),
  selected._(r'selected'),
  ;

  /// Instantiate a new enum with the provided value.
  const ChatPatchContextModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ChatPatchContextModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ChatPatchContextModeEnum? fromJson(dynamic value) => ChatPatchContextModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ChatPatchContextModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ChatPatchContextModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChatPatchContextModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChatPatchContextModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ChatPatchContextModeEnum] to String,
/// and [decode] dynamic data back to [ChatPatchContextModeEnum].
class ChatPatchContextModeEnumTypeTransformer {
  factory ChatPatchContextModeEnumTypeTransformer() => _instance ??= const ChatPatchContextModeEnumTypeTransformer._();

  const ChatPatchContextModeEnumTypeTransformer._();

  String encode(ChatPatchContextModeEnum data) => data._value;

  /// Returns the instance of [ChatPatchContextModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ChatPatchContextModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ChatPatchContextModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return ChatPatchContextModeEnum.chat;
        case r'project': return ChatPatchContextModeEnum.project;
        case r'selected': return ChatPatchContextModeEnum.selected;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ChatPatchContextModeEnumTypeTransformer? _instance;
}


