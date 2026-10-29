//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ProjectPatch {
  /// Returns a new [ProjectPatch] instance.
  ProjectPatch({
    this.name,
    this.instructions,
    this.contextMode,
    this.archived,
    this.storageMode,
  });

  String? name;

  String? instructions;

  ProjectPatchContextModeEnum? contextMode;

  bool? archived;

  ProjectPatchStorageModeEnum? storageMode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ProjectPatch &&
    other.name == name &&
    other.instructions == instructions &&
    other.contextMode == contextMode &&
    other.archived == archived &&
    other.storageMode == storageMode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode) +
    (instructions == null ? 0 : instructions!.hashCode) +
    (contextMode == null ? 0 : contextMode!.hashCode) +
    (archived == null ? 0 : archived!.hashCode) +
    (storageMode == null ? 0 : storageMode!.hashCode);

  @override
  String toString() => 'ProjectPatch[name=$name, instructions=$instructions, contextMode=$contextMode, archived=$archived, storageMode=$storageMode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
      json[r'name'] = null;
    }
    if (this.instructions != null) {
      json[r'instructions'] = this.instructions;
    } else {
      json[r'instructions'] = null;
    }
    if (this.contextMode != null) {
      json[r'context_mode'] = this.contextMode;
    } else {
      json[r'context_mode'] = null;
    }
    if (this.archived != null) {
      json[r'archived'] = this.archived;
    } else {
      json[r'archived'] = null;
    }
    if (this.storageMode != null) {
      json[r'storage_mode'] = this.storageMode;
    } else {
      json[r'storage_mode'] = null;
    }
    return json;
  }

  /// Returns a new [ProjectPatch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ProjectPatch? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return ProjectPatch(
        name: mapValueOfType<String>(json, r'name'),
        instructions: mapValueOfType<String>(json, r'instructions'),
        contextMode: ProjectPatchContextModeEnum.fromJson(json[r'context_mode']),
        archived: mapValueOfType<bool>(json, r'archived'),
        storageMode: ProjectPatchStorageModeEnum.fromJson(json[r'storage_mode']),
      );
    }
    return null;
  }

  static List<ProjectPatch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectPatch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectPatch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ProjectPatch> mapFromJson(dynamic json) {
    final map = <String, ProjectPatch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ProjectPatch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ProjectPatch-objects as value to a dart map
  static Map<String, List<ProjectPatch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ProjectPatch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ProjectPatch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


enum ProjectPatchContextModeEnum {
  chat._(r'chat'),
  project._(r'project'),
  selected._(r'selected'),
  ;

  /// Instantiate a new enum with the provided value.
  const ProjectPatchContextModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ProjectPatchContextModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ProjectPatchContextModeEnum? fromJson(dynamic value) => ProjectPatchContextModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ProjectPatchContextModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ProjectPatchContextModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectPatchContextModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectPatchContextModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectPatchContextModeEnum] to String,
/// and [decode] dynamic data back to [ProjectPatchContextModeEnum].
class ProjectPatchContextModeEnumTypeTransformer {
  factory ProjectPatchContextModeEnumTypeTransformer() => _instance ??= const ProjectPatchContextModeEnumTypeTransformer._();

  const ProjectPatchContextModeEnumTypeTransformer._();

  String encode(ProjectPatchContextModeEnum data) => data._value;

  /// Returns the instance of [ProjectPatchContextModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectPatchContextModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ProjectPatchContextModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'chat': return ProjectPatchContextModeEnum.chat;
        case r'project': return ProjectPatchContextModeEnum.project;
        case r'selected': return ProjectPatchContextModeEnum.selected;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ProjectPatchContextModeEnumTypeTransformer? _instance;
}



enum ProjectPatchStorageModeEnum {
  local._(r'local'),
  cloud._(r'cloud'),
  ;

  /// Instantiate a new enum with the provided value.
  const ProjectPatchStorageModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ProjectPatchStorageModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ProjectPatchStorageModeEnum? fromJson(dynamic value) => ProjectPatchStorageModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ProjectPatchStorageModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ProjectPatchStorageModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProjectPatchStorageModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProjectPatchStorageModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProjectPatchStorageModeEnum] to String,
/// and [decode] dynamic data back to [ProjectPatchStorageModeEnum].
class ProjectPatchStorageModeEnumTypeTransformer {
  factory ProjectPatchStorageModeEnumTypeTransformer() => _instance ??= const ProjectPatchStorageModeEnumTypeTransformer._();

  const ProjectPatchStorageModeEnumTypeTransformer._();

  String encode(ProjectPatchStorageModeEnum data) => data._value;

  /// Returns the instance of [ProjectPatchStorageModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProjectPatchStorageModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ProjectPatchStorageModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'local': return ProjectPatchStorageModeEnum.local;
        case r'cloud': return ProjectPatchStorageModeEnum.cloud;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ProjectPatchStorageModeEnumTypeTransformer? _instance;
}


