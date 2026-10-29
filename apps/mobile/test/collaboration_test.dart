import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/api.dart';
import 'package:mobile/collaboration.dart';

final task = <String, dynamic>{
  'id': 'task-1',
  'organization_id': 'org-1',
  'project_id': 'project-1',
  'title': 'Review the checkout flow',
  'description': 'Review the changes and test the checkout.',
  'status': 'todo',
  'assignee_id': 'user-1',
};
final members = <Json>[
  {'user_id': 'user-1', 'display_name': 'Alex', 'role': 'member'},
];

void main() {
  test('an old account response cannot enter the new workspace', () async {
    String? account = 'account-a';
    final response = Completer<http.Response>();
    final api = PowwowApi(
      accessToken: () => account,
      client: MockClient((_) => response.future),
    );
    final pending = api.request('/tasks');
    final rejected = expectLater(pending, throwsA(isA<RequestUnavailable>()));
    account = 'account-b';
    response.complete(http.Response(jsonEncode([task]), 200));
    await rejected;
    api.close();
  });

  test('invitation accepts a code, query link, or fragment query link', () {
    expect(invitationToken(' abcdef123456 '), 'abcdef123456');
    expect(
      invitationToken('https://powwow.example/?invite=abcdef123456'),
      'abcdef123456',
    );
    expect(
      invitationToken('https://powwow.example/#/join?token=abcdef123456'),
      'abcdef123456',
    );
  });

  testWidgets('organization tasks load at phone width with large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = PowwowApi(
      accessToken: () => 'fixture-session',
      client: MockClient((request) async {
        expect(request.method, 'GET');
        final value = switch (request.url.path) {
          '/v1/organizations' => [
            {'id': 'org-1', 'name': 'Weekend projects', 'role': 'member'},
          ],
          '/v1/projects' => [
            {'id': 'project-1', 'name': 'Shop'},
          ],
          '/v1/tasks' => [task],
          '/v1/organizations/org-1/members' => members,
          '/v1/organizations/org-1/agents' => [],
          _ => throw StateError('Unexpected request ${request.url.path}'),
        };
        return http.Response(jsonEncode(value), 200);
      }),
    );
    addTearDown(api.close);
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: const TextScaler.linear(2)),
          child: child!,
        ),
        home: Scaffold(
          body: CollaborationHome(
            api: api,
            userId: 'user-1',
            openChat: (_) async {},
            openProject: (_) async {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Review the checkout flow'), findsOneWidget);
    expect(find.text('Shop · To do'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'task status persists and opening private chat makes no model request',
    (tester) async {
      final paths = <String>[];
      Json? opened;
      final api = PowwowApi(
        accessToken: () => 'fixture-session',
        client: MockClient((request) async {
          paths.add('${request.method} ${request.url.path}');
          if (request.method == 'PATCH') {
            expect(jsonDecode(request.body), {'status': 'in_progress'});
            return http.Response(
              jsonEncode({...task, 'status': 'in_progress'}),
              200,
            );
          }
          expect(request.method, 'PUT');
          expect(request.url.path, '/v1/tasks/task-1/chat');
          return http.Response(
            jsonEncode({'id': 'private-chat', 'project_id': 'project-1'}),
            200,
          );
        }),
      );
      addTearDown(api.close);
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => TaskPage(
                      api: api,
                      task: task,
                      members: members,
                      userId: 'user-1',
                      canEdit: true,
                      canManage: false,
                      openChat: (chat) async {
                        opened = chat;
                      },
                    ),
                  ),
                ),
                child: const Text('Open task'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open task'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('To do'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('In progress').last);
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Open private chat'));
      await tester.tap(find.text('Open private chat'));
      await tester.pumpAndSettle();
      expect(opened?['id'], 'private-chat');
      expect(paths, ['PATCH /v1/tasks/task-1', 'PUT /v1/tasks/task-1/chat']);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('viewers see task details without mutation controls', (
    tester,
  ) async {
    final api = PowwowApi(
      accessToken: () => 'fixture-session',
      client: MockClient(
        (_) async => throw StateError('Viewer must not submit a request'),
      ),
    );
    addTearDown(api.close);
    await tester.pumpWidget(
      MaterialApp(
        home: TaskPage(
          api: api,
          task: task,
          members: members,
          userId: 'user-2',
          canEdit: false,
          canManage: false,
          openChat: (_) async {},
        ),
      ),
    );
    expect(find.text('Review the checkout flow'), findsOneWidget);
    expect(find.text('Open private chat'), findsNothing);
    expect(find.text('Assign to me'), findsNothing);
    final dropdowns = tester.widgetList<DropdownButtonFormField<String>>(
      find.byType(DropdownButtonFormField<String>),
    );
    expect(dropdowns.every((field) => field.onChanged == null), isTrue);
  });
}
