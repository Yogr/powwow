import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
void main() {
  testWidgets('missing authentication configuration blocks the workspace', (tester) async {
    await tester.pumpWidget(const PowwowApp());
    expect(find.textContaining('requires Supabase sign-in'), findsOneWidget);
    expect(find.text('Local development account'), findsNothing);
    expect(find.text('Chat'), findsNothing);
    expect(find.byTooltip('Send request'), findsNothing);
    await tester.pumpWidget(const SizedBox());
  });
}
