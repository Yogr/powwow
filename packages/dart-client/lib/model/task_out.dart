//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TaskOut {
  /// Returns a new [TaskOut] instance.
  TaskOut({
    required this.title,
    this.description = '',
    this.status = TaskOutStatusEnum.todo,
    this.assigneeId,
    required this.id,
    required this.projectId,
    required this.organizationId,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  String title;

  String description;

  TaskOutStatusEnum status;

  String? assigneeId;

  String id;

  String projectId;

  String? organizationId;

  String createdBy;

  DateTime createdAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TaskOut &&
    other.title == title &&
    other.description == description &&
    other.status == status &&
    other.assigneeId == assigneeId &&
    other.id == id &&
    other.projectId == projectId &&
    other.organizationId == organizationId &&
    other.createdBy == createdBy &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (title.hashCode) +
    (description.hashCode) +
    (status.hashCode) +
    (assigneeId == null ? 0 : assigneeId!.hashCode) +
    (id.hashCode) +
    (projectId.hashCode) +
    (organizationId == null ? 0 : organizationId!.hashCode) +
    (createdBy.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'TaskOut[title=$title, description=$description, status=$status, assigneeId=$assigneeId, id=$id, projectId=$projectId, organizationId=$organizationId, createdBy=$createdBy, createdAt=$createdAt, updatedAt=$updatedAt]';

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
      json[r'id'] = this.id;
      json[r'project_id'] = this.projectId;
    if (this.organizationId != null) {
      json[r'organization_id'] = this.organizationId;
    } else {
      json[r'organization_id'] = null;
    }
      json[r'created_by'] = this.createdBy;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [TaskOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TaskOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'title'), 'Required key "TaskOut[title]" is missing from JSON.');
        assert(json[r'title'] != null, 'Required key "TaskOut[title]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "TaskOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "TaskOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'project_id'), 'Required key "TaskOut[project_id]" is missing from JSON.');
        assert(json[r'project_id'] != null, 'Required key "TaskOut[project_id]" has a null value in JSON.');
        assert(json.containsKey(r'organization_id'), 'Required key "TaskOut[organization_id]" is missing from JSON.');
        assert(json.containsKey(r'created_by'), 'Required key "TaskOut[created_by]" is missing from JSON.');
        assert(json[r'created_by'] != null, 'Required key "TaskOut[created_by]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "TaskOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "TaskOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "TaskOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "TaskOut[updated_at]" has a null value in JSON.');
        return true;
      }());

      return TaskOut(
        title: mapValueOfType<String>(json, r'title')!,
        description: mapValueOfType<String>(json, r'description') ?? '',
        status: TaskOutStatusEnum.fromJson(json[r'status']) ?? TaskOutStatusEnum.todo,
        assigneeId: mapValueOfType<String>(json, r'assignee_id'),
        id: mapValueOfType<String>(json, r'id')!,
        projectId: mapValueOfType<String>(json, r'project_id')!,
        organizationId: mapValueOfType<String>(json, r'organization_id'),
        createdBy: mapValueOfType<String>(json, r'created_by')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
      );
    }
    return null;
  }

  static List<TaskOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TaskOut> mapFromJson(dynamic json) {
    final map = <String, TaskOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TaskOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TaskOut-objects as value to a dart map
  static Map<String, List<TaskOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TaskOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TaskOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'title',
    'id',
    'project_id',
    'organization_id',
    'created_by',
    'created_at',
    'updated_at',
  };
}


enum TaskOutStatusEnum {
  todo._(r'todo'),
  inProgress._(r'in_progress'),
  review._(r'review'),
  done._(r'done'),
  ;

  /// Instantiate a new enum with the provided value.
  const TaskOutStatusEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [TaskOutStatusEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static TaskOutStatusEnum? fromJson(dynamic value) => TaskOutStatusEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [TaskOutStatusEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<TaskOutStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskOutStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskOutStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TaskOutStatusEnum] to String,
/// and [decode] dynamic data back to [TaskOutStatusEnum].
class TaskOutStatusEnumTypeTransformer {
  factory TaskOutStatusEnumTypeTransformer() => _instance ??= const TaskOutStatusEnumTypeTransformer._();

  const TaskOutStatusEnumTypeTransformer._();

  String encode(TaskOutStatusEnum data) => data._value;

  /// Returns the instance of [TaskOutStatusEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskOutStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is TaskOutStatusEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'todo': return TaskOutStatusEnum.todo;
        case r'in_progress': return TaskOutStatusEnum.inProgress;
        case r'review': return TaskOutStatusEnum.review;
        case r'done': return TaskOutStatusEnum.done;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static TaskOutStatusEnumTypeTransformer? _instance;
}


