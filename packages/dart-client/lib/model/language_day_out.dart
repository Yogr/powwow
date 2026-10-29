//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageDayOut {
  /// Returns a new [LanguageDayOut] instance.
  LanguageDayOut({
    required this.id,
    required this.profileId,
    required this.date,
    required this.dayNumber,
    required this.chatId,
  });

  String id;

  String profileId;

  String date;

  int dayNumber;

  String chatId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageDayOut &&
    other.id == id &&
    other.profileId == profileId &&
    other.date == date &&
    other.dayNumber == dayNumber &&
    other.chatId == chatId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (profileId.hashCode) +
    (date.hashCode) +
    (dayNumber.hashCode) +
    (chatId.hashCode);

  @override
  String toString() => 'LanguageDayOut[id=$id, profileId=$profileId, date=$date, dayNumber=$dayNumber, chatId=$chatId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'profile_id'] = this.profileId;
      json[r'date'] = this.date;
      json[r'day_number'] = this.dayNumber;
      json[r'chat_id'] = this.chatId;
    return json;
  }

  /// Returns a new [LanguageDayOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageDayOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "LanguageDayOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "LanguageDayOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'profile_id'), 'Required key "LanguageDayOut[profile_id]" is missing from JSON.');
        assert(json[r'profile_id'] != null, 'Required key "LanguageDayOut[profile_id]" has a null value in JSON.');
        assert(json.containsKey(r'date'), 'Required key "LanguageDayOut[date]" is missing from JSON.');
        assert(json[r'date'] != null, 'Required key "LanguageDayOut[date]" has a null value in JSON.');
        assert(json.containsKey(r'day_number'), 'Required key "LanguageDayOut[day_number]" is missing from JSON.');
        assert(json[r'day_number'] != null, 'Required key "LanguageDayOut[day_number]" has a null value in JSON.');
        assert(json.containsKey(r'chat_id'), 'Required key "LanguageDayOut[chat_id]" is missing from JSON.');
        assert(json[r'chat_id'] != null, 'Required key "LanguageDayOut[chat_id]" has a null value in JSON.');
        return true;
      }());

      return LanguageDayOut(
        id: mapValueOfType<String>(json, r'id')!,
        profileId: mapValueOfType<String>(json, r'profile_id')!,
        date: mapValueOfType<String>(json, r'date')!,
        dayNumber: mapValueOfType<int>(json, r'day_number')!,
        chatId: mapValueOfType<String>(json, r'chat_id')!,
      );
    }
    return null;
  }

  static List<LanguageDayOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageDayOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageDayOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageDayOut> mapFromJson(dynamic json) {
    final map = <String, LanguageDayOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageDayOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageDayOut-objects as value to a dart map
  static Map<String, List<LanguageDayOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageDayOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageDayOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'profile_id',
    'date',
    'day_number',
    'chat_id',
  };
}

