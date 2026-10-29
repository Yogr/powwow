//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ProjectOut {
  /// Returns a new [ProjectOut] instance.
  ProjectOut({
    required this.name,
    this.instructions = '',
    this.contextMode = ProjectOutContextModeEnum.project,
    this.storageMode,
    this.organizationId,
    required this.id,
    required this.archived,
    required this.createdAt,
    required this.updatedAt,
  });

  String name;

  String instructions;

  ProjectOutContextModeEnum contextMode;

  ProjectOutStorageModeEnum? storageMode;

  String? organizationId;

  String id;

  bool archived;

  DateTime createdAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ProjectOut &&
    other.name == name &&
    other.instructions == instructions &&
    other.contextMode == contextMode &&
    other.storageMode == storageMode &&
    other.organizationId == organizationId &&
    other.id == id &&
    other.archived == archived &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (instructions.hashCode) +
    (contextMode.hashCode) +
    (storageMode == null ? 0 : storageMode!.hashCode) +
    (organizationId == null ? 0 : organizationId!.hashCode) +
    (id.hashCode) +
    (archived.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'ProjectOut[name=$name, instructions=$instructions, contextMode=$contextMode, storageMode=$storageMode, organizationId=$organizationId, id=$id, archived=$archived, createdAt=$createdAt, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
      json[r'instructions'] = this.instructions;
      json[r'context_mode'] = this.contextMode;
    if (this.storageMode != null) {
      json[r'storage_mode'] = this.storageMode;
    } else {
      json[r'storage_mode'] = null;
    }
    if (this.organizationId != null) {
      json[r'organization_id'] = this.organizationId;
    } else {
      json[r'organization_id'] = null;
    }
      json[r'id'] = this.id;
      json[r'archived'] = this.archived;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [ProjectOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ProjectOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "ProjectOut[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "ProjectOut[name]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "ProjectOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "ProjectOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'archived'), 'Required key "ProjectOut[archived]" is missing from JSON.');
        assert(json[r'archived'] != null, 'Required key "ProjectOut[archived]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "ProjectOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "ProjectOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "ProjectOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "ProjectOut[updated_at]" has a null value in JSON.');
        return true;
      }());

      return ProjectOut(
        name: mapValueOfType<String>(json, r'name')!,
        instructions: mapValueOfType<String>(json, r'instructions') ?? '',
        contextMode: ProjectOutContextModeEnum.fromJson(json[r'context_mode']) ?? ProjectOutContextModeEnum.project,
        storageMode: ProjectOutStorageModeEnum.fromJson(json[r'storage_mode']),
        organizationId: mapValueOfType<String>(json, r'organization_id'),
        id: mapValueOfType<String>(json, r'id')!,
        archived: mapValueOfType<bool>(json, r'archived')!,
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
      );
    }
    return null;
  }

  static List<ProjectOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ProjectOut> mapFromJson(dynamic json) {
    final map = <String, ProjectOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ProjectOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ProjectOut-objects as value to a dart map
  static Map<String, List<ProjectOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ProjectOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ProjectOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'id',
    'archived',
    'created_at',
    'updated_at',
  };
}


enum ProjectOutContextModeEnum {
  chat._(r'chat'),
  project._(r'project'),
  selected._(r'selected'),
  ;

  /// Instantiate a new enum with the provided value.
  const ProjectOutContextModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ProjectOutContextModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ProjectOutContextModeEnum? fromJson(dynamic value) => ProjectOutContextModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ProjectOutContextModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ProjectOutContextModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectOutContextModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectOutContextModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectOutContextModeEnum] to String,
/// and [decode] dynamic data back to [ProjectOutContextModeEnum].
class ProjectOutContextModeEnumTypeTransformer {
  factory ProjectOutContextModeEnumTypeTransformer() => _instance ??= const ProjectOutContextModeEnumTypeTransformer._();

  const ProjectOutContextModeEnumTypeTransformer._();

  String encode(ProjectOutContextModeEnum data) => data._value;

  /// Returns the instance of [ProjectOutContextModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectOutContextModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ProjectOutContextModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return ProjectOutContextModeEnum.chat;
        case r'project': return ProjectOutContextModeEnum.project;
        case r'selected': return ProjectOutContextModeEnum.selected;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ProjectOutContextModeEnumTypeTransformer? _instance;
}



enum ProjectOutStorageModeEnum {
  local._(r'local'),
  cloud._(r'cloud'),
  ;

  /// Instantiate a new enum with the provided value.
  const ProjectOutStorageModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ProjectOutStorageModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ProjectOutStorageModeEnum? fromJson(dynamic value) => ProjectOutStorageModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ProjectOutStorageModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ProjectOutStorageModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectOutStorageModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectOutStorageModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectOutStorageModeEnum] to String,
/// and [decode] dynamic data back to [ProjectOutStorageModeEnum].
class ProjectOutStorageModeEnumTypeTransformer {
  factory ProjectOutStorageModeEnumTypeTransformer() => _instance ??= const ProjectOutStorageModeEnumTypeTransformer._();

  const ProjectOutStorageModeEnumTypeTransformer._();

  String encode(ProjectOutStorageModeEnum data) => data._value;

  /// Returns the instance of [ProjectOutStorageModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectOutStorageModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ProjectOutStorageModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'local': return ProjectOutStorageModeEnum.local;
        case r'cloud': return ProjectOutStorageModeEnum.cloud;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ProjectOutStorageModeEnumTypeTransformer? _instance;
}


