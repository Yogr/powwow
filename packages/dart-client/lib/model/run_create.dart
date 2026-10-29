//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunCreate {
  /// Returns a new [RunCreate] instance.
  RunCreate({
    required this.chatId,
    required this.messageId,
    this.capability = RunCreateCapabilityEnum.auto,
    this.attachmentIds = const [],
    this.settings,
    this.budgetUsd = 1,
    required this.idempotencyKey,
    this.intentId,
  });

  String chatId;

  String messageId;

  RunCreateCapabilityEnum capability;

  List<String> attachmentIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  GenerationSettings? settings;

  /// Minimum value: 0.0
  /// Maximum value: 100.0
  num budgetUsd;

  String idempotencyKey;

  String? intentId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunCreate &&
    other.chatId == chatId &&
    other.messageId == messageId &&
    other.capability == capability &&
    _deepEquality.equals(other.attachmentIds, attachmentIds) &&
    other.settings == settings &&
    other.budgetUsd == budgetUsd &&
    other.idempotencyKey == idempotencyKey &&
    other.intentId == intentId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (chatId.hashCode) +
    (messageId.hashCode) +
    (capability.hashCode) +
    (attachmentIds.hashCode) +
    (settings == null ? 0 : settings!.hashCode) +
    (budgetUsd.hashCode) +
    (idempotencyKey.hashCode) +
    (intentId == null ? 0 : intentId!.hashCode);

  @override
  String toString() => 'RunCreate[chatId=$chatId, messageId=$messageId, capability=$capability, attachmentIds=$attachmentIds, settings=$settings, budgetUsd=$budgetUsd, idempotencyKey=$idempotencyKey, intentId=$intentId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'chat_id'] = this.chatId;
      json[r'message_id'] = this.messageId;
      json[r'capability'] = this.capability;
      json[r'attachment_ids'] = this.attachmentIds;
    if (this.settings != null) {
      json[r'settings'] = this.settings;
    } else {
      json[r'settings'] = null;
    }
      json[r'budget_usd'] = this.budgetUsd;
      json[r'idempotency_key'] = this.idempotencyKey;
    if (this.intentId != null) {
      json[r'intent_id'] = this.intentId;
    } else {
      json[r'intent_id'] = null;
    }
    return json;
  }

  /// Returns a new [RunCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'chat_id'), 'Required key "RunCreate[chat_id]" is missing from JSON.');
        assert(json[r'chat_id'] != null, 'Required key "RunCreate[chat_id]" has a null value in JSON.');
        assert(json.containsKey(r'message_id'), 'Required key "RunCreate[message_id]" is missing from JSON.');
        assert(json[r'message_id'] != null, 'Required key "RunCreate[message_id]" has a null value in JSON.');
        assert(json.containsKey(r'idempotency_key'), 'Required key "RunCreate[idempotency_key]" is missing from JSON.');
        assert(json[r'idempotency_key'] != null, 'Required key "RunCreate[idempotency_key]" has a null value in JSON.');
        return true;
      }());

      return RunCreate(
        chatId: mapValueOfType<String>(json, r'chat_id')!,
        messageId: mapValueOfType<String>(json, r'message_id')!,
        capability: RunCreateCapabilityEnum.fromJson(json[r'capability']) ?? RunCreateCapabilityEnum.auto,
        attachmentIds: json[r'attachment_ids'] is Iterable
            ? (json[r'attachment_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        settings: GenerationSettings.fromJson(json[r'settings']),
        budgetUsd: json[r'budget_usd'] == null
            ? 1
            : num.parse('${json[r'budget_usd']}'),
        idempotencyKey: mapValueOfType<String>(json, r'idempotency_key')!,
        intentId: mapValueOfType<String>(json, r'intent_id'),
      );
    }
    return null;
  }

  static List<RunCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunCreate> mapFromJson(dynamic json) {
    final map = <String, RunCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunCreate-objects as value to a dart map
  static Map<String, List<RunCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'chat_id',
    'message_id',
    'idempotency_key',
  };
}


enum RunCreateCapabilityEnum {
  auto._(r'auto'),
  chat._(r'chat'),
  textToImage._(r'text_to_image'),
  imageToVideo._(r'image_to_video'),
  imageTo3d._(r'image_to_3d'),
  ;

  /// Instantiate a new enum with the provided value.
  const RunCreateCapabilityEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [RunCreateCapabilityEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static RunCreateCapabilityEnum? fromJson(dynamic value) => RunCreateCapabilityEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [RunCreateCapabilityEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<RunCreateCapabilityEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunCreateCapabilityEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunCreateCapabilityEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RunCreateCapabilityEnum] to String,
/// and [decode] dynamic data back to [RunCreateCapabilityEnum].
class RunCreateCapabilityEnumTypeTransformer {
  factory RunCreateCapabilityEnumTypeTransformer() => _instance ??= const RunCreateCapabilityEnumTypeTransformer._();

  const RunCreateCapabilityEnumTypeTransformer._();

  String encode(RunCreateCapabilityEnum data) => data._value;

  /// Returns the instance of [RunCreateCapabilityEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RunCreateCapabilityEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is RunCreateCapabilityEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'auto': return RunCreateCapabilityEnum.auto;
        case r'chat': return RunCreateCapabilityEnum.chat;
        case r'text_to_image': return RunCreateCapabilityEnum.textToImage;
        case r'image_to_video': return RunCreateCapabilityEnum.imageToVideo;
        case r'image_to_3d': return RunCreateCapabilityEnum.imageTo3d;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static RunCreateCapabilityEnumTypeTransformer? _instance;
}


