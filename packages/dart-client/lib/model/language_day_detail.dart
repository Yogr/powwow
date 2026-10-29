//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageDayDetail {
  /// Returns a new [LanguageDayDetail] instance.
  LanguageDayDetail({
    required this.day,
    this.turns = const [],
    required this.activeRun,
    required this.lastRun,
  });

  LanguageDayOut day;

  List<LanguageTurnOut> turns;

  RunOut? activeRun;

  RunOut? lastRun;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageDayDetail &&
    other.day == day &&
    _deepEquality.equals(other.turns, turns) &&
    other.activeRun == activeRun &&
    other.lastRun == lastRun;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (day.hashCode) +
    (turns.hashCode) +
    (activeRun == null ? 0 : activeRun!.hashCode) +
    (lastRun == null ? 0 : lastRun!.hashCode);

  @override
  String toString() => 'LanguageDayDetail[day=$day, turns=$turns, activeRun=$activeRun, lastRun=$lastRun]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'day'] = this.day;
      json[r'turns'] = this.turns;
    if (this.activeRun != null) {
      json[r'active_run'] = this.activeRun;
    } else {
      json[r'active_run'] = null;
    }
    if (this.lastRun != null) {
      json[r'last_run'] = this.lastRun;
    } else {
      json[r'last_run'] = null;
    }
    return json;
  }

  /// Returns a new [LanguageDayDetail] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageDayDetail? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'day'), 'Required key "LanguageDayDetail[day]" is missing from JSON.');
        assert(json[r'day'] != null, 'Required key "LanguageDayDetail[day]" has a null value in JSON.');
        assert(json.containsKey(r'turns'), 'Required key "LanguageDayDetail[turns]" is missing from JSON.');
        assert(json[r'turns'] != null, 'Required key "LanguageDayDetail[turns]" has a null value in JSON.');
        assert(json.containsKey(r'active_run'), 'Required key "LanguageDayDetail[active_run]" is missing from JSON.');
        assert(json.containsKey(r'last_run'), 'Required key "LanguageDayDetail[last_run]" is missing from JSON.');
        return true;
      }());

      return LanguageDayDetail(
        day: LanguageDayOut.fromJson(json[r'day'])!,
        turns: LanguageTurnOut.listFromJson(json[r'turns']),
        activeRun: RunOut.fromJson(json[r'active_run']),
        lastRun: RunOut.fromJson(json[r'last_run']),
      );
    }
    return null;
  }

  static List<LanguageDayDetail> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageDayDetail>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageDayDetail.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageDayDetail> mapFromJson(dynamic json) {
    final map = <String, LanguageDayDetail>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageDayDetail.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageDayDetail-objects as value to a dart map
  static Map<String, List<LanguageDayDetail>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageDayDetail>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageDayDetail.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'day',
    'turns',
    'active_run',
    'last_run',
  };
}

