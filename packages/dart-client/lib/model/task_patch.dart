//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TaskPatch {
  /// Returns a new [TaskPatch] instance.
  TaskPatch({
    this.title,
    this.description,
    this.status,
    this.assigneeId,
  });

  String? title;

  String? description;

  TaskPatchStatusEnum? status;

  String? assigneeId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TaskPatch &&
    other.title == title &&
    other.description == description &&
    other.status == status &&
    other.assigneeId == assigneeId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (title == null ? 0 : title!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (status == null ? 0 : status!.hashCode) +
    (assigneeId == null ? 0 : assigneeId!.hashCode);

  @override
  String toString() => 'TaskPatch[title=$title, description=$description, status=$status, assigneeId=$assigneeId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.title != null) {
      json[r'title'] = this.title;
    } else {
      json[r'title'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
      json[r'description'] = null;
    }
    if (this.status != null) {
      json[r'status'] = this.status;
    } else {
      json[r'status'] = null;
    }
    if (this.assigneeId != null) {
      json[r'assignee_id'] = this.assigneeId;
    } else {
      json[r'assignee_id'] = null;
    }
    return json;
  }

  /// Returns a new [TaskPatch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TaskPatch? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return TaskPatch(
        title: mapValueOfType<String>(json, r'title'),
        description: mapValueOfType<String>(json, r'description'),
        status: TaskPatchStatusEnum.fromJson(json[r'status']),
        assigneeId: mapValueOfType<String>(json, r'assignee_id'),
      );
    }
    return null;
  }

  static List<TaskPatch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskPatch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskPatch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TaskPatch> mapFromJson(dynamic json) {
    final map = <String, TaskPatch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TaskPatch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TaskPatch-objects as value to a dart map
  static Map<String, List<TaskPatch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TaskPatch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TaskPatch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum TaskPatchStatusEnum {
  todo._(r'todo'),
  inProgress._(r'in_progress'),
  review._(r'review'),
  done._(r'done'),
  ;

  /// Instantiate a new enum with the provided value.
  const TaskPatchStatusEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [TaskPatchStatusEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static TaskPatchStatusEnum? fromJson(dynamic value) => TaskPatchStatusEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [TaskPatchStatusEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<TaskPatchStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskPatchStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskPatchStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TaskPatchStatusEnum] to String,
/// and [decode] dynamic data back to [TaskPatchStatusEnum].
class TaskPatchStatusEnumTypeTransformer {
  factory TaskPatchStatusEnumTypeTransformer() => _instance ??= const TaskPatchStatusEnumTypeTransformer._();

  const TaskPatchStatusEnumTypeTransformer._();

  String encode(TaskPatchStatusEnum data) => data._value;

  /// Returns the instance of [TaskPatchStatusEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskPatchStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is TaskPatchStatusEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'todo': return TaskPatchStatusEnum.todo;
        case r'in_progress': return TaskPatchStatusEnum.inProgress;
        case r'review': return TaskPatchStatusEnum.review;
        case r'done': return TaskPatchStatusEnum.done;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static TaskPatchStatusEnumTypeTransformer? _instance;
}


