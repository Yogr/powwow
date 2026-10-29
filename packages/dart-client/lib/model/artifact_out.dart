//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ArtifactOut {
  /// Returns a new [ArtifactOut] instance.
  ArtifactOut({
    required this.id,
    required this.projectId,
    required this.chatId,
    required this.runId,
    required this.name,
    required this.kind,
    required this.mimeType,
    required this.sizeBytes,
    required this.sha256,
    required this.url,
    required this.downloadUrl,
    this.previewUrl,
    this.metadata = const {},
    this.lineageIds = const [],
    required this.createdAt,
    this.storageMode = ArtifactOutStorageModeEnum.legacy,
    this.expiresAt,
    this.localSavedAt,
    this.available = true,
  });

  String id;

  String? projectId;

  String? chatId;

  String? runId;

  String name;

  String kind;

  String mimeType;

  int sizeBytes;

  String sha256;

  String url;

  String downloadUrl;

  String? previewUrl;

  Map<String, dynamic> metadata;

  List<String> lineageIds;

  DateTime createdAt;

  ArtifactOutStorageModeEnum storageMode;

  DateTime? expiresAt;

  DateTime? localSavedAt;

  bool available;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ArtifactOut &&
    other.id == id &&
    other.projectId == projectId &&
    other.chatId == chatId &&
    other.runId == runId &&
    other.name == name &&
    other.kind == kind &&
    other.mimeType == mimeType &&
    other.sizeBytes == sizeBytes &&
    other.sha256 == sha256 &&
    other.url == url &&
    other.downloadUrl == downloadUrl &&
    other.previewUrl == previewUrl &&
    _deepEquality.equals(other.metadata, metadata) &&
    _deepEquality.equals(other.lineageIds, lineageIds) &&
    other.createdAt == createdAt &&
    other.storageMode == storageMode &&
    other.expiresAt == expiresAt &&
    other.localSavedAt == localSavedAt &&
    other.available == available;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (projectId == null ? 0 : projectId!.hashCode) +
    (chatId == null ? 0 : chatId!.hashCode) +
    (runId == null ? 0 : runId!.hashCode) +
    (name.hashCode) +
    (kind.hashCode) +
    (mimeType.hashCode) +
    (sizeBytes.hashCode) +
    (sha256.hashCode) +
    (url.hashCode) +
    (downloadUrl.hashCode) +
    (previewUrl == null ? 0 : previewUrl!.hashCode) +
    (metadata.hashCode) +
    (lineageIds.hashCode) +
    (createdAt.hashCode) +
    (storageMode.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (localSavedAt == null ? 0 : localSavedAt!.hashCode) +
    (available.hashCode);

  @override
  String toString() => 'ArtifactOut[id=$id, projectId=$projectId, chatId=$chatId, runId=$runId, name=$name, kind=$kind, mimeType=$mimeType, sizeBytes=$sizeBytes, sha256=$sha256, url=$url, downloadUrl=$downloadUrl, previewUrl=$previewUrl, metadata=$metadata, lineageIds=$lineageIds, createdAt=$createdAt, storageMode=$storageMode, expiresAt=$expiresAt, localSavedAt=$localSavedAt, available=$available]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
    if (this.projectId != null) {
      json[r'project_id'] = this.projectId;
    } else {
      json[r'project_id'] = null;
    }
    if (this.chatId != null) {
      json[r'chat_id'] = this.chatId;
    } else {
      json[r'chat_id'] = null;
    }
    if (this.runId != null) {
      json[r'run_id'] = this.runId;
    } else {
      json[r'run_id'] = null;
    }
      json[r'name'] = this.name;
      json[r'kind'] = this.kind;
      json[r'mime_type'] = this.mimeType;
      json[r'size_bytes'] = this.sizeBytes;
      json[r'sha256'] = this.sha256;
      json[r'url'] = this.url;
      json[r'download_url'] = this.downloadUrl;
    if (this.previewUrl != null) {
      json[r'preview_url'] = this.previewUrl;
    } else {
      json[r'preview_url'] = null;
    }
      json[r'metadata'] = this.metadata;
      json[r'lineage_ids'] = this.lineageIds;
      json[r'created_at'] = this.createdAt.toUtc().toIso8601String();
      json[r'storage_mode'] = this.storageMode;
    if (this.expiresAt != null) {
      json[r'expires_at'] = this.expiresAt!.toUtc().toIso8601String();
    } else {
      json[r'expires_at'] = null;
    }
    if (this.localSavedAt != null) {
      json[r'local_saved_at'] = this.localSavedAt!.toUtc().toIso8601String();
    } else {
      json[r'local_saved_at'] = null;
    }
      json[r'available'] = this.available;
    return json;
  }

  /// Returns a new [ArtifactOut] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ArtifactOut? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "ArtifactOut[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "ArtifactOut[id]" has a null value in JSON.');
        assert(json.containsKey(r'project_id'), 'Required key "ArtifactOut[project_id]" is missing from JSON.');
        assert(json.containsKey(r'chat_id'), 'Required key "ArtifactOut[chat_id]" is missing from JSON.');
        assert(json.containsKey(r'run_id'), 'Required key "ArtifactOut[run_id]" is missing from JSON.');
        assert(json.containsKey(r'name'), 'Required key "ArtifactOut[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "ArtifactOut[name]" has a null value in JSON.');
        assert(json.containsKey(r'kind'), 'Required key "ArtifactOut[kind]" is missing from JSON.');
        assert(json[r'kind'] != null, 'Required key "ArtifactOut[kind]" has a null value in JSON.');
        assert(json.containsKey(r'mime_type'), 'Required key "ArtifactOut[mime_type]" is missing from JSON.');
        assert(json[r'mime_type'] != null, 'Required key "ArtifactOut[mime_type]" has a null value in JSON.');
        assert(json.containsKey(r'size_bytes'), 'Required key "ArtifactOut[size_bytes]" is missing from JSON.');
        assert(json[r'size_bytes'] != null, 'Required key "ArtifactOut[size_bytes]" has a null value in JSON.');
        assert(json.containsKey(r'sha256'), 'Required key "ArtifactOut[sha256]" is missing from JSON.');
        assert(json[r'sha256'] != null, 'Required key "ArtifactOut[sha256]" has a null value in JSON.');
        assert(json.containsKey(r'url'), 'Required key "ArtifactOut[url]" is missing from JSON.');
        assert(json[r'url'] != null, 'Required key "ArtifactOut[url]" has a null value in JSON.');
        assert(json.containsKey(r'download_url'), 'Required key "ArtifactOut[download_url]" is missing from JSON.');
        assert(json[r'download_url'] != null, 'Required key "ArtifactOut[download_url]" has a null value in JSON.');
        assert(json.containsKey(r'metadata'), 'Required key "ArtifactOut[metadata]" is missing from JSON.');
        assert(json[r'metadata'] != null, 'Required key "ArtifactOut[metadata]" has a null value in JSON.');
        assert(json.containsKey(r'lineage_ids'), 'Required key "ArtifactOut[lineage_ids]" is missing from JSON.');
        assert(json[r'lineage_ids'] != null, 'Required key "ArtifactOut[lineage_ids]" has a null value in JSON.');
        assert(json.containsKey(r'created_at'), 'Required key "ArtifactOut[created_at]" is missing from JSON.');
        assert(json[r'created_at'] != null, 'Required key "ArtifactOut[created_at]" has a null value in JSON.');
        return true;
      }());

      return ArtifactOut(
        id: mapValueOfType<String>(json, r'id')!,
        projectId: mapValueOfType<String>(json, r'project_id'),
        chatId: mapValueOfType<String>(json, r'chat_id'),
        runId: mapValueOfType<String>(json, r'run_id'),
        name: mapValueOfType<String>(json, r'name')!,
        kind: mapValueOfType<String>(json, r'kind')!,
        mimeType: mapValueOfType<String>(json, r'mime_type')!,
        sizeBytes: mapValueOfType<int>(json, r'size_bytes')!,
        sha256: mapValueOfType<String>(json, r'sha256')!,
        url: mapValueOfType<String>(json, r'url')!,
        downloadUrl: mapValueOfType<String>(json, r'download_url')!,
        previewUrl: mapValueOfType<String>(json, r'preview_url'),
        metadata: mapCastOfType<String, Object>(json, r'metadata')!,
        lineageIds: json[r'lineage_ids'] is Iterable
            ? (json[r'lineage_ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        createdAt: mapDateTime(json, r'created_at', r'')!,
        storageMode: ArtifactOutStorageModeEnum.fromJson(json[r'storage_mode']) ?? ArtifactOutStorageModeEnum.legacy,
        expiresAt: mapDateTime(json, r'expires_at', r''),
        localSavedAt: mapDateTime(json, r'local_saved_at', r''),
        available: mapValueOfType<bool>(json, r'available') ?? true,
      );
    }
    return null;
  }

  static List<ArtifactOut> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ArtifactOut>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ArtifactOut.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ArtifactOut> mapFromJson(dynamic json) {
    final map = <String, ArtifactOut>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ArtifactOut.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ArtifactOut-objects as value to a dart map
  static Map<String, List<ArtifactOut>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ArtifactOut>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ArtifactOut.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'project_id',
    'chat_id',
    'run_id',
    'name',
    'kind',
    'mime_type',
    'size_bytes',
    'sha256',
    'url',
    'download_url',
    'metadata',
    'lineage_ids',
    'created_at',
  };
}


enum ArtifactOutStorageModeEnum {
  legacy._(r'legacy'),
  local._(r'local'),
  cloud._(r'cloud'),
  ;

  /// Instantiate a new enum with the provided value.
  const ArtifactOutStorageModeEnum._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ArtifactOutStorageModeEnum] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ArtifactOutStorageModeEnum? fromJson(dynamic value) => ArtifactOutStorageModeEnumTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ArtifactOutStorageModeEnum]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ArtifactOutStorageModeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ArtifactOutStorageModeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ArtifactOutStorageModeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ArtifactOutStorageModeEnum] to String,
/// and [decode] dynamic data back to [ArtifactOutStorageModeEnum].
class ArtifactOutStorageModeEnumTypeTransformer {
  factory ArtifactOutStorageModeEnumTypeTransformer() => _instance ??= const ArtifactOutStorageModeEnumTypeTransformer._();

  const ArtifactOutStorageModeEnumTypeTransformer._();

  String encode(ArtifactOutStorageModeEnum data) => data._value;

  /// Returns the instance of [ArtifactOutStorageModeEnum] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ArtifactOutStorageModeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data is ArtifactOutStorageModeEnum) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'legacy': return ArtifactOutStorageModeEnum.legacy;
        case r'local': return ArtifactOutStorageModeEnum.local;
        case r'cloud': return ArtifactOutStorageModeEnum.cloud;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ArtifactOutStorageModeEnumTypeTransformer? _instance;
}


