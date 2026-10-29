//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MessageCreate {
  /// Returns a new [MessageCreate] instance.
  MessageCreate({
    required this.content,
    this.attachmentIds = const [],
  });

  String content;

  List<String> attachmentIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MessageCreate &&
    other.content == content &&
    _deepEquality.equals(other.attachmentIds, attachmentIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (content.hashCode) +
    (attachmentIds.hashCode);

  @override
  String toString() => 'MessageCreate[content=$content, attachmentIds=$attachmentIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'content'] = this.content;
      json[r'attachment_ids'] = this.attachmentIds;
    return json;
  }

  /// Returns a new [MessageCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MessageCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'content'), 'Required key "MessageCreate[content]" is missing from JSON.');
        assert(json[r'content'] != null, 'Required key "MessageCreate[content]" has a null value in JSON.');
        return true;
      }());

      return MessageCreate(
        content: mapValueOfType<String>(json, r'content')!,
        attachmentIds: json[r'attachment_ids'] is Iterable
            ? (json[r'attachment_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<MessageCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MessageCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MessageCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MessageCreate> mapFromJson(dynamic json) {
    final map = <String, MessageCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MessageCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MessageCreate-objects as value to a dart map
  static Map<String, List<MessageCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MessageCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MessageCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'content',
  };
}

