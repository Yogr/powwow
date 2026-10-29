import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('Android submits a real chat to the shared API and opens project output', (tester) async {
    await app.main();
    await tester.pumpAndSettle();
    expect(find.text('powwow'), findsOneWidget);
    if (find.text('Welcome to Powwow').evaluate().isNotEmpty) {
      const email = String.fromEnvironment('POWWOW_TEST_EMAIL');
      const password = String.fromEnvironment('POWWOW_TEST_PASSWORD');
      expect(email.isNotEmpty && password.isNotEmpty, isTrue,
          reason: 'Supply an existing test account using an ignored --dart-define-from-file. Anonymous access is disabled.');
      await tester.enterText(find.byKey(const Key('sign-in-email')), email);
      await tester.enterText(find.byKey(const Key('sign-in-password')), password);
      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();
      for (var attempt = 0; attempt < 15 && find.text('Welcome to Powwow').evaluate().isNotEmpty; attempt++) {
        await tester.pump(const Duration(seconds: 1));
      }
      expect(find.text('Welcome to Powwow'), findsNothing);
    }
    await tester.pump(const Duration(seconds: 2));
    await tester.tap(find.byTooltip('New chat'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'Reply with only these words: Shared backend confirmed.');
    await tester.tap(find.byTooltip('Send request'));
    var completed = false;
    for (var attempt = 0; attempt < 45; attempt++) {
      await tester.pump(const Duration(seconds: 1));
      final replies = find.byType(SelectableText).evaluate().map((element) => (element.widget as SelectableText).data ?? '');
      if (replies.any((text) => text.trim() == 'Shared backend confirmed.')) { completed = true; break; }
    }
    expect(completed, isTrue, reason: 'The actual local model must return its answer through the durable shared backend.');
    await tester.tap(find.text('Details'));
    await tester.pumpAndSettle();
    expect(find.textContaining('succeeded'), findsWidgets);
    await tester.tap(find.text('Output'));
    await tester.pumpAndSettle();
    expect(find.text('Output'), findsOneWidget);
  });
}
