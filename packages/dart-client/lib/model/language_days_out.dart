//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageDaysOut {
  /// Returns a new [LanguageDaysOut] instance.
  LanguageDaysOut({
    required this.profile,
    this.days = const [],
    required this.currentDayId,
  });

  LanguageProfileOut profile;

  List<LanguageDayOut> days;

  String? currentDayId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageDaysOut &&
    other.profile == profile &&
    _deepEquality.equals(other.days, days) &&
    other.currentDayId == currentDayId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (profile.hashCode) +
    (days.hashCode) +
    (currentDayId == null ? 0 : currentDayId!.hashCode);

  @override
  String toString() => 'LanguageDaysOut[profile=$profile, days=$days, currentDayId=$currentDayId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'profile'] = this.profile;
      json[r'days'] = this.days;
    if (this.currentDayId != null) {
      json[r'current_day_id'] = this.currentDayId;
    } else {
      json[r'current_day_id'] = null;
    }
    return json;
  }

  /// Returns a new [LanguageDaysOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageDaysOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'profile'), 'Required key "LanguageDaysOut[profile]" is missing from JSON.');
        assert(json[r'profile'] != null, 'Required key "LanguageDaysOut[profile]" has a null value in JSON.');
        assert(json.containsKey(r'days'), 'Required key "LanguageDaysOut[days]" is missing from JSON.');
        assert(json[r'days'] != null, 'Required key "LanguageDaysOut[days]" has a null value in JSON.');
        assert(json.containsKey(r'current_day_id'), 'Required key "LanguageDaysOut[current_day_id]" is missing from JSON.');
        return true;
      }());

      return LanguageDaysOut(
        profile: LanguageProfileOut.fromJson(json[r'profile'])!,
        days: LanguageDayOut.listFromJson(json[r'days']),
        currentDayId: mapValueOfType<String>(json, r'current_day_id'),
      );
    }
    return null;
  }

  static List<LanguageDaysOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageDaysOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageDaysOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageDaysOut> mapFromJson(dynamic json) {
    final map = <String, LanguageDaysOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageDaysOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageDaysOut-objects as value to a dart map
  static Map<String, List<LanguageDaysOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageDaysOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageDaysOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'profile',
    'days',
    'current_day_id',
  };
}

