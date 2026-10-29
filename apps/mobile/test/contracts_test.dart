import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:powwow_api/api.dart';

void main() {
  test('generated run request preserves API fields and enum defaults', () {
    final request = RunCreate(chatId: 'chat', messageId: 'message', idempotencyKey: 'mobile-request-1');
    final json = jsonDecode(jsonEncode(request));
    expect(json['capability'], 'auto');
    expect(json['idempotency_key'], 'mobile-request-1');
    expect(RunCreate.fromJson(json)!.messageId, 'message');
    expect(jsonDecode(jsonEncode(ProjectCreate(name: 'Studio')))['context_mode'], 'project');
  });
  test('generated validation locations preserve string and numeric paths', () {
    final error = ValidationError.fromJson({'loc': ['body', 'attachments', 0], 'msg': 'Invalid', 'type': 'value_error'})!;
    expect(jsonDecode(jsonEncode(error))['loc'], ['body', 'attachments', 0]);
  });
}
