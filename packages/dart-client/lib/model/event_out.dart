//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EventOut {
  /// Returns a new [EventOut] instance.
  EventOut({
    required this.runId,
    required this.sequence,
    required this.stageId,
    required this.type,
    required this.timestamp,
    this.payload = const {},
  });

  String runId;

  int sequence;

  String stageId;

  String type;

  DateTime timestamp;

  Map<String, dynamic> payload;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EventOut &&
    other.runId == runId &&
    other.sequence == sequence &&
    other.stageId == stageId &&
    other.type == type &&
    other.timestamp == timestamp &&
    _deepEquality.equals(other.payload, payload);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (runId.hashCode) +
    (sequence.hashCode) +
    (stageId.hashCode) +
    (type.hashCode) +
    (timestamp.hashCode) +
    (payload.hashCode);

  @override
  String toString() => 'EventOut[runId=$runId, sequence=$sequence, stageId=$stageId, type=$type, timestamp=$timestamp, payload=$payload]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'run_id'] = this.runId;
      json[r'sequence'] = this.sequence;
      json[r'stage_id'] = this.stageId;
      json[r'type'] = this.type;
      json[r'timestamp'] = this.timestamp.toUtc().toIso8601String();
      json[r'payload'] = this.payload;
    return json;
  }

  /// Returns a new [EventOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EventOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'run_id'), 'Required key "EventOut[run_id]" is missing from JSON.');
        assert(json[r'run_id'] != null, 'Required key "EventOut[run_id]" has a null value in JSON.');
        assert(json.containsKey(r'sequence'), 'Required key "EventOut[sequence]" is missing from JSON.');
        assert(json[r'sequence'] != null, 'Required key "EventOut[sequence]" has a null value in JSON.');
        assert(json.containsKey(r'stage_id'), 'Required key "EventOut[stage_id]" is missing from JSON.');
        assert(json[r'stage_id'] != null, 'Required key "EventOut[stage_id]" has a null value in JSON.');
        assert(json.containsKey(r'type'), 'Required key "EventOut[type]" is missing from JSON.');
        assert(json[r'type'] != null, 'Required key "EventOut[type]" has a null value in JSON.');
        assert(json.containsKey(r'timestamp'), 'Required key "EventOut[timestamp]" is missing from JSON.');
        assert(json[r'timestamp'] != null, 'Required key "EventOut[timestamp]" has a null value in JSON.');
        assert(json.containsKey(r'payload'), 'Required key "EventOut[payload]" is missing from JSON.');
        assert(json[r'payload'] != null, 'Required key "EventOut[payload]" has a null value in JSON.');
        return true;
      }());

      return EventOut(
        runId: mapValueOfType<String>(json, r'run_id')!,
        sequence: mapValueOfType<int>(json, r'sequence')!,
        stageId: mapValueOfType<String>(json, r'stage_id')!,
        type: mapValueOfType<String>(json, r'type')!,
        timestamp: mapDateTime(json, r'timestamp', r'')!,
        payload: mapCastOfType<String, Object>(json, r'payload')!,
      );
    }
    return null;
  }

  static List<EventOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EventOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EventOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EventOut> mapFromJson(dynamic json) {
    final map = <String, EventOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EventOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EventOut-objects as value to a dart map
  static Map<String, List<EventOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EventOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EventOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'run_id',
    'sequence',
    'stage_id',
    'type',
    'timestamp',
    'payload',
  };
}

