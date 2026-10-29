//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntentRequest {
  /// Returns a new [IntentRequest] instance.
  IntentRequest({
    this.projectId,
    required this.prompt,
    this.attachmentIds = const [],
    this.capability = IntentRequestCapabilityEnum.auto,
    this.intelligence = IntentRequestIntelligenceEnum.basic,
    this.allowWebSearch = true,
  });

  String? projectId;

  String prompt;

  List<String> attachmentIds;

  IntentRequestCapabilityEnum capability;

  IntentRequestIntelligenceEnum intelligence;

  bool allowWebSearch;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntentRequest &&
    other.projectId == projectId &&
    other.prompt == prompt &&
    _deepEquality.equals(other.attachmentIds, attachmentIds) &&
    other.capability == capability &&
    other.intelligence == intelligence &&
    other.allowWebSearch == allowWebSearch;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (projectId == null ? 0 : projectId!.hashCode) +
    (prompt.hashCode) +
    (attachmentIds.hashCode) +
    (capability.hashCode) +
    (intelligence.hashCode) +
    (allowWebSearch.hashCode);

  @override
  String toString() => 'IntentRequest[projectId=$projectId, prompt=$prompt, attachmentIds=$attachmentIds, capability=$capability, intelligence=$intelligence, allowWebSearch=$allowWebSearch]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.projectId != null) {
      json[r'project_id'] = this.projectId;
    } else {
      json[r'project_id'] = null;
    }
      json[r'prompt'] = this.prompt;
      json[r'attachment_ids'] = this.attachmentIds;
      json[r'capability'] = this.capability;
      json[r'intelligence'] = this.intelligence;
      json[r'allow_web_search'] = this.allowWebSearch;
    return json;
  }

  /// Returns a new [IntentRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntentRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'prompt'), 'Required key "IntentRequest[prompt]" is missing from JSON.');
        assert(json[r'prompt'] != null, 'Required key "IntentRequest[prompt]" has a null value in JSON.');
        return true;
      }());

      return IntentRequest(
        projectId: mapValueOfType<String>(json, r'project_id'),
        prompt: mapValueOfType<String>(json, r'prompt')!,
        attachmentIds: json[r'attachment_ids'] is Iterable
            ? (json[r'attachment_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        capability: IntentRequestCapabilityEnum.fromJson(json[r'capability']) ?? IntentRequestCapabilityEnum.auto,
        intelligence: IntentRequestIntelligenceEnum.fromJson(json[r'intelligence']) ?? IntentRequestIntelligenceEnum.basic,
        allowWebSearch: mapValueOfType<bool>(json, r'allow_web_search') ?? true,
      );
    }
    return null;
  }

  static List<IntentRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntentRequest> mapFromJson(dynamic json) {
    final map = <String, IntentRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntentRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntentRequest-objects as value to a dart map
  static Map<String, List<IntentRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntentRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntentRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'prompt',
  };
}


enum IntentRequestCapabilityEnum {
  auto._(r'auto'),
  chat._(r'chat'),
  textToImage._(r'text_to_image'),
  imageToVideo._(r'image_to_video'),
  imageTo3d._(r'image_to_3d'),
  ;

  /// Instantiate a new enum with the provided value.
  const IntentRequestCapabilityEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [IntentRequestCapabilityEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static IntentRequestCapabilityEnum? fromJson(dynamic value) => IntentRequestCapabilityEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [IntentRequestCapabilityEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<IntentRequestCapabilityEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentRequestCapabilityEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentRequestCapabilityEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntentRequestCapabilityEnum] to String,
/// and [decode] dynamic data back to [IntentRequestCapabilityEnum].
class IntentRequestCapabilityEnumTypeTransformer {
  factory IntentRequestCapabilityEnumTypeTransformer() => _instance ??= const IntentRequestCapabilityEnumTypeTransformer._();

  const IntentRequestCapabilityEnumTypeTransformer._();

  String encode(IntentRequestCapabilityEnum data) => data._value;

  /// Returns the instance of [IntentRequestCapabilityEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntentRequestCapabilityEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is IntentRequestCapabilityEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'auto': return IntentRequestCapabilityEnum.auto;
        case r'chat': return IntentRequestCapabilityEnum.chat;
        case r'text_to_image': return IntentRequestCapabilityEnum.textToImage;
        case r'image_to_video': return IntentRequestCapabilityEnum.imageToVideo;
        case r'image_to_3d': return IntentRequestCapabilityEnum.imageTo3d;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static IntentRequestCapabilityEnumTypeTransformer? _instance;
}



enum IntentRequestIntelligenceEnum {
  basic._(r'basic'),
  smarter._(r'smarter'),
  super_._(r'super'),
  ;

  /// Instantiate a new enum with the provided value.
  const IntentRequestIntelligenceEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [IntentRequestIntelligenceEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static IntentRequestIntelligenceEnum? fromJson(dynamic value) => IntentRequestIntelligenceEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [IntentRequestIntelligenceEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<IntentRequestIntelligenceEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentRequestIntelligenceEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentRequestIntelligenceEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntentRequestIntelligenceEnum] to String,
/// and [decode] dynamic data back to [IntentRequestIntelligenceEnum].
class IntentRequestIntelligenceEnumTypeTransformer {
  factory IntentRequestIntelligenceEnumTypeTransformer() => _instance ??= const IntentRequestIntelligenceEnumTypeTransformer._();

  const IntentRequestIntelligenceEnumTypeTransformer._();

  String encode(IntentRequestIntelligenceEnum data) => data._value;

  /// Returns the instance of [IntentRequestIntelligenceEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntentRequestIntelligenceEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is IntentRequestIntelligenceEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'basic': return IntentRequestIntelligenceEnum.basic;
        case r'smarter': return IntentRequestIntelligenceEnum.smarter;
        case r'super': return IntentRequestIntelligenceEnum.super_;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static IntentRequestIntelligenceEnumTypeTransformer? _instance;
}


