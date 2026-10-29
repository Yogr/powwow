//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PlanPreview {
  /// Returns a new [PlanPreview] instance.
  PlanPreview({
    required this.eligible,
    this.reason,
    required this.kind,
    this.answers = const {},
  });

  bool eligible;

  String? reason;

  PlanPreviewKindEnum kind;

  Map<String, String> answers;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PlanPreview &&
    other.eligible == eligible &&
    other.reason == reason &&
    other.kind == kind &&
    _deepEquality.equals(other.answers, answers);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (eligible.hashCode) +
    (reason == null ? 0 : reason!.hashCode) +
    (kind.hashCode) +
    (answers.hashCode);

  @override
  String toString() => 'PlanPreview[eligible=$eligible, reason=$reason, kind=$kind, answers=$answers]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'eligible'] = this.eligible;
    if (this.reason != null) {
      json[r'reason'] = this.reason;
    } else {
      json[r'reason'] = null;
    }
      json[r'kind'] = this.kind;
      json[r'answers'] = this.answers;
    return json;
  }

  /// Returns a new [PlanPreview] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PlanPreview? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'eligible'), 'Required key "PlanPreview[eligible]" is missing from JSON.');
        assert(json[r'eligible'] != null, 'Required key "PlanPreview[eligible]" has a null value in JSON.');
        assert(json.containsKey(r'kind'), 'Required key "PlanPreview[kind]" is missing from JSON.');
        assert(json[r'kind'] != null, 'Required key "PlanPreview[kind]" has a null value in JSON.');
        assert(json.containsKey(r'answers'), 'Required key "PlanPreview[answers]" is missing from JSON.');
        assert(json[r'answers'] != null, 'Required key "PlanPreview[answers]" has a null value in JSON.');
        return true;
      }());

      return PlanPreview(
        eligible: mapValueOfType<bool>(json, r'eligible')!,
        reason: mapValueOfType<String>(json, r'reason'),
        kind: PlanPreviewKindEnum.fromJson(json[r'kind'])!,
        answers: mapCastOfType<String, String>(json, r'answers')!,
      );
    }
    return null;
  }

  static List<PlanPreview> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PlanPreview>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PlanPreview.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PlanPreview> mapFromJson(dynamic json) {
    final map = <String, PlanPreview>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PlanPreview.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PlanPreview-objects as value to a dart map
  static Map<String, List<PlanPreview>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PlanPreview>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PlanPreview.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'eligible',
    'kind',
    'answers',
  };
}


enum PlanPreviewKindEnum {
  game._(r'game'),
  movie._(r'movie'),
  book._(r'book'),
  comic._(r'comic'),
  website._(r'website'),
  app._(r'app'),
  podcast._(r'podcast'),
  music._(r'music'),
  course._(r'course'),
  brand._(r'brand'),
  research._(r'research'),
  language._(r'language'),
  other._(r'other'),
  ;

  /// Instantiate a new enum with the provided value.
  const PlanPreviewKindEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [PlanPreviewKindEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static PlanPreviewKindEnum? fromJson(dynamic value) => PlanPreviewKindEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [PlanPreviewKindEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<PlanPreviewKindEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PlanPreviewKindEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PlanPreviewKindEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PlanPreviewKindEnum] to String,
/// and [decode] dynamic data back to [PlanPreviewKindEnum].
class PlanPreviewKindEnumTypeTransformer {
  factory PlanPreviewKindEnumTypeTransformer() => _instance ??= const PlanPreviewKindEnumTypeTransformer._();

  const PlanPreviewKindEnumTypeTransformer._();

  String encode(PlanPreviewKindEnum data) => data._value;

  /// Returns the instance of [PlanPreviewKindEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PlanPreviewKindEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is PlanPreviewKindEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'game': return PlanPreviewKindEnum.game;
        case r'movie': return PlanPreviewKindEnum.movie;
        case r'book': return PlanPreviewKindEnum.book;
        case r'comic': return PlanPreviewKindEnum.comic;
        case r'website': return PlanPreviewKindEnum.website;
        case r'app': return PlanPreviewKindEnum.app;
        case r'podcast': return PlanPreviewKindEnum.podcast;
        case r'music': return PlanPreviewKindEnum.music;
        case r'course': return PlanPreviewKindEnum.course;
        case r'brand': return PlanPreviewKindEnum.brand;
        case r'research': return PlanPreviewKindEnum.research;
        case r'language': return PlanPreviewKindEnum.language;
        case r'other': return PlanPreviewKindEnum.other;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static PlanPreviewKindEnumTypeTransformer? _instance;
}


