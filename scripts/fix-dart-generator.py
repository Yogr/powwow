"""Reproducible compatibility fixes for OpenAPI Generator 7.25 native Dart.

The pinned generator emits illegal enum constructor defaults, an invalid empty
class for FastAPI's string|integer error locations, and Map.listFromJson.
Apply after generation; all domain schemas still come from FastAPI OpenAPI.
"""
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'packages/dart-client/lib'
for path in root.rglob('*.dart'):
    source = path.read_text(encoding='utf-8')
    enum_values = {}
    for match in re.finditer(r'enum (\w+) \{(.*?);', source, re.S):
        for value in re.finditer(r"(\w+)\._\(r?'([^']*)'\)", match[2]):
            enum_values[(match[1], value[2])] = f'{match[1]}.{value[1]}'
    source = re.sub(r"const (\w+Enum)\._\('([^']*)'\)", lambda m: enum_values[(m[1], m[2])], source)
    source = source.replace("Map.listFromJson(json[r'context_snapshot'])", "(json[r'context_snapshot'] as List? ?? []).map((value) => Map<String, dynamic>.from(value as Map)).toList()")
    source = source.replace('Map<String, Object>', 'Map<String, dynamic>')
    path.write_text(source, encoding='utf-8')

(root / 'model/location_inner.dart').write_text('''// GENERATED union compatibility fix; see scripts/fix-dart-generator.py.
// @dart=2.18
part of openapi.api;
class LocationInner {
  LocationInner(this.value);
  final Object value;
  Object toJson() => value;
  static LocationInner? fromJson(dynamic value) => value is String || value is int ? LocationInner(value as Object) : null;
  static List<LocationInner> listFromJson(dynamic json, {bool growable = false}) => json is List ? json.map(fromJson).whereType<LocationInner>().toList(growable: growable) : [];
  @override
  bool operator ==(Object other) => other is LocationInner && other.value == value;
  @override
  int get hashCode => value.hashCode;
}
''', encoding='utf-8')
print('Applied deterministic Dart generator compatibility fixes.')
