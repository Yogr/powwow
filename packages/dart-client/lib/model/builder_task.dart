//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BuilderTask {
  /// Returns a new [BuilderTask] instance.
  BuilderTask({
    required this.id,
    required this.title,
    this.description = '',
    this.status = BuilderTaskStatusEnum.todo,
    this.phase = 'Build',
    this.acceptance = const [],
    this.dependsOn = const [],
    this.component = 'tasks',
  });

  String id;

  String title;

  String description;

  BuilderTaskStatusEnum status;

  String phase;

  List<String> acceptance;

  List<String> dependsOn;

  String component;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BuilderTask &&
    other.id == id &&
    other.title == title &&
    other.description == description &&
    other.status == status &&
    other.phase == phase &&
    _deepEquality.equals(other.acceptance, acceptance) &&
    _deepEquality.equals(other.dependsOn, dependsOn) &&
    other.component == component;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (title.hashCode) +
    (description.hashCode) +
    (status.hashCode) +
    (phase.hashCode) +
    (acceptance.hashCode) +
    (dependsOn.hashCode) +
    (component.hashCode);

  @override
  String toString() => 'BuilderTask[id=$id, title=$title, description=$description, status=$status, phase=$phase, acceptance=$acceptance, dependsOn=$dependsOn, component=$component]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'title'] = this.title;
      json[r'description'] = this.description;
      json[r'status'] = this.status;
      json[r'phase'] = this.phase;
      json[r'acceptance'] = this.acceptance;
      json[r'depends_on'] = this.dependsOn;
      json[r'component'] = this.component;
    return json;
  }

  /// Returns a new [BuilderTask] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BuilderTask? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "BuilderTask[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "BuilderTask[id]" has a null value in JSON.');
        assert(json.containsKey(r'title'), 'Required key "BuilderTask[title]" is missing from JSON.');
        assert(json[r'title'] != null, 'Required key "BuilderTask[title]" has a null value in JSON.');
        return true;
      }());

      return BuilderTask(
        id: mapValueOfType<String>(json, r'id')!,
        title: mapValueOfType<String>(json, r'title')!,
        description: mapValueOfType<String>(json, r'description') ?? '',
        status: BuilderTaskStatusEnum.fromJson(json[r'status']) ?? BuilderTaskStatusEnum.todo,
        phase: mapValueOfType<String>(json, r'phase') ?? 'Build',
        acceptance: json[r'acceptance'] is Iterable
            ? (json[r'acceptance'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        dependsOn: json[r'depends_on'] is Iterable
            ? (json[r'depends_on'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        component: mapValueOfType<String>(json, r'component') ?? 'tasks',
      );
    }
    return null;
  }

  static List<BuilderTask> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BuilderTask>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BuilderTask.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BuilderTask> mapFromJson(dynamic json) {
    final map = <String, BuilderTask>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BuilderTask.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BuilderTask-objects as value to a dart map
  static Map<String, List<BuilderTask>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BuilderTask>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BuilderTask.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'title',
  };
}


enum BuilderTaskStatusEnum {
  todo._(r'todo'),
  doing._(r'doing'),
  blocked._(r'blocked'),
  done._(r'done'),
  ;

  /// Instantiate a new enum with the provided value.
  const BuilderTaskStatusEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [BuilderTaskStatusEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static BuilderTaskStatusEnum? fromJson(dynamic value) => BuilderTaskStatusEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [BuilderTaskStatusEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<BuilderTaskStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BuilderTaskStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BuilderTaskStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BuilderTaskStatusEnum] to String,
/// and [decode] dynamic data back to [BuilderTaskStatusEnum].
class BuilderTaskStatusEnumTypeTransformer {
  factory BuilderTaskStatusEnumTypeTransformer() => _instance ??= const BuilderTaskStatusEnumTypeTransformer._();

  const BuilderTaskStatusEnumTypeTransformer._();

  String encode(BuilderTaskStatusEnum data) => data._value;

  /// Returns the instance of [BuilderTaskStatusEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BuilderTaskStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is BuilderTaskStatusEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'todo': return BuilderTaskStatusEnum.todo;
        case r'doing': return BuilderTaskStatusEnum.doing;
        case r'blocked': return BuilderTaskStatusEnum.blocked;
        case r'done': return BuilderTaskStatusEnum.done;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static BuilderTaskStatusEnumTypeTransformer? _instance;
}


