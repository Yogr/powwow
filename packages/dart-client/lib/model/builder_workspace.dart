//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BuilderWorkspace {
  /// Returns a new [BuilderWorkspace] instance.
  BuilderWorkspace({
    this.kind,
    this.initialized = false,
    this.brief = '',
    this.answers = const {},
    this.assumptions = const [],
    this.components = const [],
    this.tasks = const [],
    this.records = const {},
    this.detailCategories = const [],
    this.design = '',
    this.planPrompt = '',
  });

  BuilderWorkspaceKindEnum? kind;

  bool initialized;

  String brief;

  Map<String, String> answers;

  List<String> assumptions;

  List<String> components;

  List<BuilderTask> tasks;

  Map<String, List<BuilderRecord>> records;

  List<DetailCategory> detailCategories;

  String design;

  String planPrompt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BuilderWorkspace &&
    other.kind == kind &&
    other.initialized == initialized &&
    other.brief == brief &&
    _deepEquality.equals(other.answers, answers) &&
    _deepEquality.equals(other.assumptions, assumptions) &&
    _deepEquality.equals(other.components, components) &&
    _deepEquality.equals(other.tasks, tasks) &&
    _deepEquality.equals(other.records, records) &&
    _deepEquality.equals(other.detailCategories, detailCategories) &&
    other.design == design &&
    other.planPrompt == planPrompt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (kind == null ? 0 : kind!.hashCode) +
    (initialized.hashCode) +
    (brief.hashCode) +
    (answers.hashCode) +
    (assumptions.hashCode) +
    (components.hashCode) +
    (tasks.hashCode) +
    (records.hashCode) +
    (detailCategories.hashCode) +
    (design.hashCode) +
    (planPrompt.hashCode);

  @override
  String toString() => 'BuilderWorkspace[kind=$kind, initialized=$initialized, brief=$brief, answers=$answers, assumptions=$assumptions, components=$components, tasks=$tasks, records=$records, detailCategories=$detailCategories, design=$design, planPrompt=$planPrompt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.kind != null) {
      json[r'kind'] = this.kind;
    } else {
      json[r'kind'] = null;
    }
      json[r'initialized'] = this.initialized;
      json[r'brief'] = this.brief;
      json[r'answers'] = this.answers;
      json[r'assumptions'] = this.assumptions;
      json[r'components'] = this.components;
      json[r'tasks'] = this.tasks;
      json[r'records'] = this.records;
      json[r'detail_categories'] = this.detailCategories;
      json[r'design'] = this.design;
      json[r'plan_prompt'] = this.planPrompt;
    return json;
  }

  /// Returns a new [BuilderWorkspace] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BuilderWorkspace? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return BuilderWorkspace(
        kind: BuilderWorkspaceKindEnum.fromJson(json[r'kind']),
        initialized: mapValueOfType<bool>(json, r'initialized') ?? false,
        brief: mapValueOfType<String>(json, r'brief') ?? '',
        answers: mapCastOfType<String, String>(json, r'answers') ?? const {},
        assumptions: json[r'assumptions'] is Iterable
            ? (json[r'assumptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        components: json[r'components'] is Iterable
            ? (json[r'components'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        tasks: BuilderTask.listFromJson(json[r'tasks']),
        records: json[r'records'] == null
          ? const {}
            : BuilderRecord.mapListFromJson(json[r'records']),
        detailCategories: DetailCategory.listFromJson(json[r'detail_categories']),
        design: mapValueOfType<String>(json, r'design') ?? '',
        planPrompt: mapValueOfType<String>(json, r'plan_prompt') ?? '',
      );
    }
    return null;
  }

  static List<BuilderWorkspace> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BuilderWorkspace>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BuilderWorkspace.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BuilderWorkspace> mapFromJson(dynamic json) {
    final map = <String, BuilderWorkspace>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BuilderWorkspace.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BuilderWorkspace-objects as value to a dart map
  static Map<String, List<BuilderWorkspace>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BuilderWorkspace>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BuilderWorkspace.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum BuilderWorkspaceKindEnum {
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
  const BuilderWorkspaceKindEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [BuilderWorkspaceKindEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static BuilderWorkspaceKindEnum? fromJson(dynamic value) => BuilderWorkspaceKindEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [BuilderWorkspaceKindEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<BuilderWorkspaceKindEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BuilderWorkspaceKindEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BuilderWorkspaceKindEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BuilderWorkspaceKindEnum] to String,
/// and [decode] dynamic data back to [BuilderWorkspaceKindEnum].
class BuilderWorkspaceKindEnumTypeTransformer {
  factory BuilderWorkspaceKindEnumTypeTransformer() => _instance ??= const BuilderWorkspaceKindEnumTypeTransformer._();

  const BuilderWorkspaceKindEnumTypeTransformer._();

  String encode(BuilderWorkspaceKindEnum data) => data._value;

  /// Returns the instance of [BuilderWorkspaceKindEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BuilderWorkspaceKindEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is BuilderWorkspaceKindEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'game': return BuilderWorkspaceKindEnum.game;
        case r'movie': return BuilderWorkspaceKindEnum.movie;
        case r'book': return BuilderWorkspaceKindEnum.book;
        case r'comic': return BuilderWorkspaceKindEnum.comic;
        case r'website': return BuilderWorkspaceKindEnum.website;
        case r'app': return BuilderWorkspaceKindEnum.app;
        case r'podcast': return BuilderWorkspaceKindEnum.podcast;
        case r'music': return BuilderWorkspaceKindEnum.music;
        case r'course': return BuilderWorkspaceKindEnum.course;
        case r'brand': return BuilderWorkspaceKindEnum.brand;
        case r'research': return BuilderWorkspaceKindEnum.research;
        case r'language': return BuilderWorkspaceKindEnum.language;
        case r'other': return BuilderWorkspaceKindEnum.other;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static BuilderWorkspaceKindEnumTypeTransformer? _instance;
}


