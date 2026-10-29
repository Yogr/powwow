import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';

typedef Json = Map<String, dynamic>;

List<Json> records(dynamic value) => (value as List)
    .map((item) => Map<String, dynamic>.from(item as Map))
    .toList();

const taskStatuses = <String, String>{
  'todo': 'To do',
  'in_progress': 'In progress',
  'review': 'In review',
  'done': 'Done',
};

/// Collaboration metadata uses the same authenticated server as model requests.
/// Opening a task chat does not submit a model request.
class CollaborationHome extends StatefulWidget {
  const CollaborationHome({
    super.key,
    required this.api,
    required this.userId,
    required this.openChat,
    required this.openProject,
  });
  final PowwowApi api;
  final String userId;
  final Future<void> Function(Json chat) openChat;
  final Future<void> Function(Json project) openProject;
  @override
  State<CollaborationHome> createState() => _CollaborationHomeState();
}

class _CollaborationHomeState extends State<CollaborationHome> {
  List<Json> organizations = [],
      projects = [],
      tasks = [],
      members = [],
      agents = [];
  String? organizationId, error;
  bool loading = true, busy = false;
  int section = 0, epoch = 0;
  Json? get organization =>
      organizations.where((o) => o['id'] == organizationId).firstOrNull;
  bool get canEdit => organization != null && organization!['role'] != 'viewer';
  bool get canManage => ['owner', 'admin'].contains(organization?['role']);

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load({String? select}) async {
    final revision = ++epoch;
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final all = records(await widget.api.request('/organizations'));
      if (!mounted || revision != epoch) return;
      final preferred = select ?? organizationId;
      final selected = all.any((o) => o['id'] == preferred)
          ? preferred
          : all.firstOrNull?['id'] as String?;
      setState(() {
        organizations = all;
        organizationId = selected;
        projects = [];
        tasks = [];
        members = [];
        agents = [];
      });
      if (selected != null) {
        final data = await Future.wait([
          widget.api.request(
            '/projects?archived=false&organization_id=$selected',
          ),
          widget.api.request(
            '/tasks?assigned_to_me=true&organization_id=$selected',
          ),
          widget.api.request('/organizations/$selected/members'),
          widget.api.request('/organizations/$selected/agents'),
        ]);
        if (!mounted || revision != epoch) return;
        setState(() {
          projects = records(data[0]);
          tasks = records(data[1]);
          members = records(data[2]);
          agents = records(data[3]);
        });
      }
    } catch (e) {
      if (mounted && revision == epoch) setState(() => error = '$e');
    } finally {
      if (mounted && revision == epoch) setState(() => loading = false);
    }
  }

  Future<void> action(Future<void> Function() callback) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await callback();
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<String?> textInput(
    String title,
    String label, {
    String actionLabel = 'Create',
    int maxLines = 1,
  }) async {
    final input = TextEditingController();
    final value = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: input,
          autofocus: true,
          minLines: 1,
          maxLines: maxLines,
          decoration: InputDecoration(labelText: label),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (input.text.trim().isNotEmpty) {
                Navigator.pop(context, input.text.trim());
              }
            },
            child: Text(actionLabel),
          ),
        ],
      ),
    );
    // A dialog's exit animation still owns the TextField for this frame.
    Future<void>.delayed(const Duration(milliseconds: 300), input.dispose);
    return value;
  }

  Future<void> createOrganization() async {
    final name = await textInput('New organization', 'Name');
    if (name == null || !mounted) return;
    await action(() async {
      final created = await widget.api.request(
        '/organizations',
        method: 'POST',
        body: {'name': name},
      );
      await load(select: created['id']);
    });
  }

  Future<void> joinOrganization() async {
    final value = await textInput(
      'Join organization',
      'Invitation code or link',
      actionLabel: 'Join',
      maxLines: 3,
    );
    if (value == null || !mounted) return;
    final token = invitationToken(value);
    await action(() async {
      final result = await widget.api.request(
        '/invites/accept',
        method: 'POST',
        body: {'token': token},
      );
      await load(select: result['organization_id'] ?? result['id']);
    });
  }

  Future<void> createProject() async {
    final name = await textInput('New project', 'Name');
    if (name == null || !mounted) return;
    final id = organizationId;
    await action(() async {
      await widget.api.request(
        '/projects',
        method: 'POST',
        body: {'name': name, 'organization_id': id},
      );
      await load(select: id);
    });
  }

  Future<void> showTask(Json task) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => TaskPage(
          api: widget.api,
          task: task,
          members: members,
          userId: widget.userId,
          canEdit: canEdit,
          canManage: canManage,
          openChat: widget.openChat,
        ),
      ),
    );
    if (mounted) await load();
  }

  Future<void> showProject(Json project) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ProjectTasksPage(
          api: widget.api,
          project: project,
          members: members,
          userId: widget.userId,
          canEdit: canEdit,
          canManage: canManage,
          openChat: widget.openChat,
          openProject: widget.openProject,
        ),
      ),
    );
    if (mounted) await load();
  }

  Future<void> invite() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => InvitationsPage(
          api: widget.api,
          organizationId: organizationId!,
          organizationName: organization!['name'],
          canInviteAdmin: organization!['role'] == 'owner',
        ),
      ),
    );
    if (mounted) await load();
  }

  Future<void> changeDisplayName() async {
    final name = await textInput(
      'Your name',
      'Display name',
      actionLabel: 'Save',
    );
    if (name == null || !mounted) return;
    final id = organizationId;
    await action(() async {
      await widget.api.request(
        '/organizations/$id/members/${widget.userId}',
        method: 'PATCH',
        body: {'display_name': name},
      );
      await load(select: id);
    });
  }

  Future<void> createAgent() async {
    final name = TextEditingController(),
        description = TextEditingController(),
        instructions = TextEditingController();
    final data = await showDialog<Json>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New agent'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                autofocus: true,
                maxLength: 120,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              TextField(
                controller: description,
                maxLength: 1000,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              TextField(
                controller: instructions,
                minLines: 4,
                maxLines: 10,
                decoration: const InputDecoration(labelText: 'Instructions'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (name.text.trim().isNotEmpty) {
                Navigator.pop(context, {
                  'name': name.text.trim(),
                  'description': description.text.trim(),
                  'instructions': instructions.text.trim(),
                  'mcp_ids': <String>[],
                  'enabled': true,
                });
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    Future<void>.delayed(const Duration(milliseconds: 300), () {
      name.dispose();
      description.dispose();
      instructions.dispose();
    });
    if (data == null || !mounted) return;
    final id = organizationId;
    await action(() async {
      await widget.api.request(
        '/organizations/$id/agents',
        method: 'POST',
        body: data,
      );
      await load(select: id);
    });
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: load,
    child: ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Workspace',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            PopupMenuButton<String>(
              tooltip: 'Organization actions',
              enabled: !busy,
              onSelected: (value) =>
                  value == 'create' ? createOrganization() : joinOrganization(),
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'create', child: Text('New organization')),
                PopupMenuItem(value: 'join', child: Text('Join organization')),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (organizations.isNotEmpty)
          DropdownButtonFormField<String>(
            key: ValueKey(organizationId),
            initialValue: organizationId,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Organization',
              border: OutlineInputBorder(),
            ),
            items: organizations
                .map(
                  (o) => DropdownMenuItem<String>(
                    value: o['id'],
                    child: Text(o['name'], overflow: TextOverflow.ellipsis),
                  ),
                )
                .toList(),
            onChanged: busy || loading ? null : (id) => load(select: id),
          ),
        if (loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: LinearProgressIndicator(),
          ),
        if (error != null) ErrorNotice(message: error!, retry: () => load()),
        if (!loading && organizations.isEmpty && error == null) ...[
          const SizedBox(height: 16),
          const Text('Create an organization or join with an invitation.'),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: busy ? null : createOrganization,
            icon: const Icon(Icons.add),
            label: const Text('New organization'),
          ),
          TextButton(
            onPressed: busy ? null : joinOrganization,
            child: const Text('Join organization'),
          ),
        ],
        if (organizationId != null) ...[
          const SizedBox(height: 20),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SegmentedButton<int>(
              showSelectedIcon: false,
              segments: const [
                ButtonSegment(value: 0, label: Text('My tasks')),
                ButtonSegment(value: 1, label: Text('Projects')),
                ButtonSegment(value: 2, label: Text('People')),
                ButtonSegment(value: 3, label: Text('Agents')),
              ],
              selected: {section},
              onSelectionChanged: (value) =>
                  setState(() => section = value.first),
            ),
          ),
          const SizedBox(height: 16),
          if (section == 0) ...[
            if (!loading && tasks.isEmpty)
              const EmptyState(
                icon: Icons.task_alt,
                text: 'No tasks assigned to you.',
              ),
            ...tasks.map(
              (task) => TaskTile(
                task: task,
                projectName: projects
                    .where((p) => p['id'] == task['project_id'])
                    .firstOrNull?['name'],
                onTap: () => showTask(task),
              ),
            ),
          ],
          if (section == 1) ...[
            if (canEdit)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: busy ? null : createProject,
                  icon: const Icon(Icons.add),
                  label: const Text('New project'),
                ),
              ),
            if (!loading && projects.isEmpty)
              const EmptyState(
                icon: Icons.folder_outlined,
                text: 'No projects yet.',
              ),
            ...projects.map(
              (project) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.folder_outlined),
                title: Text(project['name']),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => showProject(project),
              ),
            ),
          ],
          if (section == 2) ...[
            if (canManage)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: busy ? null : invite,
                  icon: const Icon(Icons.person_add_outlined),
                  label: const Text('Invite people'),
                ),
              ),
            ...members.map(
              (member) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.person_outline),
                title: Text(memberLabel(member)),
                subtitle: Text(
                  '${member['role']}${member['user_id'] == widget.userId ? ' · You' : ''}',
                ),
                trailing: member['user_id'] == widget.userId
                    ? IconButton(
                        tooltip: 'Edit your name',
                        onPressed: busy ? null : changeDisplayName,
                        icon: const Icon(Icons.edit_outlined),
                      )
                    : null,
              ),
            ),
          ],
          if (section == 3) ...[
            if (canEdit)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: busy ? null : createAgent,
                  icon: const Icon(Icons.add),
                  label: const Text('New agent'),
                ),
              ),
            const Text('Shared agent definitions'),
            const SizedBox(height: 8),
            const Text(
              'Agent execution is not connected yet.',
              style: TextStyle(color: Colors.grey),
            ),
            if (!loading && agents.isEmpty)
              const EmptyState(
                icon: Icons.smart_toy_outlined,
                text: 'No shared agents yet.',
              ),
            ...agents.map(
              (agent) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.smart_toy_outlined),
                title: Text(agent['name']),
                subtitle: Text(agent['description'] ?? ''),
                onTap: () => showDialog<void>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: Text(agent['name']),
                    content: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(agent['description'] ?? ''),
                          const SizedBox(height: 16),
                          SelectableText(agent['instructions'] ?? ''),
                          const SizedBox(height: 16),
                          Text(
                            'Model: ${agent['model_id'] ?? 'Organization default'}',
                          ),
                          Text(
                            'MCPs: ${(agent['mcp_ids'] as List? ?? []).join(', ')}',
                          ),
                        ],
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ],
    ),
  );
}

String invitationToken(String value) {
  final input = value.trim();
  final uri = Uri.tryParse(input);
  if (uri != null && uri.hasScheme) {
    final queryToken =
        uri.queryParameters['invite'] ?? uri.queryParameters['token'];
    if (queryToken != null && queryToken.isNotEmpty) return queryToken;
    final fragment = Uri.tryParse(uri.fragment);
    final fragmentToken =
        fragment?.queryParameters['invite'] ??
        fragment?.queryParameters['token'];
    if (fragmentToken != null && fragmentToken.isNotEmpty) return fragmentToken;
    if (uri.fragment.startsWith('invite=') ||
        uri.fragment.startsWith('token=')) {
      final values = Uri.splitQueryString(uri.fragment);
      return values['invite'] ?? values['token'] ?? input;
    }
  }
  return input;
}

String memberLabel(Json member) =>
    member['display_name'] as String? ?? member['user_id'] as String;

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 40),
    child: Column(
      children: [
        Icon(icon, size: 28, color: Colors.grey),
        const SizedBox(height: 12),
        Text(text, textAlign: TextAlign.center),
      ],
    ),
  );
}

class ErrorNotice extends StatelessWidget {
  const ErrorNotice({
    super.key,
    required this.message,
    required this.retry,
    this.retryLabel = 'Refresh',
  });
  final String message;
  final VoidCallback retry;
  final String retryLabel;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          message,
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
        TextButton(onPressed: retry, child: Text(retryLabel)),
      ],
    ),
  );
}

class TaskTile extends StatelessWidget {
  const TaskTile({
    super.key,
    required this.task,
    required this.onTap,
    this.projectName,
  });
  final Json task;
  final VoidCallback onTap;
  final String? projectName;
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(vertical: 4),
    leading: Icon(
      task['status'] == 'done'
          ? Icons.check_circle_outline
          : Icons.radio_button_unchecked,
    ),
    title: Text(task['title']),
    subtitle: Text(
      [
        ?projectName,
        taskStatuses[task['status']] ?? task['status'],
      ].join(' · '),
    ),
    trailing: const Icon(Icons.chevron_right),
    onTap: onTap,
  );
}

class ProjectTasksPage extends StatefulWidget {
  const ProjectTasksPage({
    super.key,
    required this.api,
    required this.project,
    required this.members,
    required this.userId,
    required this.canEdit,
    required this.canManage,
    required this.openChat,
    required this.openProject,
  });
  final PowwowApi api;
  final Json project;
  final List<Json> members;
  final String userId;
  final bool canEdit, canManage;
  final Future<void> Function(Json) openChat, openProject;
  @override
  State<ProjectTasksPage> createState() => _ProjectTasksPageState();
}

class _ProjectTasksPageState extends State<ProjectTasksPage> {
  List<Json> tasks = [];
  bool loading = true, saving = false;
  String? error;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final data = records(
        await widget.api.request('/projects/${widget.project['id']}/tasks'),
      );
      if (mounted) setState(() => tasks = data);
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> create() async {
    final title = TextEditingController(),
        description = TextEditingController();
    final data = await showDialog<Json>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New task'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: title,
                autofocus: true,
                maxLength: 200,
                decoration: const InputDecoration(labelText: 'Title'),
              ),
              TextField(
                controller: description,
                minLines: 3,
                maxLines: 8,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (title.text.trim().isNotEmpty) {
                Navigator.pop(context, {
                  'title': title.text.trim(),
                  'description': description.text.trim(),
                  'status': 'todo',
                });
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
    Future<void>.delayed(const Duration(milliseconds: 300), () {
      title.dispose();
      description.dispose();
    });
    if (data == null || !mounted) return;
    setState(() {
      saving = true;
      error = null;
    });
    try {
      await widget.api.request(
        '/projects/${widget.project['id']}/tasks',
        method: 'POST',
        body: data,
      );
      await load();
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.project['name'])),
    body: RefreshIndicator(
      onRefresh: load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Task board',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              if (widget.canEdit)
                IconButton(
                  tooltip: 'New task',
                  onPressed: saving ? null : create,
                  icon: const Icon(Icons.add),
                ),
            ],
          ),
          TextButton.icon(
            onPressed: () async {
              await widget.openProject(widget.project);
              if (context.mounted) Navigator.pop(context);
            },
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Open project chats and files'),
          ),
          if (loading || saving) const LinearProgressIndicator(),
          if (error != null) ErrorNotice(message: error!, retry: load),
          if (!loading && tasks.isEmpty)
            const EmptyState(icon: Icons.task_alt, text: 'No tasks yet.'),
          ...taskStatuses.entries
              .where((status) => tasks.any((t) => t['status'] == status.key))
              .map(
                (status) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 20),
                    Text(
                      status.value,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    ...tasks
                        .where((task) => task['status'] == status.key)
                        .map(
                          (task) => TaskTile(
                            task: task,
                            onTap: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => TaskPage(
                                    api: widget.api,
                                    task: task,
                                    members: widget.members,
                                    userId: widget.userId,
                                    canEdit: widget.canEdit,
                                    canManage: widget.canManage,
                                    openChat: (chat) async {
                                      await widget.openChat(chat);
                                      if (context.mounted) {
                                        Navigator.pop(context);
                                      }
                                    },
                                  ),
                                ),
                              );
                              if (mounted) await load();
                            },
                          ),
                        ),
                  ],
                ),
              ),
        ],
      ),
    ),
  );
}

class TaskPage extends StatefulWidget {
  const TaskPage({
    super.key,
    required this.api,
    required this.task,
    required this.members,
    required this.userId,
    required this.canEdit,
    required this.canManage,
    required this.openChat,
  });
  final PowwowApi api;
  final Json task;
  final List<Json> members;
  final String userId;
  final bool canEdit, canManage;
  final Future<void> Function(Json chat) openChat;
  @override
  State<TaskPage> createState() => _TaskPageState();
}

class _TaskPageState extends State<TaskPage> {
  late Json task = Map.of(widget.task);
  bool busy = false;
  String? error;
  Future<void> update(Json change) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await widget.api.request(
        '/tasks/${task['id']}',
        method: 'PATCH',
        body: change,
      );
      if (mounted) setState(() => task = Map<String, dynamic>.from(result));
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> chat() async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await widget.api.request(
        '/tasks/${task['id']}/chat',
        method: 'PUT',
      );
      if (!mounted) return;
      // Close the detail route before changing the parent's navigation tab.
      Navigator.pop(context);
      await widget.openChat(Map<String, dynamic>.from(result));
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Task')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(task['title'], style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        SelectableText(
          (task['description'] as String? ?? '').isEmpty
              ? 'No description.'
              : task['description'],
        ),
        const SizedBox(height: 28),
        DropdownButtonFormField<String>(
          key: ValueKey('status-${task['status']}'),
          initialValue: task['status'],
          decoration: const InputDecoration(
            labelText: 'Status',
            border: OutlineInputBorder(),
          ),
          items: taskStatuses.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: busy || !widget.canEdit
              ? null
              : (value) => update({'status': value}),
        ),
        const SizedBox(height: 20),
        DropdownButtonFormField<String>(
          key: ValueKey('assignee-${task['assignee_id']}'),
          initialValue: task['assignee_id'] ?? '',
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Assigned to',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: '', child: Text('Unassigned')),
            ...widget.members
                .where(
                  (m) =>
                      m['role'] != 'viewer' ||
                      m['user_id'] == task['assignee_id'],
                )
                .map(
                  (m) => DropdownMenuItem<String>(
                    value: m['user_id'],
                    enabled: m['role'] != 'viewer',
                    child: Text(
                      memberLabel(m),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
          ],
          onChanged: busy || !widget.canEdit
              ? null
              : (value) => update({'assignee_id': value == '' ? null : value}),
        ),
        if (widget.canEdit && task['assignee_id'] != widget.userId)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: busy
                  ? null
                  : () => update({'assignee_id': widget.userId}),
              child: const Text('Assign to me'),
            ),
          ),
        if (busy)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: LinearProgressIndicator(),
          ),
        if (error != null)
          ErrorNotice(
            message: error!,
            retryLabel: 'Dismiss',
            retry: () => setState(() => error = null),
          ),
        const SizedBox(height: 28),
        if (widget.canEdit)
          FilledButton.icon(
            onPressed: busy ? null : chat,
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Open private chat'),
          ),
        const SizedBox(height: 8),
        const Text(
          'Your conversation stays private. Task details are shared.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey, fontSize: 12),
        ),
      ],
    ),
  );
}

class InvitationsPage extends StatefulWidget {
  const InvitationsPage({
    super.key,
    required this.api,
    required this.organizationId,
    required this.organizationName,
    required this.canInviteAdmin,
  });
  final PowwowApi api;
  final String organizationId, organizationName;
  final bool canInviteAdmin;
  @override
  State<InvitationsPage> createState() => _InvitationsPageState();
}

class _InvitationsPageState extends State<InvitationsPage> {
  final email = TextEditingController();
  String role = 'member';
  String? error;
  Json? created;
  List<Json> invites = [];
  bool busy = false, loading = true;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    email.dispose();
    super.dispose();
  }

  Future<void> load() async {
    try {
      final data = records(
        await widget.api.request(
          '/organizations/${widget.organizationId}/invites',
        ),
      );
      if (mounted) setState(() => invites = data);
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> create() async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final data = await widget.api.request(
        '/organizations/${widget.organizationId}/invites',
        method: 'POST',
        body: {
          'role': role,
          'expires_in_days': 7,
          'max_uses': 1,
          if (email.text.trim().isNotEmpty) 'email': email.text.trim(),
        },
      );
      if (mounted) setState(() => created = Map<String, dynamic>.from(data));
      await load();
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> copy() async {
    await Clipboard.setData(
      ClipboardData(text: created!['invite_code'] ?? created!['token']),
    );
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Invitation code copied')));
    }
  }

  Future<void> draftEmail() async {
    final code = created!['invite_code'] ?? created!['token'];
    final subject = Uri.encodeComponent(
      'Join ${widget.organizationName} on Powwow',
    );
    final body = Uri.encodeComponent(
      'Join ${widget.organizationName} on Powwow. In Workspace, choose Join organization and paste this invitation code:\n\n$code\n\nThis invitation expires in 7 days and can be used once.',
    );
    try {
      final opened = await launchUrl(
        Uri.parse(
          'mailto:${Uri.encodeComponent(email.text.trim())}?subject=$subject&body=$body',
        ),
      );
      if (!opened && mounted) {
        setState(
          () => error = 'No email app is available. Copy the code to share it.',
        );
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => error =
              'Could not open your email app. Copy the code to share it.',
        );
      }
    }
  }

  Future<void> revoke(Json invite) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.api.request(
        '/organizations/${widget.organizationId}/invites/${invite['id']}',
        method: 'DELETE',
      );
      if (mounted && created?['id'] == invite['id']) {
        setState(() => created = null);
      }
      await load();
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Invite people')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email (optional)',
            helperText: 'Limit this invitation to one email address.',
          ),
        ),
        const SizedBox(height: 20),
        DropdownButtonFormField<String>(
          initialValue: role,
          decoration: const InputDecoration(
            labelText: 'Role',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: 'member', child: Text('Member')),
            const DropdownMenuItem(value: 'viewer', child: Text('Viewer')),
            if (widget.canInviteAdmin)
              const DropdownMenuItem(value: 'admin', child: Text('Admin')),
          ],
          onChanged: busy ? null : (value) => setState(() => role = value!),
        ),
        const SizedBox(height: 12),
        const Text(
          'One use · Expires in 7 days',
          style: TextStyle(color: Colors.grey),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: busy ? null : create,
          child: const Text('Create invitation'),
        ),
        if (busy || loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: LinearProgressIndicator(),
          ),
        if (error != null) ErrorNotice(message: error!, retry: load),
        if (created != null) ...[
          const SizedBox(height: 24),
          Text(
            'Invitation code',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          SelectableText(created!['invite_code'] ?? created!['token']),
          Wrap(
            spacing: 12,
            children: [
              TextButton.icon(
                onPressed: copy,
                icon: const Icon(Icons.copy),
                label: const Text('Copy code'),
              ),
              TextButton.icon(
                onPressed: draftEmail,
                icon: const Icon(Icons.mail_outline),
                label: const Text('Draft email'),
              ),
            ],
          ),
        ],
        const SizedBox(height: 28),
        Text('Invitations', style: Theme.of(context).textTheme.titleMedium),
        ...invites.map(
          (invite) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(invite['email'] ?? '${invite['role']} invitation'),
            subtitle: Text(
              'Expires ${'${invite['expires_at']}'.split('T').first}',
            ),
            trailing: invite['revoked_at'] != null
                ? const Text('Revoked')
                : TextButton(
                    onPressed: busy ? null : () => revoke(invite),
                    child: const Text('Revoke'),
                  ),
          ),
        ),
      ],
    ),
  );
}
