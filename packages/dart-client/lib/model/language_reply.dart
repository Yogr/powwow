//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LanguageReply {
  /// Returns a new [LanguageReply] instance.
  LanguageReply({
    required this.text,
    required this.translation,
    this.explanation,
    this.correction,
    this.showTranslationTip = false,
    this.suggestedReplies = const [],
    this.vocabulary = const [],
    this.topic,
    this.segments = const [],
  });

  String text;

  String translation;

  String? explanation;

  LanguageCorrection? correction;

  bool showTranslationTip;

  List<LanguageSuggestion> suggestedReplies;

  List<LanguageVocabulary> vocabulary;

  String? topic;

  List<LanguageSegment> segments;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LanguageReply &&
    other.text == text &&
    other.translation == translation &&
    other.explanation == explanation &&
    other.correction == correction &&
    other.showTranslationTip == showTranslationTip &&
    _deepEquality.equals(other.suggestedReplies, suggestedReplies) &&
    _deepEquality.equals(other.vocabulary, vocabulary) &&
    other.topic == topic &&
    _deepEquality.equals(other.segments, segments);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (text.hashCode) +
    (translation.hashCode) +
    (explanation == null ? 0 : explanation!.hashCode) +
    (correction == null ? 0 : correction!.hashCode) +
    (showTranslationTip.hashCode) +
    (suggestedReplies.hashCode) +
    (vocabulary.hashCode) +
    (topic == null ? 0 : topic!.hashCode) +
    (segments.hashCode);

  @override
  String toString() => 'LanguageReply[text=$text, translation=$translation, explanation=$explanation, correction=$correction, showTranslationTip=$showTranslationTip, suggestedReplies=$suggestedReplies, vocabulary=$vocabulary, topic=$topic, segments=$segments]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'text'] = this.text;
      json[r'translation'] = this.translation;
    if (this.explanation != null) {
      json[r'explanation'] = this.explanation;
    } else {
      json[r'explanation'] = null;
    }
    if (this.correction != null) {
      json[r'correction'] = this.correction;
    } else {
      json[r'correction'] = null;
    }
      json[r'show_translation_tip'] = this.showTranslationTip;
      json[r'suggested_replies'] = this.suggestedReplies;
      json[r'vocabulary'] = this.vocabulary;
    if (this.topic != null) {
      json[r'topic'] = this.topic;
    } else {
      json[r'topic'] = null;
    }
      json[r'segments'] = this.segments;
    return json;
  }

  /// Returns a new [LanguageReply] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LanguageReply? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'text'), 'Required key "LanguageReply[text]" is missing from JSON.');
        assert(json[r'text'] != null, 'Required key "LanguageReply[text]" has a null value in JSON.');
        assert(json.containsKey(r'translation'), 'Required key "LanguageReply[translation]" is missing from JSON.');
        assert(json[r'translation'] != null, 'Required key "LanguageReply[translation]" has a null value in JSON.');
        assert(json.containsKey(r'segments'), 'Required key "LanguageReply[segments]" is missing from JSON.');
        assert(json[r'segments'] != null, 'Required key "LanguageReply[segments]" has a null value in JSON.');
        return true;
      }());

      return LanguageReply(
        text: mapValueOfType<String>(json, r'text')!,
        translation: mapValueOfType<String>(json, r'translation')!,
        explanation: mapValueOfType<String>(json, r'explanation'),
        correction: LanguageCorrection.fromJson(json[r'correction']),
        showTranslationTip: mapValueOfType<bool>(json, r'show_translation_tip') ?? false,
        suggestedReplies: LanguageSuggestion.listFromJson(json[r'suggested_replies']),
        vocabulary: LanguageVocabulary.listFromJson(json[r'vocabulary']),
        topic: mapValueOfType<String>(json, r'topic'),
        segments: LanguageSegment.listFromJson(json[r'segments']),
      );
    }
    return null;
  }

  static List<LanguageReply> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LanguageReply>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LanguageReply.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LanguageReply> mapFromJson(dynamic json) {
    final map = <String, LanguageReply>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LanguageReply.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LanguageReply-objects as value to a dart map
  static Map<String, List<LanguageReply>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LanguageReply>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LanguageReply.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'text',
    'translation',
    'segments',
  };
}

