# Collaboration implementation — October 26, 2026

This is the first working implementation of the collaboration pivot, not a public
launch or a claim of OpenClaw feature parity. The [strategy and source research](collaboration-strategy.md)
records competitor positioning, cloud execution choices and proposed economics.

## Implemented

| Area | Behavior |
| --- | --- |
| Organizations | Create/select organizations; owner, admin, member and viewer roles; member management and display names. Existing personal projects are retained. |
| Invitations | Expiring, use-limited, revocable codes and links; optional email restriction; web clipboard/native sharing and email drafts. Invitation secrets are hashed server-side and returned on creation. No email delivery service is claimed. |
| Shared projects | Organization projects use cloud storage. Members see shared project components and tasks. Viewer writes are rejected server-side. |
| Tasks | Separate persisted shared task records with title, description, status and member assignment; self-assignment; assigned tasks in left navigation; four-column board that stacks on phones. |
| Private work | Opening a task creates/reopens a private per-user task chat through the existing AI run pipeline. Current task text enters that user's context. Project membership does not reveal another member's chat history. Viewers can inspect tasks without creating a chat. |
| Agents and access | Shared agent definitions, creator/admin edit rules, organization model allowlist and MCP policy IDs. Model access is checked on submission and again at queued execution stages. **Agent runtime and MCP execution are not connected.** |
| Limits and usage | Free organization limits: 5 members, 3 projects, 3 agents, 500 tasks/project, 500 MiB project assets; up to 3 owned free organizations. Admin usage includes counts/storage/AI recorded cost and reservations, without private transcripts. Existing account AI budget/idempotency protections remain. |
| Code review | Import source files/folders or unified patches; file tree/filter, old/new line numbers, wrapped diffs, review markers, editable drafts and downloads. Browser-local state survives app navigation but clears on reload/sign-out. No repository writes, GitHub authentication or code execution. |
| Flutter | Collaboration home, organization create/join/switch, assigned tasks, task board/details/status/assignment/private chat, people/invites, shared agent definitions, account sign-up. Existing chats, files, runs and creative capabilities remain available. |
| Contracts | OpenAPI, TypeScript and Dart clients regenerated together. |

The new organization task board is separate from the earlier AI blueprint roadmap.
Old project data is not automatically reassigned, shared or deleted. Automated
roadmap-to-assigned-task synchronization remains to be designed.

## Verification

Latest local results: **305 API tests passed, 5 skipped; 13 collaboration browser
check groups passed; 10 code-review check groups passed; 13 Flutter tests passed;
Flutter analysis clean; web production build and Android debug APK build passed.**
The API run used a disposable SQLite database. PostgreSQL concurrency and a live
authenticated multi-user device session remain release checks.

- API integration tests exercise organization boundaries, viewer/admin behavior,
  invite expiry/reuse/revocation/email restrictions, quotas, per-user component/task
  chats, shared/private assets and model policy. See `apps/api/tests/test_collaboration.py`.
- Browser fixture checks exercise the actual app at desktop and 390px phone sizes;
  reports and screenshots are in `evals/reports/collaboration/`.
- Code review parser/browser checks include mobile widths of 390px and 320px;
  evidence is in `evals/reports/code-review/`.
- Flutter analysis, widget/unit tests and Android debug compilation are run locally.
  Native device usability, notification delivery and iOS compilation are not verified.
- These checks do not establish live AI quality, commercial entitlements, production
  multi-region behavior or profitability. No paid inference or cloud resources were
  created for this implementation. The revised task context remains a candidate
  under the [model quality policy](model-quality-policy.md).

## Remaining release work

1. GitHub App installation/OAuth and scoped repository access, live tree/blob/diff
   views, branch/PR creation, reviews and checks. Bind reviews and edits to exact
   base/head revisions; invalidate approval when the head changes.
2. One isolated execution provider with time/CPU/memory/network limits, ephemeral
   credentials, artifact/log capture, previews, cancellation and verified cost.
   Use a customer-owned cloud sandbox first; optional outbound local runner later.
3. Server-held organization provider connections and secrets lifecycle, supported
   provider account authorization, agent execution/versioning, tools/MCP registry,
   schedules, webhooks, subagents and audit trails. Retain evaluated specialist workflows.
4. Payment-backed entitlements, funded AI/compute allowances, invoice reconciliation,
   organization/provider-wide spending limits, rate limits and abuse controls.
   Paid plan proposals are in `catalog/collaboration-plans.json` and are not active.
   Development account allowances must not be marketed as free inference credits.
5. Production database migration rehearsal/backups, concurrent quota tests on
   PostgreSQL, object-storage policies/retention/egress accounting, realtime updates,
   comments/activity/notifications and recoverable conflict handling.
6. Enterprise SSO/SCIM, custom roles, policy history, audit export, retention/data
   residency, customer infrastructure and operational recovery acceptance.

The free collaboration limits are real server checks; they are not evidence that
the current development deployment is safe or economical to offer publicly.

## Run checks

```powershell
npm --prefix apps/web run build
node apps/web/scripts/collaboration-qa.mjs
node apps/web/scripts/code-review-qa.mjs
# See apps/api/README.md and apps/mobile/README.md for environment-specific commands.
./scripts/generate-contracts.ps1
```

The browser checks use isolated fixtures and require the Vite preview to be running.
The native Android debug artifact is at
`apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`; it is a development build,
not a signed store release. Production API access and provider credentials remain
server configuration; do not embed those credentials in web or mobile builds.
