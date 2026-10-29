//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TaskCreate {
  /// Returns a new [TaskCreate] instance.
  TaskCreate({
    required this.title,
    this.description = '',
    this.status = TaskCreateStatusEnum.todo,
    this.assigneeId,
  });

  String title;

  String description;

  TaskCreateStatusEnum status;

  String? assigneeId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TaskCreate &&
    other.title == title &&
    other.description == description &&
    other.status == status &&
    other.assigneeId == assigneeId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (title.hashCode) +
    (description.hashCode) +
    (status.hashCode) +
    (assigneeId == null ? 0 : assigneeId!.hashCode);

  @override
  String toString() => 'TaskCreate[title=$title, description=$description, status=$status, assigneeId=$assigneeId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'title'] = this.title;
      json[r'description'] = this.description;
      json[r'status'] = this.status;
    if (this.assigneeId != null) {
      json[r'assignee_id'] = this.assigneeId;
    } else {
      json[r'assignee_id'] = null;
    }
    return json;
  }

  /// Returns a new [TaskCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TaskCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'title'), 'Required key "TaskCreate[title]" is missing from JSON.');
        assert(json[r'title'] != null, 'Required key "TaskCreate[title]" has a null value in JSON.');
        return true;
      }());

      return TaskCreate(
        title: mapValueOfType<String>(json, r'title')!,
        description: mapValueOfType<String>(json, r'description') ?? '',
        status: TaskCreateStatusEnum.fromJson(json[r'status']) ?? TaskCreateStatusEnum.todo,
        assigneeId: mapValueOfType<String>(json, r'assignee_id'),
      );
    }
    return null;
  }

  static List<TaskCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TaskCreate> mapFromJson(dynamic json) {
    final map = <String, TaskCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TaskCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TaskCreate-objects as value to a dart map
  static Map<String, List<TaskCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TaskCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TaskCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'title',
  };
}


enum TaskCreateStatusEnum {
  todo._(r'todo'),
  inProgress._(r'in_progress'),
  review._(r'review'),
  done._(r'done'),
  ;

  /// Instantiate a new enum with the provided value.
  const TaskCreateStatusEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [TaskCreateStatusEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static TaskCreateStatusEnum? fromJson(dynamic value) => TaskCreateStatusEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [TaskCreateStatusEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<TaskCreateStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskCreateStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskCreateStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TaskCreateStatusEnum] to String,
/// and [decode] dynamic data back to [TaskCreateStatusEnum].
class TaskCreateStatusEnumTypeTransformer {
  factory TaskCreateStatusEnumTypeTransformer() => _instance ??= const TaskCreateStatusEnumTypeTransformer._();

  const TaskCreateStatusEnumTypeTransformer._();

  String encode(TaskCreateStatusEnum data) => data._value;

  /// Returns the instance of [TaskCreateStatusEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskCreateStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is TaskCreateStatusEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'todo': return TaskCreateStatusEnum.todo;
        case r'in_progress': return TaskCreateStatusEnum.inProgress;
        case r'review': return TaskCreateStatusEnum.review;
        case r'done': return TaskCreateStatusEnum.done;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static TaskCreateStatusEnumTypeTransformer? _instance;
}


