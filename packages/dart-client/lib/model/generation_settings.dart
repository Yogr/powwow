//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GenerationSettings {
  /// Returns a new [GenerationSettings] instance.
  GenerationSettings({
    this.entryImage,
    this.webSearch = true,
    this.intelligence = GenerationSettingsIntelligenceEnum.basic,
    this.aspectRatio = GenerationSettingsAspectRatioEnum.n1colon1,
    this.quality = GenerationSettingsQualityEnum.standard,
    this.mediaBudgetUsd = 1,
    this.seed,
    this.width,
    this.height,
    this.numInferenceSteps,
  });

  EntryImageTarget? entryImage;

  bool webSearch;

  GenerationSettingsIntelligenceEnum intelligence;

  GenerationSettingsAspectRatioEnum aspectRatio;

  GenerationSettingsQualityEnum quality;

  /// Minimum value: 0.0
  /// Maximum value: 100.0
  num mediaBudgetUsd;

  /// Minimum value: 0
  /// Maximum value: 2147483647
  int? seed;

  /// Minimum value: 256
  /// Maximum value: 1536
  int? width;

  /// Minimum value: 256
  /// Maximum value: 1536
  int? height;

  /// Minimum value: 1
  /// Maximum value: 12
  int? numInferenceSteps;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GenerationSettings &&
    other.entryImage == entryImage &&
    other.webSearch == webSearch &&
    other.intelligence == intelligence &&
    other.aspectRatio == aspectRatio &&
    other.quality == quality &&
    other.mediaBudgetUsd == mediaBudgetUsd &&
    other.seed == seed &&
    other.width == width &&
    other.height == height &&
    other.numInferenceSteps == numInferenceSteps;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (entryImage == null ? 0 : entryImage!.hashCode) +
    (webSearch.hashCode) +
    (intelligence.hashCode) +
    (aspectRatio.hashCode) +
    (quality.hashCode) +
    (mediaBudgetUsd.hashCode) +
    (seed == null ? 0 : seed!.hashCode) +
    (width == null ? 0 : width!.hashCode) +
    (height == null ? 0 : height!.hashCode) +
    (numInferenceSteps == null ? 0 : numInferenceSteps!.hashCode);

  @override
  String toString() => 'GenerationSettings[entryImage=$entryImage, webSearch=$webSearch, intelligence=$intelligence, aspectRatio=$aspectRatio, quality=$quality, mediaBudgetUsd=$mediaBudgetUsd, seed=$seed, width=$width, height=$height, numInferenceSteps=$numInferenceSteps]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.entryImage != null) {
      json[r'entry_image'] = this.entryImage;
    } else {
      json[r'entry_image'] = null;
    }
      json[r'web_search'] = this.webSearch;
      json[r'intelligence'] = this.intelligence;
      json[r'aspect_ratio'] = this.aspectRatio;
      json[r'quality'] = this.quality;
      json[r'media_budget_usd'] = this.mediaBudgetUsd;
    if (this.seed != null) {
      json[r'seed'] = this.seed;
    } else {
      json[r'seed'] = null;
    }
    if (this.width != null) {
      json[r'width'] = this.width;
    } else {
      json[r'width'] = null;
    }
    if (this.height != null) {
      json[r'height'] = this.height;
    } else {
      json[r'height'] = null;
    }
    if (this.numInferenceSteps != null) {
      json[r'num_inference_steps'] = this.numInferenceSteps;
    } else {
      json[r'num_inference_steps'] = null;
    }
    return json;
  }

  /// Returns a new [GenerationSettings] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GenerationSettings? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return GenerationSettings(
        entryImage: EntryImageTarget.fromJson(json[r'entry_image']),
        webSearch: mapValueOfType<bool>(json, r'web_search') ?? true,
        intelligence: GenerationSettingsIntelligenceEnum.fromJson(json[r'intelligence']) ?? GenerationSettingsIntelligenceEnum.basic,
        aspectRatio: GenerationSettingsAspectRatioEnum.fromJson(json[r'aspect_ratio']) ?? GenerationSettingsAspectRatioEnum.n1colon1,
        quality: GenerationSettingsQualityEnum.fromJson(json[r'quality']) ?? GenerationSettingsQualityEnum.standard,
        mediaBudgetUsd: json[r'media_budget_usd'] == null
            ? 1
            : num.parse('${json[r'media_budget_usd']}'),
        seed: mapValueOfType<int>(json, r'seed'),
        width: mapValueOfType<int>(json, r'width'),
        height: mapValueOfType<int>(json, r'height'),
        numInferenceSteps: mapValueOfType<int>(json, r'num_inference_steps'),
      );
    }
    return null;
  }

  static List<GenerationSettings> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GenerationSettings>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GenerationSettings.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GenerationSettings> mapFromJson(dynamic json) {
    final map = <String, GenerationSettings>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GenerationSettings.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GenerationSettings-objects as value to a dart map
  static Map<String, List<GenerationSettings>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GenerationSettings>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GenerationSettings.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum GenerationSettingsIntelligenceEnum {
  basic._(r'basic'),
  smarter._(r'smarter'),
  super_._(r'super'),
  ;

  /// Instantiate a new enum with the provided value.
  const GenerationSettingsIntelligenceEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GenerationSettingsIntelligenceEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GenerationSettingsIntelligenceEnum? fromJson(dynamic value) => GenerationSettingsIntelligenceEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GenerationSettingsIntelligenceEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GenerationSettingsIntelligenceEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GenerationSettingsIntelligenceEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GenerationSettingsIntelligenceEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GenerationSettingsIntelligenceEnum] to String,
/// and [decode] dynamic data back to [GenerationSettingsIntelligenceEnum].
class GenerationSettingsIntelligenceEnumTypeTransformer {
  factory GenerationSettingsIntelligenceEnumTypeTransformer() => _instance ??= const GenerationSettingsIntelligenceEnumTypeTransformer._();

  const GenerationSettingsIntelligenceEnumTypeTransformer._();

  String encode(GenerationSettingsIntelligenceEnum data) => data._value;

  /// Returns the instance of [GenerationSettingsIntelligenceEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GenerationSettingsIntelligenceEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GenerationSettingsIntelligenceEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'basic': return GenerationSettingsIntelligenceEnum.basic;
        case r'smarter': return GenerationSettingsIntelligenceEnum.smarter;
        case r'super': return GenerationSettingsIntelligenceEnum.super_;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GenerationSettingsIntelligenceEnumTypeTransformer? _instance;
}



enum GenerationSettingsAspectRatioEnum {
  n1colon1._(r'1:1'),
  n16colon9._(r'16:9'),
  n9colon16._(r'9:16'),
  n4colon3._(r'4:3'),
  n3colon4._(r'3:4'),
  ;

  /// Instantiate a new enum with the provided value.
  const GenerationSettingsAspectRatioEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GenerationSettingsAspectRatioEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GenerationSettingsAspectRatioEnum? fromJson(dynamic value) => GenerationSettingsAspectRatioEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GenerationSettingsAspectRatioEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GenerationSettingsAspectRatioEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GenerationSettingsAspectRatioEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GenerationSettingsAspectRatioEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GenerationSettingsAspectRatioEnum] to String,
/// and [decode] dynamic data back to [GenerationSettingsAspectRatioEnum].
class GenerationSettingsAspectRatioEnumTypeTransformer {
  factory GenerationSettingsAspectRatioEnumTypeTransformer() => _instance ??= const GenerationSettingsAspectRatioEnumTypeTransformer._();

  const GenerationSettingsAspectRatioEnumTypeTransformer._();

  String encode(GenerationSettingsAspectRatioEnum data) => data._value;

  /// Returns the instance of [GenerationSettingsAspectRatioEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GenerationSettingsAspectRatioEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GenerationSettingsAspectRatioEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'1:1': return GenerationSettingsAspectRatioEnum.n1colon1;
        case r'16:9': return GenerationSettingsAspectRatioEnum.n16colon9;
        case r'9:16': return GenerationSettingsAspectRatioEnum.n9colon16;
        case r'4:3': return GenerationSettingsAspectRatioEnum.n4colon3;
        case r'3:4': return GenerationSettingsAspectRatioEnum.n3colon4;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GenerationSettingsAspectRatioEnumTypeTransformer? _instance;
}



enum GenerationSettingsQualityEnum {
  standard._(r'standard'),
  premium._(r'premium'),
  ;

  /// Instantiate a new enum with the provided value.
  const GenerationSettingsQualityEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [GenerationSettingsQualityEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static GenerationSettingsQualityEnum? fromJson(dynamic value) => GenerationSettingsQualityEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [GenerationSettingsQualityEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<GenerationSettingsQualityEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GenerationSettingsQualityEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GenerationSettingsQualityEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [GenerationSettingsQualityEnum] to String,
/// and [decode] dynamic data back to [GenerationSettingsQualityEnum].
class GenerationSettingsQualityEnumTypeTransformer {
  factory GenerationSettingsQualityEnumTypeTransformer() => _instance ??= const GenerationSettingsQualityEnumTypeTransformer._();

  const GenerationSettingsQualityEnumTypeTransformer._();

  String encode(GenerationSettingsQualityEnum data) => data._value;

  /// Returns the instance of [GenerationSettingsQualityEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  GenerationSettingsQualityEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is GenerationSettingsQualityEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'standard': return GenerationSettingsQualityEnum.standard;
        case r'premium': return GenerationSettingsQualityEnum.premium;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static GenerationSettingsQualityEnumTypeTransformer? _instance;
}


