//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OrganizationCreate {
  /// Returns a new [OrganizationCreate] instance.
  OrganizationCreate({
    required this.name,
    this.displayName = '',
  });

  String name;

  String displayName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OrganizationCreate &&
    other.name == name &&
    other.displayName == displayName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (displayName.hashCode);

  @override
  String toString() => 'OrganizationCreate[name=$name, displayName=$displayName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
      json[r'display_name'] = this.displayName;
    return json;
  }

  /// Returns a new [OrganizationCreate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OrganizationCreate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "OrganizationCreate[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "OrganizationCreate[name]" has a null value in JSON.');
        return true;
      }());

      return OrganizationCreate(
        name: mapValueOfType<String>(json, r'name')!,
        displayName: mapValueOfType<String>(json, r'display_name') ?? '',
      );
    }
    return null;
  }

  static List<OrganizationCreate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OrganizationCreate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OrganizationCreate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OrganizationCreate> mapFromJson(dynamic json) {
    final map = <String, OrganizationCreate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OrganizationCreate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OrganizationCreate-objects as value to a dart map
  static Map<String, List<OrganizationCreate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OrganizationCreate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OrganizationCreate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}

