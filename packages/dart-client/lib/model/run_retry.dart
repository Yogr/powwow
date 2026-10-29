//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunRetry {
  /// Returns a new [RunRetry] instance.
  RunRetry({
    required this.idempotencyKey,
    this.budgetUsd,
    this.intelligence,
  });

  String idempotencyKey;

  /// Minimum value: 0.0
  /// Maximum value: 100.0
  num? budgetUsd;

  RunRetryIntelligenceEnum? intelligence;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunRetry &&
    other.idempotencyKey == idempotencyKey &&
    other.budgetUsd == budgetUsd &&
    other.intelligence == intelligence;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (idempotencyKey.hashCode) +
    (budgetUsd == null ? 0 : budgetUsd!.hashCode) +
    (intelligence == null ? 0 : intelligence!.hashCode);

  @override
  String toString() => 'RunRetry[idempotencyKey=$idempotencyKey, budgetUsd=$budgetUsd, intelligence=$intelligence]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'idempotency_key'] = this.idempotencyKey;
    if (this.budgetUsd != null) {
      json[r'budget_usd'] = this.budgetUsd;
    } else {
      json[r'budget_usd'] = null;
    }
    if (this.intelligence != null) {
      json[r'intelligence'] = this.intelligence;
    } else {
      json[r'intelligence'] = null;
    }
    return json;
  }

  /// Returns a new [RunRetry] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunRetry? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'idempotency_key'), 'Required key "RunRetry[idempotency_key]" is missing from JSON.');
        assert(json[r'idempotency_key'] != null, 'Required key "RunRetry[idempotency_key]" has a null value in JSON.');
        return true;
      }());

      return RunRetry(
        idempotencyKey: mapValueOfType<String>(json, r'idempotency_key')!,
        budgetUsd: json[r'budget_usd'] == null
            ? null
            : num.parse('${json[r'budget_usd']}'),
        intelligence: RunRetryIntelligenceEnum.fromJson(json[r'intelligence']),
      );
    }
    return null;
  }

  static List<RunRetry> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunRetry>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunRetry.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunRetry> mapFromJson(dynamic json) {
    final map = <String, RunRetry>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunRetry.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunRetry-objects as value to a dart map
  static Map<String, List<RunRetry>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunRetry>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunRetry.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'idempotency_key',
  };
}


enum RunRetryIntelligenceEnum {
  basic._(r'basic'),
  smarter._(r'smarter'),
  advanced._(r'advanced'),
  super_._(r'super'),
  ;

  /// Instantiate a new enum with the provided value.
  const RunRetryIntelligenceEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [RunRetryIntelligenceEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static RunRetryIntelligenceEnum? fromJson(dynamic value) => RunRetryIntelligenceEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [RunRetryIntelligenceEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<RunRetryIntelligenceEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunRetryIntelligenceEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunRetryIntelligenceEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RunRetryIntelligenceEnum] to String,
/// and [decode] dynamic data back to [RunRetryIntelligenceEnum].
class RunRetryIntelligenceEnumTypeTransformer {
  factory RunRetryIntelligenceEnumTypeTransformer() => _instance ??= const RunRetryIntelligenceEnumTypeTransformer._();

  const RunRetryIntelligenceEnumTypeTransformer._();

  String encode(RunRetryIntelligenceEnum data) => data._value;

  /// Returns the instance of [RunRetryIntelligenceEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RunRetryIntelligenceEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is RunRetryIntelligenceEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'basic': return RunRetryIntelligenceEnum.basic;
        case r'smarter': return RunRetryIntelligenceEnum.smarter;
        case r'advanced': return RunRetryIntelligenceEnum.advanced;
        case r'super': return RunRetryIntelligenceEnum.super_;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static RunRetryIntelligenceEnumTypeTransformer? _instance;
}


