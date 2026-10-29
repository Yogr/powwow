// GENERATED union compatibility fix; see scripts/fix-dart-generator.py.
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
