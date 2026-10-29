//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguagePhraseOut {
  /// Returns a new [LanguagePhraseOut] instance.
  LanguagePhraseOut({
    required this.text,
    required this.translation,
    this.note = '',
    this.sourceTurnId,
    required this.id,
    required this.profileId,
    required this.dueAt,
    required this.reviewCount,
    required this.intervalDays,
    required this.lastReviewedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  String text;

  String translation;

  String note;

  String? sourceTurnId;

  String id;

  String profileId;

  DateTime dueAt;

  int reviewCount;

  int intervalDays;

  DateTime? lastReviewedAt;

  DateTime createdAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguagePhraseOut &&
    other.text == text &&
    other.translation == translation &&
    other.note == note &&
    other.sourceTurnId == sourceTurnId &&
    other.id == id &&
    other.profileId == profileId &&
    other.dueAt == dueAt &&
    other.reviewCount == reviewCount &&
    other.intervalDays == intervalDays &&
    other.lastReviewedAt == lastReviewedAt &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (text.hashCode) +
    (translation.hashCode) +
    (note.hashCode) +
    (sourceTurnId == null ? 0 : sourceTurnId!.hashCode) +
    (id.hashCode) +
    (profileId.hashCode) +
    (dueAt.hashCode) +
    (reviewCount.hashCode) +
    (intervalDays.hashCode) +
    (lastReviewedAt == null ? 0 : lastReviewedAt!.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'LanguagePhraseOut[text=$text, translation=$translation, note=$note, sourceTurnId=$sourceTurnId, id=$id, profileId=$profileId, dueAt=$dueAt, reviewCount=$reviewCount, intervalDays=$intervalDays, lastReviewedAt=$lastReviewedAt, createdAt=$createdAt, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'text'] = this.text;
      json[r'translation'] = this.translation;
      json[r'note'] = this.note;
    if (this.sourceTurnId != null) {
      json[r'source_turn_id'] = this.sourceTurnId;
    } else {
      json[r'source_turn_id'] = null;
    }
      json[r'id'] = this.id;
      json[r'profile_id'] = this.profileId;
      json[r'due_at'] = this.dueAt.toUtc().toIso8601String();
      json[r'review_count'] = this.reviewCount;
      json[r'interval_days'] = this.intervalDays;
    if (this.lastReviewedAt != null) {
      json[r'last_reviewed_at'] = this.lastReviewedAt!.toUtc().toIso8601String();
    } else {
      json[r'last_reviewed_at'] = null;
    }
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'updated_at'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [LanguagePhraseOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguagePhraseOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'text'), 'Required key "LanguagePhraseOut[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguagePhraseOut[text]" has a null value in JSON.');
        assert(json.containsKey(r'translation'), 'Required key "LanguagePhraseOut[translation]" is missing from JSON.');
        assert(json[r'translation'] != null, 'Required key "LanguagePhraseOut[translation]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "LanguagePhraseOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "LanguagePhraseOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'profile_id'), 'Required key "LanguagePhraseOut[profile_id]" is missing from JSON.');
        assert(json[r'profile_id'] != null, 'Required key "LanguagePhraseOut[profile_id]" has a null value in JSON.');
        assert(json.containsKey(r'due_at'), 'Required key "LanguagePhraseOut[due_at]" is missing from JSON.');
        assert(json[r'due_at'] != null, 'Required key "LanguagePhraseOut[due_at]" has a null value in JSON.');
        assert(json.containsKey(r'review_count'), 'Required key "LanguagePhraseOut[review_count]" is missing from JSON.');
        assert(json[r'review_count'] != null, 'Required key "LanguagePhraseOut[review_count]" has a null value in JSON.');
        assert(json.containsKey(r'interval_days'), 'Required key "LanguagePhraseOut[interval_days]" is missing from JSON.');
        assert(json[r'interval_days'] != null, 'Required key "LanguagePhraseOut[interval_days]" has a null value in JSON.');
        assert(json.containsKey(r'last_reviewed_at'), 'Required key "LanguagePhraseOut[last_reviewed_at]" is missing from JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "LanguagePhraseOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "LanguagePhraseOut[created_at]" has a null value in JSON.');
        assert(json.containsKey(r'updated_at'), 'Required key "LanguagePhraseOut[updated_at]" is missing from JSON.');
        assert(json[r'updated_at'] != null, 'Required key "LanguagePhraseOut[updated_at]" has a null value in JSON.');
        return true;
      }());

      return LanguagePhraseOut(
        text: mapValueOfType<String>(json, r'text')!,
        translation: mapValueOfType<String>(json, r'translation')!,
        note: mapValueOfType<String>(json, r'note') ?? '',
        sourceTurnId: mapValueOfType<String>(json, r'source_turn_id'),
        id: mapValueOfType<String>(json, r'id')!,
        profileId: mapValueOfType<String>(json, r'profile_id')!,
        dueAt: mapDateTime(json, r'due_at', r'')!,
        reviewCount: mapValueOfType<int>(json, r'review_count')!,
        intervalDays: mapValueOfType<int>(json, r'interval_days')!,
        lastReviewedAt: mapDateTime(json, r'last_reviewed_at', r''),
        createdAt: mapDateTime(json, r'created_at', r'')!,
        updatedAt: mapDateTime(json, r'updated_at', r'')!,
      );
    }
    return null;
  }

  static List<LanguagePhraseOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguagePhraseOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguagePhraseOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguagePhraseOut> mapFromJson(dynamic json) {
    final map = <String, LanguagePhraseOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguagePhraseOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguagePhraseOut-objects as value to a dart map
  static Map<String, List<LanguagePhraseOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguagePhraseOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguagePhraseOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'text',
    'translation',
    'id',
    'profile_id',
    'due_at',
    'review_count',
    'interval_days',
    'last_reviewed_at',
    'created_at',
    'updated_at',
  };
}

