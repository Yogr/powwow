//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ProjectCreate {
  /// Returns a new [ProjectCreate] instance.
  ProjectCreate({
    required this.name,
    this.instructions = '',
    this.contextMode = ProjectCreateContextModeEnum.project,
    this.storageMode,
    this.organizationId,
  });

  String name;

  String instructions;

  ProjectCreateContextModeEnum contextMode;

  ProjectCreateStorageModeEnum? storageMode;

  String? organizationId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ProjectCreate &&
    other.name == name &&
    other.instructions == instructions &&
    other.contextMode == contextMode &&
    other.storageMode == storageMode &&
    other.organizationId == organizationId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (instructions.hashCode) +
    (contextMode.hashCode) +
    (storageMode == null ? 0 : storageMode!.hashCode) +
    (organizationId == null ? 0 : organizationId!.hashCode);

  @override
  String toString() => 'ProjectCreate[name=$name, instructions=$instructions, contextMode=$contextMode, storageMode=$storageMode, organizationId=$organizationId]';

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
    return json;
  }

  /// Returns a new [ProjectCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ProjectCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "ProjectCreate[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "ProjectCreate[name]" has a null value in JSON.');
        return true;
      }());

      return ProjectCreate(
        name: mapValueOfType<String>(json, r'name')!,
        instructions: mapValueOfType<String>(json, r'instructions') ?? '',
        contextMode: ProjectCreateContextModeEnum.fromJson(json[r'context_mode']) ?? ProjectCreateContextModeEnum.project,
        storageMode: ProjectCreateStorageModeEnum.fromJson(json[r'storage_mode']),
        organizationId: mapValueOfType<String>(json, r'organization_id'),
      );
    }
    return null;
  }

  static List<ProjectCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ProjectCreate> mapFromJson(dynamic json) {
    final map = <String, ProjectCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ProjectCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ProjectCreate-objects as value to a dart map
  static Map<String, List<ProjectCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ProjectCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ProjectCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}


enum ProjectCreateContextModeEnum {
  chat._(r'chat'),
  project._(r'project'),
  selected._(r'selected'),
  ;

  /// Instantiate a new enum with the provided value.
  const ProjectCreateContextModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ProjectCreateContextModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ProjectCreateContextModeEnum? fromJson(dynamic value) => ProjectCreateContextModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ProjectCreateContextModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ProjectCreateContextModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectCreateContextModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectCreateContextModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectCreateContextModeEnum] to String,
/// and [decode] dynamic data back to [ProjectCreateContextModeEnum].
class ProjectCreateContextModeEnumTypeTransformer {
  factory ProjectCreateContextModeEnumTypeTransformer() => _instance ??= const ProjectCreateContextModeEnumTypeTransformer._();

  const ProjectCreateContextModeEnumTypeTransformer._();

  String encode(ProjectCreateContextModeEnum data) => data._value;

  /// Returns the instance of [ProjectCreateContextModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectCreateContextModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ProjectCreateContextModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return ProjectCreateContextModeEnum.chat;
        case r'project': return ProjectCreateContextModeEnum.project;
        case r'selected': return ProjectCreateContextModeEnum.selected;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ProjectCreateContextModeEnumTypeTransformer? _instance;
}



enum ProjectCreateStorageModeEnum {
  local._(r'local'),
  cloud._(r'cloud'),
  ;

  /// Instantiate a new enum with the provided value.
  const ProjectCreateStorageModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ProjectCreateStorageModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ProjectCreateStorageModeEnum? fromJson(dynamic value) => ProjectCreateStorageModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ProjectCreateStorageModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ProjectCreateStorageModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectCreateStorageModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectCreateStorageModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectCreateStorageModeEnum] to String,
/// and [decode] dynamic data back to [ProjectCreateStorageModeEnum].
class ProjectCreateStorageModeEnumTypeTransformer {
  factory ProjectCreateStorageModeEnumTypeTransformer() => _instance ??= const ProjectCreateStorageModeEnumTypeTransformer._();

  const ProjectCreateStorageModeEnumTypeTransformer._();

  String encode(ProjectCreateStorageModeEnum data) => data._value;

  /// Returns the instance of [ProjectCreateStorageModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectCreateStorageModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ProjectCreateStorageModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'local': return ProjectCreateStorageModeEnum.local;
        case r'cloud': return ProjectCreateStorageModeEnum.cloud;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ProjectCreateStorageModeEnumTypeTransformer? _instance;
}


