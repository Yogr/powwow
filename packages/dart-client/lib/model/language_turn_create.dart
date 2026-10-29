//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageTurnCreate {
  /// Returns a new [LanguageTurnCreate] instance.
  LanguageTurnCreate({
    this.intelligence = LanguageTurnCreateIntelligenceEnum.basic,
    this.text = '',
    this.action = LanguageTurnCreateActionEnum.reply,
    required this.idempotencyKey,
    this.budgetUsd = 1,
  });

  LanguageTurnCreateIntelligenceEnum intelligence;

  String text;

  LanguageTurnCreateActionEnum action;

  String idempotencyKey;

  /// Minimum value: 0.0
  /// Maximum value: 100.0
  num budgetUsd;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageTurnCreate &&
    other.intelligence == intelligence &&
    other.text == text &&
    other.action == action &&
    other.idempotencyKey == idempotencyKey &&
    other.budgetUsd == budgetUsd;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (intelligence.hashCode) +
    (text.hashCode) +
    (action.hashCode) +
    (idempotencyKey.hashCode) +
    (budgetUsd.hashCode);

  @override
  String toString() => 'LanguageTurnCreate[intelligence=$intelligence, text=$text, action=$action, idempotencyKey=$idempotencyKey, budgetUsd=$budgetUsd]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'intelligence'] = this.intelligence;
      json[r'text'] = this.text;
      json[r'action'] = this.action;
      json[r'idempotency_key'] = this.idempotencyKey;
      json[r'budget_usd'] = this.budgetUsd;
    return json;
  }

  /// Returns a new [LanguageTurnCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageTurnCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'idempotency_key'), 'Required key "LanguageTurnCreate[idempotency_key]" is missing from JSON.');
        assert(json[r'idempotency_key'] != null, 'Required key "LanguageTurnCreate[idempotency_key]" has a null value in JSON.');
        return true;
      }());

      return LanguageTurnCreate(
        intelligence: LanguageTurnCreateIntelligenceEnum.fromJson(json[r'intelligence']) ?? LanguageTurnCreateIntelligenceEnum.basic,
        text: mapValueOfType<String>(json, r'text') ?? '',
        action: LanguageTurnCreateActionEnum.fromJson(json[r'action']) ?? LanguageTurnCreateActionEnum.reply,
        idempotencyKey: mapValueOfType<String>(json, r'idempotency_key')!,
        budgetUsd: json[r'budget_usd'] == null
            ? 1
            : num.parse('${json[r'budget_usd']}'),
      );
    }
    return null;
  }

  static List<LanguageTurnCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageTurnCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageTurnCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageTurnCreate> mapFromJson(dynamic json) {
    final map = <String, LanguageTurnCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageTurnCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageTurnCreate-objects as value to a dart map
  static Map<String, List<LanguageTurnCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageTurnCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageTurnCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'idempotency_key',
  };
}


enum LanguageTurnCreateIntelligenceEnum {
  basic._(r'basic'),
  smarter._(r'smarter'),
  advanced._(r'advanced'),
  ;

  /// Instantiate a new enum with the provided value.
  const LanguageTurnCreateIntelligenceEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [LanguageTurnCreateIntelligenceEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static LanguageTurnCreateIntelligenceEnum? fromJson(dynamic value) => LanguageTurnCreateIntelligenceEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [LanguageTurnCreateIntelligenceEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<LanguageTurnCreateIntelligenceEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageTurnCreateIntelligenceEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageTurnCreateIntelligenceEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LanguageTurnCreateIntelligenceEnum] to String,
/// and [decode] dynamic data back to [LanguageTurnCreateIntelligenceEnum].
class LanguageTurnCreateIntelligenceEnumTypeTransformer {
  factory LanguageTurnCreateIntelligenceEnumTypeTransformer() => _instance ??= const LanguageTurnCreateIntelligenceEnumTypeTransformer._();

  const LanguageTurnCreateIntelligenceEnumTypeTransformer._();

  String encode(LanguageTurnCreateIntelligenceEnum data) => data._value;

  /// Returns the instance of [LanguageTurnCreateIntelligenceEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LanguageTurnCreateIntelligenceEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is LanguageTurnCreateIntelligenceEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'basic': return LanguageTurnCreateIntelligenceEnum.basic;
        case r'smarter': return LanguageTurnCreateIntelligenceEnum.smarter;
        case r'advanced': return LanguageTurnCreateIntelligenceEnum.advanced;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static LanguageTurnCreateIntelligenceEnumTypeTransformer? _instance;
}



enum LanguageTurnCreateActionEnum {
  reply._(r'reply'),
  start._(r'start'),
  topic._(r'topic'),
  help._(r'help'),
  ;

  /// Instantiate a new enum with the provided value.
  const LanguageTurnCreateActionEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [LanguageTurnCreateActionEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static LanguageTurnCreateActionEnum? fromJson(dynamic value) => LanguageTurnCreateActionEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [LanguageTurnCreateActionEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<LanguageTurnCreateActionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageTurnCreateActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageTurnCreateActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LanguageTurnCreateActionEnum] to String,
/// and [decode] dynamic data back to [LanguageTurnCreateActionEnum].
class LanguageTurnCreateActionEnumTypeTransformer {
  factory LanguageTurnCreateActionEnumTypeTransformer() => _instance ??= const LanguageTurnCreateActionEnumTypeTransformer._();

  const LanguageTurnCreateActionEnumTypeTransformer._();

  String encode(LanguageTurnCreateActionEnum data) => data._value;

  /// Returns the instance of [LanguageTurnCreateActionEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LanguageTurnCreateActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is LanguageTurnCreateActionEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'reply': return LanguageTurnCreateActionEnum.reply;
        case r'start': return LanguageTurnCreateActionEnum.start;
        case r'topic': return LanguageTurnCreateActionEnum.topic;
        case r'help': return LanguageTurnCreateActionEnum.help;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static LanguageTurnCreateActionEnumTypeTransformer? _instance;
}


