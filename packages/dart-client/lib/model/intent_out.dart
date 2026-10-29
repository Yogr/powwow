//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntentOut {
  /// Returns a new [IntentOut] instance.
  IntentOut({
    required this.id,
    required this.capability,
    required this.task,
    required this.available,
    required this.needsImage,
    required this.summary,
    this.skillIds = const [],
    required this.method,
    this.model,
    this.webSearch = false,
  });

  String id;

  IntentOutCapabilityEnum capability;

  IntentOutTaskEnum task;

  bool available;

  bool needsImage;

  String summary;

  List<String> skillIds;

  IntentOutMethodEnum method;

  String? model;

  bool webSearch;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntentOut &&
    other.id == id &&
    other.capability == capability &&
    other.task == task &&
    other.available == available &&
    other.needsImage == needsImage &&
    other.summary == summary &&
    _deepEquality.equals(other.skillIds, skillIds) &&
    other.method == method &&
    other.model == model &&
    other.webSearch == webSearch;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (capability.hashCode) +
    (task.hashCode) +
    (available.hashCode) +
    (needsImage.hashCode) +
    (summary.hashCode) +
    (skillIds.hashCode) +
    (method.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (webSearch.hashCode);

  @override
  String toString() => 'IntentOut[id=$id, capability=$capability, task=$task, available=$available, needsImage=$needsImage, summary=$summary, skillIds=$skillIds, method=$method, model=$model, webSearch=$webSearch]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'capability'] = this.capability;
      json[r'task'] = this.task;
      json[r'available'] = this.available;
      json[r'needs_image'] = this.needsImage;
      json[r'summary'] = this.summary;
      json[r'skill_ids'] = this.skillIds;
      json[r'method'] = this.method;
    if (this.model != null) {
      json[r'model'] = this.model;
    } else {
      json[r'model'] = null;
    }
      json[r'web_search'] = this.webSearch;
    return json;
  }

  /// Returns a new [IntentOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntentOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "IntentOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "IntentOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'capability'), 'Required key "IntentOut[capability]" is missing from JSON.');
        assert(json[r'capability'] != null, 'Required key "IntentOut[capability]" has a null value in JSON.');
        assert(json.containsKey(r'task'), 'Required key "IntentOut[task]" is missing from JSON.');
        assert(json[r'task'] != null, 'Required key "IntentOut[task]" has a null value in JSON.');
        assert(json.containsKey(r'available'), 'Required key "IntentOut[available]" is missing from JSON.');
        assert(json[r'available'] != null, 'Required key "IntentOut[available]" has a null value in JSON.');
        assert(json.containsKey(r'needs_image'), 'Required key "IntentOut[needs_image]" is missing from JSON.');
        assert(json[r'needs_image'] != null, 'Required key "IntentOut[needs_image]" has a null value in JSON.');
        assert(json.containsKey(r'summary'), 'Required key "IntentOut[summary]" is missing from JSON.');
        assert(json[r'summary'] != null, 'Required key "IntentOut[summary]" has a null value in JSON.');
        assert(json.containsKey(r'skill_ids'), 'Required key "IntentOut[skill_ids]" is missing from JSON.');
        assert(json[r'skill_ids'] != null, 'Required key "IntentOut[skill_ids]" has a null value in JSON.');
        assert(json.containsKey(r'method'), 'Required key "IntentOut[method]" is missing from JSON.');
        assert(json[r'method'] != null, 'Required key "IntentOut[method]" has a null value in JSON.');
        return true;
      }());

      return IntentOut(
        id: mapValueOfType<String>(json, r'id')!,
        capability: IntentOutCapabilityEnum.fromJson(json[r'capability'])!,
        task: IntentOutTaskEnum.fromJson(json[r'task'])!,
        available: mapValueOfType<bool>(json, r'available')!,
        needsImage: mapValueOfType<bool>(json, r'needs_image')!,
        summary: mapValueOfType<String>(json, r'summary')!,
        skillIds: json[r'skill_ids'] is Iterable
            ? (json[r'skill_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        method: IntentOutMethodEnum.fromJson(json[r'method'])!,
        model: mapValueOfType<String>(json, r'model'),
        webSearch: mapValueOfType<bool>(json, r'web_search') ?? false,
      );
    }
    return null;
  }

  static List<IntentOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntentOut> mapFromJson(dynamic json) {
    final map = <String, IntentOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntentOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntentOut-objects as value to a dart map
  static Map<String, List<IntentOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntentOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntentOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'capability',
    'task',
    'available',
    'needs_image',
    'summary',
    'skill_ids',
    'method',
  };
}


enum IntentOutCapabilityEnum {
  chat._(r'chat'),
  textToImage._(r'text_to_image'),
  imageToVideo._(r'image_to_video'),
  imageTo3d._(r'image_to_3d'),
  ;

  /// Instantiate a new enum with the provided value.
  const IntentOutCapabilityEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [IntentOutCapabilityEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static IntentOutCapabilityEnum? fromJson(dynamic value) => IntentOutCapabilityEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [IntentOutCapabilityEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<IntentOutCapabilityEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentOutCapabilityEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentOutCapabilityEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntentOutCapabilityEnum] to String,
/// and [decode] dynamic data back to [IntentOutCapabilityEnum].
class IntentOutCapabilityEnumTypeTransformer {
  factory IntentOutCapabilityEnumTypeTransformer() => _instance ??= const IntentOutCapabilityEnumTypeTransformer._();

  const IntentOutCapabilityEnumTypeTransformer._();

  String encode(IntentOutCapabilityEnum data) => data._value;

  /// Returns the instance of [IntentOutCapabilityEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntentOutCapabilityEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is IntentOutCapabilityEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return IntentOutCapabilityEnum.chat;
        case r'text_to_image': return IntentOutCapabilityEnum.textToImage;
        case r'image_to_video': return IntentOutCapabilityEnum.imageToVideo;
        case r'image_to_3d': return IntentOutCapabilityEnum.imageTo3d;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static IntentOutCapabilityEnumTypeTransformer? _instance;
}



enum IntentOutTaskEnum {
  conversation._(r'conversation'),
  creativeWriting._(r'creative_writing'),
  research._(r'research'),
  image._(r'image'),
  video._(r'video'),
  model3d._(r'model3d'),
  ;

  /// Instantiate a new enum with the provided value.
  const IntentOutTaskEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [IntentOutTaskEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static IntentOutTaskEnum? fromJson(dynamic value) => IntentOutTaskEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [IntentOutTaskEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<IntentOutTaskEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentOutTaskEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentOutTaskEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntentOutTaskEnum] to String,
/// and [decode] dynamic data back to [IntentOutTaskEnum].
class IntentOutTaskEnumTypeTransformer {
  factory IntentOutTaskEnumTypeTransformer() => _instance ??= const IntentOutTaskEnumTypeTransformer._();

  const IntentOutTaskEnumTypeTransformer._();

  String encode(IntentOutTaskEnum data) => data._value;

  /// Returns the instance of [IntentOutTaskEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntentOutTaskEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is IntentOutTaskEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'conversation': return IntentOutTaskEnum.conversation;
        case r'creative_writing': return IntentOutTaskEnum.creativeWriting;
        case r'research': return IntentOutTaskEnum.research;
        case r'image': return IntentOutTaskEnum.image;
        case r'video': return IntentOutTaskEnum.video;
        case r'model3d': return IntentOutTaskEnum.model3d;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static IntentOutTaskEnumTypeTransformer? _instance;
}



enum IntentOutMethodEnum {
  model._(r'model'),
  rules._(r'rules'),
  selected._(r'selected'),
  pending._(r'pending'),
  ;

  /// Instantiate a new enum with the provided value.
  const IntentOutMethodEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [IntentOutMethodEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static IntentOutMethodEnum? fromJson(dynamic value) => IntentOutMethodEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [IntentOutMethodEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<IntentOutMethodEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntentOutMethodEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntentOutMethodEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [IntentOutMethodEnum] to String,
/// and [decode] dynamic data back to [IntentOutMethodEnum].
class IntentOutMethodEnumTypeTransformer {
  factory IntentOutMethodEnumTypeTransformer() => _instance ??= const IntentOutMethodEnumTypeTransformer._();

  const IntentOutMethodEnumTypeTransformer._();

  String encode(IntentOutMethodEnum data) => data._value;

  /// Returns the instance of [IntentOutMethodEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  IntentOutMethodEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is IntentOutMethodEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'model': return IntentOutMethodEnum.model;
        case r'rules': return IntentOutMethodEnum.rules;
        case r'selected': return IntentOutMethodEnum.selected;
        case r'pending': return IntentOutMethodEnum.pending;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static IntentOutMethodEnumTypeTransformer? _instance;
}


