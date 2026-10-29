//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PreferencesOut {
  /// Returns a new [PreferencesOut] instance.
  PreferencesOut({
    required this.appLanguage,
    required this.storageMode,
    required this.plan,
    required this.storageQuotaBytes,
    required this.storageUsedBytes,
    required this.storageStagedBytes,
    required this.storageReservedBytes,
    required this.storageGraceBytes,
    required this.storageFull,
    required this.localRetentionHours,
    this.checkoutAvailable = false,
    this.componentPriorities = const {},
  });

  String appLanguage;

  PreferencesOutStorageModeEnum storageMode;

  String plan;

  int storageQuotaBytes;

  int storageUsedBytes;

  int storageStagedBytes;

  int storageReservedBytes;

  int storageGraceBytes;

  bool storageFull;

  int localRetentionHours;

  bool checkoutAvailable;

  Map<String, int> componentPriorities;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PreferencesOut &&
    other.appLanguage == appLanguage &&
    other.storageMode == storageMode &&
    other.plan == plan &&
    other.storageQuotaBytes == storageQuotaBytes &&
    other.storageUsedBytes == storageUsedBytes &&
    other.storageStagedBytes == storageStagedBytes &&
    other.storageReservedBytes == storageReservedBytes &&
    other.storageGraceBytes == storageGraceBytes &&
    other.storageFull == storageFull &&
    other.localRetentionHours == localRetentionHours &&
    other.checkoutAvailable == checkoutAvailable &&
    _deepEquality.equals(other.componentPriorities, componentPriorities);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (appLanguage.hashCode) +
    (storageMode.hashCode) +
    (plan.hashCode) +
    (storageQuotaBytes.hashCode) +
    (storageUsedBytes.hashCode) +
    (storageStagedBytes.hashCode) +
    (storageReservedBytes.hashCode) +
    (storageGraceBytes.hashCode) +
    (storageFull.hashCode) +
    (localRetentionHours.hashCode) +
    (checkoutAvailable.hashCode) +
    (componentPriorities.hashCode);

  @override
  String toString() => 'PreferencesOut[appLanguage=$appLanguage, storageMode=$storageMode, plan=$plan, storageQuotaBytes=$storageQuotaBytes, storageUsedBytes=$storageUsedBytes, storageStagedBytes=$storageStagedBytes, storageReservedBytes=$storageReservedBytes, storageGraceBytes=$storageGraceBytes, storageFull=$storageFull, localRetentionHours=$localRetentionHours, checkoutAvailable=$checkoutAvailable, componentPriorities=$componentPriorities]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'app_language'] = this.appLanguage;
      json[r'storage_mode'] = this.storageMode;
      json[r'plan'] = this.plan;
      json[r'storage_quota_bytes'] = this.storageQuotaBytes;
      json[r'storage_used_bytes'] = this.storageUsedBytes;
      json[r'storage_staged_bytes'] = this.storageStagedBytes;
      json[r'storage_reserved_bytes'] = this.storageReservedBytes;
      json[r'storage_grace_bytes'] = this.storageGraceBytes;
      json[r'storage_full'] = this.storageFull;
      json[r'local_retention_hours'] = this.localRetentionHours;
      json[r'checkout_available'] = this.checkoutAvailable;
      json[r'component_priorities'] = this.componentPriorities;
    return json;
  }

  /// Returns a new [PreferencesOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PreferencesOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'app_language'), 'Required key "PreferencesOut[app_language]" is missing from JSON.');
        assert(json[r'app_language'] != null, 'Required key "PreferencesOut[app_language]" has a null value in JSON.');
        assert(json.containsKey(r'storage_mode'), 'Required key "PreferencesOut[storage_mode]" is missing from JSON.');
        assert(json[r'storage_mode'] != null, 'Required key "PreferencesOut[storage_mode]" has a null value in JSON.');
        assert(json.containsKey(r'plan'), 'Required key "PreferencesOut[plan]" is missing from JSON.');
        assert(json[r'plan'] != null, 'Required key "PreferencesOut[plan]" has a null value in JSON.');
        assert(json.containsKey(r'storage_quota_bytes'), 'Required key "PreferencesOut[storage_quota_bytes]" is missing from JSON.');
        assert(json[r'storage_quota_bytes'] != null, 'Required key "PreferencesOut[storage_quota_bytes]" has a null value in JSON.');
        assert(json.containsKey(r'storage_used_bytes'), 'Required key "PreferencesOut[storage_used_bytes]" is missing from JSON.');
        assert(json[r'storage_used_bytes'] != null, 'Required key "PreferencesOut[storage_used_bytes]" has a null value in JSON.');
        assert(json.containsKey(r'storage_staged_bytes'), 'Required key "PreferencesOut[storage_staged_bytes]" is missing from JSON.');
        assert(json[r'storage_staged_bytes'] != null, 'Required key "PreferencesOut[storage_staged_bytes]" has a null value in JSON.');
        assert(json.containsKey(r'storage_reserved_bytes'), 'Required key "PreferencesOut[storage_reserved_bytes]" is missing from JSON.');
        assert(json[r'storage_reserved_bytes'] != null, 'Required key "PreferencesOut[storage_reserved_bytes]" has a null value in JSON.');
        assert(json.containsKey(r'storage_grace_bytes'), 'Required key "PreferencesOut[storage_grace_bytes]" is missing from JSON.');
        assert(json[r'storage_grace_bytes'] != null, 'Required key "PreferencesOut[storage_grace_bytes]" has a null value in JSON.');
        assert(json.containsKey(r'storage_full'), 'Required key "PreferencesOut[storage_full]" is missing from JSON.');
        assert(json[r'storage_full'] != null, 'Required key "PreferencesOut[storage_full]" has a null value in JSON.');
        assert(json.containsKey(r'local_retention_hours'), 'Required key "PreferencesOut[local_retention_hours]" is missing from JSON.');
        assert(json[r'local_retention_hours'] != null, 'Required key "PreferencesOut[local_retention_hours]" has a null value in JSON.');
        assert(json.containsKey(r'component_priorities'), 'Required key "PreferencesOut[component_priorities]" is missing from JSON.');
        assert(json[r'component_priorities'] != null, 'Required key "PreferencesOut[component_priorities]" has a null value in JSON.');
        return true;
      }());

      return PreferencesOut(
        appLanguage: mapValueOfType<String>(json, r'app_language')!,
        storageMode: PreferencesOutStorageModeEnum.fromJson(json[r'storage_mode'])!,
        plan: mapValueOfType<String>(json, r'plan')!,
        storageQuotaBytes: mapValueOfType<int>(json, r'storage_quota_bytes')!,
        storageUsedBytes: mapValueOfType<int>(json, r'storage_used_bytes')!,
        storageStagedBytes: mapValueOfType<int>(json, r'storage_staged_bytes')!,
        storageReservedBytes: mapValueOfType<int>(json, r'storage_reserved_bytes')!,
        storageGraceBytes: mapValueOfType<int>(json, r'storage_grace_bytes')!,
        storageFull: mapValueOfType<bool>(json, r'storage_full')!,
        localRetentionHours: mapValueOfType<int>(json, r'local_retention_hours')!,
        checkoutAvailable: mapValueOfType<bool>(json, r'checkout_available') ?? false,
        componentPriorities: mapCastOfType<String, int>(json, r'component_priorities')!,
      );
    }
    return null;
  }

  static List<PreferencesOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PreferencesOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PreferencesOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PreferencesOut> mapFromJson(dynamic json) {
    final map = <String, PreferencesOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PreferencesOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PreferencesOut-objects as value to a dart map
  static Map<String, List<PreferencesOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PreferencesOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PreferencesOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'app_language',
    'storage_mode',
    'plan',
    'storage_quota_bytes',
    'storage_used_bytes',
    'storage_staged_bytes',
    'storage_reserved_bytes',
    'storage_grace_bytes',
    'storage_full',
    'local_retention_hours',
    'component_priorities',
  };
}


enum PreferencesOutStorageModeEnum {
  unselected._(r'unselected'),
  local._(r'local'),
  cloud._(r'cloud'),
  ;

  /// Instantiate a new enum with the provided value.
  const PreferencesOutStorageModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [PreferencesOutStorageModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static PreferencesOutStorageModeEnum? fromJson(dynamic value) => PreferencesOutStorageModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [PreferencesOutStorageModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<PreferencesOutStorageModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PreferencesOutStorageModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PreferencesOutStorageModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PreferencesOutStorageModeEnum] to String,
/// and [decode] dynamic data back to [PreferencesOutStorageModeEnum].
class PreferencesOutStorageModeEnumTypeTransformer {
  factory PreferencesOutStorageModeEnumTypeTransformer() => _instance ??= const PreferencesOutStorageModeEnumTypeTransformer._();

  const PreferencesOutStorageModeEnumTypeTransformer._();

  String encode(PreferencesOutStorageModeEnum data) => data._value;

  /// Returns the instance of [PreferencesOutStorageModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PreferencesOutStorageModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is PreferencesOutStorageModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'unselected': return PreferencesOutStorageModeEnum.unselected;
        case r'local': return PreferencesOutStorageModeEnum.local;
        case r'cloud': return PreferencesOutStorageModeEnum.cloud;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static PreferencesOutStorageModeEnumTypeTransformer? _instance;
}


