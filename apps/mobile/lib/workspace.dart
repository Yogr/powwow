import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:powwow_api/api.dart' as contract;
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'config.dart';
import 'collaboration.dart';

class Workspace extends StatefulWidget {
  const Workspace({super.key});
  @override
  State<Workspace> createState() => _WorkspaceState();
}

class _WorkspaceState extends State<Workspace> with WidgetsBindingObserver {
  final api = PowwowApi();
  final prompt = TextEditingController(),
      email = TextEditingController(),
      password = TextEditingController();
  final chatScroll = ScrollController();
  List<dynamic> projects = [],
      chats = [],
      messages = [],
      runs = [],
      artifacts = [];
  String? projectId, chatId, error;
  String capability = 'auto';
  int panel = 0;
  bool busy = false, refreshing = false;
  int workspaceEpoch = 0, selectionEpoch = 0;
  String? currentAccount;
  Map<String, dynamic>? pendingRun;
  Timer? timer;
  StreamSubscription<AuthState>? authSubscription;
  bool get signedIn => Supabase.instance.client.auth.currentSession != null;
  bool get hasActiveRun => runs.any(
    (r) => !['succeeded', 'failed', 'cancelled'].contains(r['status']),
  );
  String get pendingKey =>
      'powwow.pendingRun.${Supabase.instance.client.auth.currentUser?.id ?? 'anonymous'}';
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    currentAccount = Supabase.instance.client.auth.currentUser?.id;
    {
      authSubscription = Supabase.instance.client.auth.onAuthStateChange.listen(
        (_) {
          final account = Supabase.instance.client.auth.currentUser?.id;
          if (!mounted || account == currentAccount) return;
          setState(() {
            currentAccount = account;
            workspaceEpoch++;
            selectionEpoch++;
            projects = [];
            chats = [];
            messages = [];
            runs = [];
            artifacts = [];
            projectId = null;
            chatId = null;
            pendingRun = null;
            error = null;
            prompt.clear();
          });
          if (signedIn) {
            unawaited(loadProjects());
            unawaited(restorePending());
          }
        },
      );
    }
    if (signedIn) unawaited(loadProjects());
    if (signedIn) unawaited(restorePending());
    timer = Timer.periodic(const Duration(seconds: 3), (_) => refresh());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) unawaited(refresh());
  }

  @override
  void dispose() {
    timer?.cancel();
    authSubscription?.cancel();
    api.close();
    WidgetsBinding.instance.removeObserver(this);
    prompt.dispose();
    email.dispose();
    password.dispose();
    chatScroll.dispose();
    super.dispose();
  }

  Future<void> guarded(Future<void> Function() action) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> restorePending() async {
    final key = pendingKey;
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(key);
    if (saved != null && mounted && key == pendingKey) {
      setState(() {
        pendingRun = Map<String, dynamic>.from(jsonDecode(saved));
        error =
            'A previous submission needs confirmation. Tap Send to safely reconnect using the same request ID.';
      });
    }
  }

  Future<void> savePending(String path, Object body) async {
    pendingRun = {'path': path, 'body': jsonDecode(jsonEncode(body))};
    await (await SharedPreferences.getInstance()).setString(
      pendingKey,
      jsonEncode(pendingRun),
    );
  }

  Future<void> clearPending() async {
    pendingRun = null;
    await (await SharedPreferences.getInstance()).remove(pendingKey);
  }

  Future<void> resolvePending() async {
    try {
      final run = await api.request(
        pendingRun!['path'],
        method: 'POST',
        body: pendingRun!['body'],
      );
      chatId = run['chat_id'];
      projectId = run['project_id'];
      await clearPending();
      prompt.clear();
      await refresh();
    } on ApiFailure catch (failure) {
      if (failure.status >= 400 && failure.status < 500) await clearPending();
      rethrow;
    }
  }

  Future<void> retryRun(Map<String, dynamic> run) => guarded(() async {
    if (pendingRun == null) {
      await savePending(
        '/runs/${run['id']}/retry',
        contract.RunRetry(
          idempotencyKey:
              'mobile-retry-${run['id']}-${DateTime.now().microsecondsSinceEpoch}',
        ),
      );
    }
    await resolvePending();
  });
  Future<void> loadProjects() async {
    final epoch = workspaceEpoch;
    try {
      final data = await api.request('/projects?archived=false') as List;
      if (!mounted || epoch != workspaceEpoch) return;
      setState(() {
        projects = data;
      });
      if (projectId == null && projects.isNotEmpty) {
        await selectProject(projects.first['id']);
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    }
  }

  Future<void> selectProject(String id) async {
    final epoch = workspaceEpoch, selection = ++selectionEpoch;
    setState(() {
      projectId = id;
      chatId = null;
      messages = [];
      runs = [];
      artifacts = [];
      chats = [];
    });
    final data =
        await api.request('/chats?project_id=$id&archived=false') as List;
    if (!mounted || epoch != workspaceEpoch || selection != selectionEpoch) {
      return;
    }
    setState(() {
      projectId = id;
      chats = data;
      chatId = data.isEmpty ? null : data.first['id'];
      messages = [];
      runs = [];
      artifacts = [];
    });
    await refresh();
  }

  Future<void> refresh() async {
    if (!signedIn || projectId == null || refreshing) return;
    refreshing = true;
    final epoch = workspaceEpoch;
    final currentChat = chatId, currentProject = projectId;
    try {
      final data = await Future.wait([
        currentChat != null
            ? api.request('/chats/$currentChat/messages')
            : Future.value([]),
        currentChat != null
            ? api.request('/runs?chat_id=$currentChat')
            : Future.value([]),
        api.request('/artifacts?project_id=$currentProject'),
      ]);
      if (mounted &&
          epoch == workspaceEpoch &&
          chatId == currentChat &&
          projectId == currentProject) {
        final changed = messages.length != (data[0] as List).length;
        setState(() {
          messages = data[0];
          runs = data[1];
          artifacts = data[2];
        });
        if (changed) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted && chatScroll.hasClients) {
              chatScroll.animateTo(
                0,
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeOut,
              );
            }
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      refreshing = false;
    }
  }

  Future<void> submit() => guarded(() async {
    if (pendingRun != null) {
      await resolvePending();
      return;
    }
    if (hasActiveRun) {
      throw StateError(
        'Wait for this chat’s current run or cancel it in Details.',
      );
    }
    final text = prompt.text.trim();
    if (text.isEmpty) return;
    final decision = await api.prepareRequest(text, capability);
    if (!mounted || !signedIn) return;
    if (projectId == null) {
      final p = await api.request(
        '/projects',
        method: 'POST',
        body: contract.ProjectCreate(name: 'My workspace'),
      );
      projectId = p['id'];
      await loadProjects();
    }
    if (chatId == null) {
      final c = await api.request(
        '/chats',
        method: 'POST',
        body: contract.ChatCreate(
          projectId: projectId!,
          title: text.substring(0, text.length > 50 ? 50 : text.length),
        ),
      );
      chatId = c['id'];
      chats = [...chats, c];
    }
    final m = await api.request(
      '/chats/$chatId/messages',
      method: 'POST',
      body: contract.MessageCreate(content: text),
    );
    final run = contract.RunCreate(
      chatId: chatId!,
      messageId: m['id'],
      capability: contract.RunCreateCapabilityEnum.fromJson(capability)!,
      settings: contract.GenerationSettings(),
      budgetUsd: 1,
      idempotencyKey: 'mobile-${m['id']}',
      intentId: decision.id,
    );
    await savePending('/runs', run);
    await resolvePending();
  });
  Future<void> createProject() async {
    final name = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New project'),
        content: TextField(
          controller: name,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, name.text),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    name.dispose();
    if (result == null || result.trim().isEmpty) return;
    await guarded(() async {
      final p = await api.request(
        '/projects',
        method: 'POST',
        body: {'name': result.trim()},
      );
      await loadProjects();
      await selectProject(p['id']);
    });
  }

  Future<void> openTaskChat(Json chat) => guarded(() async {
    await selectProject(chat['project_id']);
    if (!mounted) return;
    setState(() {
      chatId = chat['id'];
      panel = 1;
      messages = [];
      runs = [];
    });
    await refresh();
  });
  Future<void> openCollaborationProject(Json project) => guarded(() async {
    await selectProject(project['id']);
    if (mounted) setState(() => panel = 1);
  });
  Widget login() => Center(
    child: SizedBox(
      width: 380,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Welcome to Powwow',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              key: const Key('sign-in-email'),
            ),
            TextField(
              controller: password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
              key: const Key('sign-in-password'),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: busy
                  ? null
                  : () => guarded(() async {
                      await Supabase.instance.client.auth.signInWithPassword(
                        email: email.text.trim(),
                        password: password.text,
                      );
                      await loadProjects();
                    }),
              child: const Text('Sign in'),
            ),
            TextButton(
              onPressed: busy
                  ? null
                  : () => guarded(() async {
                      final result = await Supabase.instance.client.auth.signUp(
                        email: email.text.trim(),
                        password: password.text,
                      );
                      if (result.session == null && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Check your email to confirm your account.',
                            ),
                          ),
                        );
                      }
                    }),
              child: const Text('Create account'),
            ),
            if (error != null) Text(error!),
          ],
        ),
      ),
    ),
  );
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('powwow'),
      actions: [
        if (signedIn && panel != 0)
          IconButton(
            tooltip: 'New chat',
            onPressed: busy
                ? null
                : () => setState(() {
                    selectionEpoch++;
                    chatId = null;
                    messages = [];
                    runs = [];
                    panel = 1;
                  }),
            icon: const Icon(Icons.edit_square),
          ),
        if (signedIn && panel != 0)
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => guarded(refresh),
            icon: const Icon(Icons.refresh),
          ),
      ],
    ),
    drawer: signedIn
        ? Drawer(
            child: SafeArea(
              child: ListView(
                children: [
                  ListTile(
                    leading: const Icon(Icons.groups_outlined),
                    title: const Text('Organizations and tasks'),
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => panel = 0);
                    },
                  ),
                  const ListTile(title: Text('PROJECTS')),
                  ListTile(
                    leading: const Icon(Icons.add),
                    title: const Text('New personal project'),
                    onTap: createProject,
                  ),
                  ...projects.map(
                    (p) => ListTile(
                      selected: p['id'] == projectId,
                      leading: const Icon(Icons.folder_outlined),
                      title: Text(p['name']),
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => panel = 1);
                        guarded(() => selectProject(p['id']));
                      },
                    ),
                  ),
                  const Divider(),
                  const ListTile(title: Text('CHATS')),
                  ...chats.map(
                    (c) => ListTile(
                      selected: c['id'] == chatId,
                      title: Text(c['title']),
                      onTap: () {
                        Navigator.pop(context);
                        setState(() {
                          chatId = c['id'];
                          messages = [];
                          panel = 1;
                        });
                        guarded(refresh);
                      },
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.logout),
                    title: const Text('Sign out'),
                    onTap: busy
                        ? null
                        : () {
                            Navigator.pop(context);
                            guarded(
                              () => Supabase.instance.client.auth.signOut(),
                            );
                          },
                  ),
                ],
              ),
            ),
          )
        : null,
    body: !signedIn
        ? login()
        : Column(
            children: [
              if (error != null)
                MaterialBanner(
                  content: Text(error!, maxLines: 4),
                  actions: [
                    TextButton(
                      onPressed: () => setState(() => error = null),
                      child: const Text('Dismiss'),
                    ),
                  ],
                ),
              Expanded(
                child: IndexedStack(
                  index: panel,
                  children: [
                    CollaborationHome(
                      key: ValueKey(currentAccount),
                      api: api,
                      userId: currentAccount!,
                      openChat: openTaskChat,
                      openProject: openCollaborationProject,
                    ),
                    chatPanel(),
                    outputPanel(),
                    detailsPanel(),
                  ],
                ),
              ),
            ],
          ),
    bottomNavigationBar: signedIn
        ? NavigationBar(
            selectedIndex: panel,
            onDestinationSelected: (v) => setState(() => panel = v),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.task_alt),
                label: 'Workspace',
              ),
              NavigationDestination(
                icon: Icon(Icons.chat_bubble_outline),
                label: 'Chat',
              ),
              NavigationDestination(
                icon: Icon(Icons.folder_outlined),
                label: 'Files',
              ),
              NavigationDestination(icon: Icon(Icons.tune), label: 'Runs'),
            ],
          )
        : null,
  );
  Widget chatPanel() => Column(
    children: [
      Expanded(
        child: messages.isEmpty
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text(
                    'Start a private conversation.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20),
                  ),
                ),
              )
            : ListView.builder(
                controller: chatScroll,
                reverse: true,
                padding: const EdgeInsets.all(16),
                itemCount: messages.length,
                itemBuilder: (context, index) {
                  final m = messages[messages.length - index - 1];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            m['role'] == 'user' ? 'You' : 'Powwow',
                            style: const TextStyle(color: Color(0xFFE5A18B)),
                          ),
                          const SizedBox(height: 8),
                          SelectableText(m['content'] ?? ''),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
      if (runs.any(
        (r) => !['succeeded', 'failed', 'cancelled'].contains(r['status']),
      ))
        const LinearProgressIndicator(),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                initialValue: capability,
                decoration: const InputDecoration(labelText: 'Create'),
                items: const [
                  DropdownMenuItem(
                    value: 'auto',
                    child: Text('Let Powwow choose'),
                  ),
                  DropdownMenuItem(value: 'chat', child: Text('Talk & write')),
                  DropdownMenuItem(
                    value: 'text_to_image',
                    child: Text('Create an image'),
                  ),
                ],
                onChanged: (v) => setState(() => capability = v!),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: prompt,
                      minLines: 1,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        hintText: 'What do you want to achieve?',
                      ),
                    ),
                  ),
                  IconButton.filled(
                    tooltip: 'Send request',
                    onPressed: busy || (hasActiveRun && pendingRun == null)
                        ? null
                        : submit,
                    icon: const Icon(Icons.arrow_upward),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  );
  Widget outputPanel() => artifacts.isEmpty
      ? const Center(child: Text('Your project outputs will appear here.'))
      : ListView(
          padding: const EdgeInsets.all(16),
          children: artifacts
              .map(
                (a) => Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (a['kind'] == 'image')
                        Image.network(
                          '$apiUrl${a['url']}',
                          headers: api.headers,
                          errorBuilder: (_, _, _) => const Padding(
                            padding: EdgeInsets.all(24),
                            child: Text('Preview unavailable'),
                          ),
                        ),
                      ListTile(
                        title: Text(a['name']),
                        subtitle: Text(a['mime_type']),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        );
  Widget detailsPanel() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      const Text('WORKFLOW ACTIVITY', style: TextStyle(letterSpacing: 2)),
      const SizedBox(height: 16),
      if (runs.isEmpty)
        const Text('Run a request to see its workflow, model and progress.'),
      ...runs.map(
        (r) => Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  r['workflow_id'] ?? r['capability'],
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text('${r['status']} · ${r['stage']}'),
                Text('${r['model'] ?? 'Awaiting model'}'),
                Text('Reserved: \$${r['estimated_cost_usd'] ?? 0}'),
                if (r['error'] != null) Text('${r['error']['message']}'),
                if (!['succeeded', 'failed', 'cancelled'].contains(r['status']))
                  TextButton(
                    onPressed: () => guarded(() async {
                      await api.request(
                        '/runs/${r['id']}/cancel',
                        method: 'POST',
                      );
                      await refresh();
                    }),
                    child: const Text('Cancel run'),
                  ),
                if (['failed', 'cancelled'].contains(r['status']))
                  TextButton(
                    onPressed: () => retryRun(Map<String, dynamic>.from(r)),
                    child: const Text('Retry'),
                  ),
              ],
            ),
          ),
        ),
      ),
    ],
  );
}
