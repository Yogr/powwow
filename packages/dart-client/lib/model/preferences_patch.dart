//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PreferencesPatch {
  /// Returns a new [PreferencesPatch] instance.
  PreferencesPatch({
    this.appLanguage,
    this.storageMode,
    this.componentPriorities = const {},
  });

  String? appLanguage;

  PreferencesPatchStorageModeEnum? storageMode;

  Map<String, int>? componentPriorities;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PreferencesPatch &&
    other.appLanguage == appLanguage &&
    other.storageMode == storageMode &&
    _deepEquality.equals(other.componentPriorities, componentPriorities);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (appLanguage == null ? 0 : appLanguage!.hashCode) +
    (storageMode == null ? 0 : storageMode!.hashCode) +
    (componentPriorities == null ? 0 : componentPriorities!.hashCode);

  @override
  String toString() => 'PreferencesPatch[appLanguage=$appLanguage, storageMode=$storageMode, componentPriorities=$componentPriorities]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.appLanguage != null) {
      json[r'app_language'] = this.appLanguage;
    } else {
      json[r'app_language'] = null;
    }
    if (this.storageMode != null) {
      json[r'storage_mode'] = this.storageMode;
    } else {
      json[r'storage_mode'] = null;
    }
    if (this.componentPriorities != null) {
      json[r'component_priorities'] = this.componentPriorities;
    } else {
      json[r'component_priorities'] = null;
    }
    return json;
  }

  /// Returns a new [PreferencesPatch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PreferencesPatch? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return PreferencesPatch(
        appLanguage: mapValueOfType<String>(json, r'app_language'),
        storageMode: PreferencesPatchStorageModeEnum.fromJson(json[r'storage_mode']),
        componentPriorities: mapCastOfType<String, int>(json, r'component_priorities') ?? const {},
      );
    }
    return null;
  }

  static List<PreferencesPatch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PreferencesPatch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PreferencesPatch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PreferencesPatch> mapFromJson(dynamic json) {
    final map = <String, PreferencesPatch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PreferencesPatch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PreferencesPatch-objects as value to a dart map
  static Map<String, List<PreferencesPatch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PreferencesPatch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PreferencesPatch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum PreferencesPatchStorageModeEnum {
  unselected._(r'unselected'),
  local._(r'local'),
  cloud._(r'cloud'),
  ;

  /// Instantiate a new enum with the provided value.
  const PreferencesPatchStorageModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [PreferencesPatchStorageModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static PreferencesPatchStorageModeEnum? fromJson(dynamic value) => PreferencesPatchStorageModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [PreferencesPatchStorageModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<PreferencesPatchStorageModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PreferencesPatchStorageModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PreferencesPatchStorageModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PreferencesPatchStorageModeEnum] to String,
/// and [decode] dynamic data back to [PreferencesPatchStorageModeEnum].
class PreferencesPatchStorageModeEnumTypeTransformer {
  factory PreferencesPatchStorageModeEnumTypeTransformer() => _instance ??= const PreferencesPatchStorageModeEnumTypeTransformer._();

  const PreferencesPatchStorageModeEnumTypeTransformer._();

  String encode(PreferencesPatchStorageModeEnum data) => data._value;

  /// Returns the instance of [PreferencesPatchStorageModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PreferencesPatchStorageModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is PreferencesPatchStorageModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'unselected': return PreferencesPatchStorageModeEnum.unselected;
        case r'local': return PreferencesPatchStorageModeEnum.local;
        case r'cloud': return PreferencesPatchStorageModeEnum.cloud;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static PreferencesPatchStorageModeEnumTypeTransformer? _instance;
}


