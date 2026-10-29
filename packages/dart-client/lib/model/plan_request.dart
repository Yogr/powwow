//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PlanRequest {
  /// Returns a new [PlanRequest] instance.
  PlanRequest({
    required this.prompt,
    this.kind,
    this.answers = const {},
    this.explicit = false,
  });

  String prompt;

  PlanRequestKindEnum? kind;

  Map<String, String> answers;

  bool explicit;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PlanRequest &&
    other.prompt == prompt &&
    other.kind == kind &&
    _deepEquality.equals(other.answers, answers) &&
    other.explicit == explicit;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (prompt.hashCode) +
    (kind == null ? 0 : kind!.hashCode) +
    (answers.hashCode) +
    (explicit.hashCode);

  @override
  String toString() => 'PlanRequest[prompt=$prompt, kind=$kind, answers=$answers, explicit=$explicit]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'prompt'] = this.prompt;
    if (this.kind != null) {
      json[r'kind'] = this.kind;
    } else {
      json[r'kind'] = null;
    }
      json[r'answers'] = this.answers;
      json[r'explicit'] = this.explicit;
    return json;
  }

  /// Returns a new [PlanRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PlanRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'prompt'), 'Required key "PlanRequest[prompt]" is missing from JSON.');
        assert(json[r'prompt'] != null, 'Required key "PlanRequest[prompt]" has a null value in JSON.');
        return true;
      }());

      return PlanRequest(
        prompt: mapValueOfType<String>(json, r'prompt')!,
        kind: PlanRequestKindEnum.fromJson(json[r'kind']),
        answers: mapCastOfType<String, String>(json, r'answers') ?? const {},
        explicit: mapValueOfType<bool>(json, r'explicit') ?? false,
      );
    }
    return null;
  }

  static List<PlanRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PlanRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PlanRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PlanRequest> mapFromJson(dynamic json) {
    final map = <String, PlanRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PlanRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PlanRequest-objects as value to a dart map
  static Map<String, List<PlanRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PlanRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PlanRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'prompt',
  };
}


enum PlanRequestKindEnum {
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
  const PlanRequestKindEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [PlanRequestKindEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static PlanRequestKindEnum? fromJson(dynamic value) => PlanRequestKindEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [PlanRequestKindEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<PlanRequestKindEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PlanRequestKindEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PlanRequestKindEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PlanRequestKindEnum] to String,
/// and [decode] dynamic data back to [PlanRequestKindEnum].
class PlanRequestKindEnumTypeTransformer {
  factory PlanRequestKindEnumTypeTransformer() => _instance ??= const PlanRequestKindEnumTypeTransformer._();

  const PlanRequestKindEnumTypeTransformer._();

  String encode(PlanRequestKindEnum data) => data._value;

  /// Returns the instance of [PlanRequestKindEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PlanRequestKindEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is PlanRequestKindEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'game': return PlanRequestKindEnum.game;
        case r'movie': return PlanRequestKindEnum.movie;
        case r'book': return PlanRequestKindEnum.book;
        case r'comic': return PlanRequestKindEnum.comic;
        case r'website': return PlanRequestKindEnum.website;
        case r'app': return PlanRequestKindEnum.app;
        case r'podcast': return PlanRequestKindEnum.podcast;
        case r'music': return PlanRequestKindEnum.music;
        case r'course': return PlanRequestKindEnum.course;
        case r'brand': return PlanRequestKindEnum.brand;
        case r'research': return PlanRequestKindEnum.research;
        case r'language': return PlanRequestKindEnum.language;
        case r'other': return PlanRequestKindEnum.other;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static PlanRequestKindEnumTypeTransformer? _instance;
}


