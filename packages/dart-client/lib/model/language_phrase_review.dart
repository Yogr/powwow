//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguagePhraseReview {
  /// Returns a new [LanguagePhraseReview] instance.
  LanguagePhraseReview({
    required this.rating,
  });

  LanguagePhraseReviewRatingEnum rating;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguagePhraseReview &&
    other.rating == rating;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (rating.hashCode);

  @override
  String toString() => 'LanguagePhraseReview[rating=$rating]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'rating'] = this.rating;
    return json;
  }

  /// Returns a new [LanguagePhraseReview] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguagePhraseReview? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'rating'), 'Required key "LanguagePhraseReview[rating]" is missing from JSON.');
        assert(json[r'rating'] != null, 'Required key "LanguagePhraseReview[rating]" has a null value in JSON.');
        return true;
      }());

      return LanguagePhraseReview(
        rating: LanguagePhraseReviewRatingEnum.fromJson(json[r'rating'])!,
      );
    }
    return null;
  }

  static List<LanguagePhraseReview> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguagePhraseReview>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguagePhraseReview.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguagePhraseReview> mapFromJson(dynamic json) {
    final map = <String, LanguagePhraseReview>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguagePhraseReview.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguagePhraseReview-objects as value to a dart map
  static Map<String, List<LanguagePhraseReview>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguagePhraseReview>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguagePhraseReview.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'rating',
  };
}


enum LanguagePhraseReviewRatingEnum {
  again._(r'again'),
  good._(r'good'),
  ;

  /// Instantiate a new enum with the provided value.
  const LanguagePhraseReviewRatingEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [LanguagePhraseReviewRatingEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static LanguagePhraseReviewRatingEnum? fromJson(dynamic value) => LanguagePhraseReviewRatingEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [LanguagePhraseReviewRatingEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<LanguagePhraseReviewRatingEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguagePhraseReviewRatingEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguagePhraseReviewRatingEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LanguagePhraseReviewRatingEnum] to String,
/// and [decode] dynamic data back to [LanguagePhraseReviewRatingEnum].
class LanguagePhraseReviewRatingEnumTypeTransformer {
  factory LanguagePhraseReviewRatingEnumTypeTransformer() => _instance ??= const LanguagePhraseReviewRatingEnumTypeTransformer._();

  const LanguagePhraseReviewRatingEnumTypeTransformer._();

  String encode(LanguagePhraseReviewRatingEnum data) => data._value;

  /// Returns the instance of [LanguagePhraseReviewRatingEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LanguagePhraseReviewRatingEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is LanguagePhraseReviewRatingEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'again': return LanguagePhraseReviewRatingEnum.again;
        case r'good': return LanguagePhraseReviewRatingEnum.good;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static LanguagePhraseReviewRatingEnumTypeTransformer? _instance;
}


