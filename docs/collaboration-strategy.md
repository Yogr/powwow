# Powwow collaboration direction

Research checked **October 26, 2026** against the first-party pages below. This is a product and architecture proposal, not a claim that integrations, commercial entitlements, or agent parity are implemented. Paid prices are hypotheses for validation. See the implementation report for delivered behavior.

## Position

Build a shared place to assign work, use approved agents, and review the result from a phone or computer. Keep the main loop short: **project → task → private working chat → shared deliverable**. The differentiator to test is approachable collaboration across code, research, images, and 3D, with organization controls and portable model connections. “AI collaboration” alone is already a crowded category.

| Product | Current overlap | Decision for Powwow |
| --- | --- | --- |
| [Taskade](https://www.taskade.com/wiki/projects/collaboration) | Shared workspaces, roles, assignments, comments, human/agent collaboration; [agent teams](https://www.taskade.com/learn/agents/multi-agents) support sequential and orchestrated work. | Closest broad competitor. Make the task and its accepted output the organizing unit. |
| [ClickUp Brain / Super Agents](https://clickup.com/ai-llm-info-page) | Tasks, documents, communication, connected search, agents and MCP. Its [connection guidance](https://help.clickup.com/hc/en-us/articles/36899347371927-Use-Brain-AI-tools-from-personal-connections) explicitly discusses personal data exposure through shared agents. | Keep administration compact; separate sharing an agent from sharing a user's credentials or data. |
| [Linear](https://linear.app/changelog/2026-06-11-coding-sessions) | Cloud coding sessions using Claude Code/Codex, GitHub, reviewable diffs, previews and usage credits. [Third-party agents](https://linear.app/docs/agents-in-linear) can receive delegated issues. | Direct competitor for issue-to-code execution. Phone review needs actual diffs and checks, not only a model summary. |
| [Notion Custom Agents](https://www.notion.com/help/buy-and-track-notion-credits-for-custom-agents) | Agents work against workspace knowledge, with pooled metered credits and usage visibility. | Separate collaboration subscriptions from variable agent execution costs. |
| [Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-studio-experience) | Shared agents, enterprise connectors, lifecycle management, governance and auditing. | Enterprise controls must be enforceable permissions, not prompt instructions. |
| [OpenClaw](https://docs.openclaw.ai/tools) | Extensible tools, plugins, skills, orchestration and scheduled execution; a useful agent-runtime benchmark. | Implement a capability checklist; don't claim compatibility or parity from a shared agent form. |

These are documented capabilities, not hands-on comparative quality or usability scores.

## Organization and privacy contract

- Organization owns projects, shared components, tasks, published assets, agent definitions and policy. Start with owner, admin, member and viewer roles. Only authorized managers change membership, integration policy or budgets.
- Conversations belong to individuals, including conversations about shared tasks. Membership in the same organization must never expose another person's transcript. Admin usage reporting should reveal costs, model, timing and result state without revealing private text.
- A shared agent definition grants no extra access by itself. Each run uses the intersection of the initiating user's rights, organization policy, agent tools and connector scopes. Personal and organization connections need distinct ownership and revocation.
- Show assigned tasks in the left navigation. Opening one shows its description, assignment/status and the current user's chat. Publish a result explicitly into the shared task or project.
- Invitations: copyable expiring link/code, optional email restriction, revocation and acceptance after sign-in. Add native share-sheet/QR presentation and transactional email delivery later; an email draft is not a delivered invitation. Store token hashes, rate-limit acceptance and enforce seat limits transactionally.
- Cloud assets use private object storage, organization/project authorization and short-lived download authorization. Count retained versions, generated files and outstanding reservations toward quotas. Keep local storage optional for personal workflows; a collaborator cannot depend on another member's browser folder.

## Code execution: cloud first, optional local runner

**Recommendation:** use GitHub for repository identity, branches, pull requests and authoritative CI; use an isolated execution provider behind a small Powwow adapter. Customers can connect their own provider account. Retain an optional local/customer-hosted runner for private networks, specialist hardware and existing toolchains.

| Option | What it provides | Recommended use |
| --- | --- | --- |
| [GitHub Codespaces](https://docs.github.com/en/rest/codespaces/codespaces) | APIs to create/start/stop environments; creation supports GitHub App **user** access tokens. [Billing](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces) meters active compute and retained storage; prebuilds also consume Actions minutes. | Customer-owned developer environments and a full browser-editor escape hatch. Validate token support endpoint by endpoint; an installation token is not interchangeable with a user token. |
| [GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use) | Repeatable CI with hosted runners and existing repository checks. | Test/build the exact proposed revision. Keep permissions minimal and secrets out of untrusted code runs. It is not the interactive workspace. |
| [E2B](https://docs.e2b.dev/) | On-demand isolated Linux VMs, templates, command execution and pause/resume. | Candidate for short agent jobs and reproducible test execution. Benchmark startup, large repositories, persistence and actual bills before selection. |
| [Daytona](https://www.daytona.io/docs/en/) | Programmatic sandboxes, files/Git, processes, previews, network controls and bring-your-own compute. | Candidate for longer project sessions and managed previews. Compare with E2B using the same representative projects. |
| Customer runner | Access to the customer's own tools, network and hardware. | Optional signed outbound connection; per-project isolated workspaces, expiring job grants, explicit directories, local kill switch and capped resources. Avoid general remote access to a developer's normal desktop. |

GitHub warns that self-hosted runners can be persistently compromised by untrusted workflow code. An agent-generated patch is also untrusted execution input. Use ephemeral environments, restricted network access and narrowly injected credentials. Model instructions alone do not provide isolation. [GitHub guidance](https://docs.github.com/en/actions/reference/security/secure-use)

Execution contract: capture base commit → create task branch/workspace → reserve AI/compute/storage allowance → run bounded work → save patch, logs, artifacts and provenance → run configured checks → present review → authorized merge. Persist the provider job identifier before polling. Unknown submissions keep reservations and never automatically resubmit. No merge/deployment permission is implied by permission to generate code.

**Phone review:** summary and acceptance checklist first, then changed files, unified diff by hunk, test results and private preview. Support “explain this change,” targeted revision requests, line comments, and small edits. Pin review/checks to the commit; any subsequent edit invalidates old approval. Desktop can add side-by-side diffs and a larger editor. This covers many web/backend tasks without an IDE; device-dependent apps, hardware debugging and platform-specific builds still need appropriate remote or local machines.

## Provider access and subscription economics

Start with server-held organization API connections and separately metered Powwow-funded access. Never place API credentials in browser/mobile configuration. [OpenAI authentication guidance](https://developers.openai.com/api/reference/overview)

Do **not** base pricing on buying one business seat and sharing it behind Powwow. Current OpenAI documentation offers eligible Plus/Pro plan usage through Sign in with ChatGPT for open-source/local apps and selected private clients; paid or remotely hosted apps must request access. It does not establish a general right to pool or resell ChatGPT Business seats. Treat this as an optional partnership track, not a launch dependency. [Quickstart](https://developers.openai.com/siwc/quickstart), [availability and registration](https://developers.openai.com/siwc/token-sharing-open-source)

Claude recommends Console API keys or supported cloud providers for products built for others. Max and Team now have claimable API credits; Team credits pool into a linked Console organization, capped at $500 monthly, with eligibility and expiry rules. Credits can help a customer fund its own connection, but are not unlimited inference or confirmed resale rights. Validate applicable agreements before offering a bundled provider subscription. [Third-party access](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account), [current credits](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans)

Proposed plans, all paid offers **unlaunched**:

| Plan | Price hypothesis | Collaboration/storage | AI and execution |
| --- | --- | --- | --- |
| Free | $0 | 5 members, 3 projects, 3 agents, 500 tasks/project, 500 MiB pooled assets | No recurring free paid inference or compute. A future trial must have a fixed promotional budget. |
| Starter | $12/organization/month | Up to 10 members; 10 GiB pooled storage | Customer-funded API access or prepaid Powwow credits. |
| Team | $12/member/month, 5-seat minimum | 10 GiB/member pooled; organization administration and reporting | Same metering; per-member/project budgets and concurrency controls. |
| Enterprise | Negotiated minimum commitment | Contracted storage, identity, retention, support and deployment requirements | Contracted usage and infrastructure limits. |

The collaboration fee covers ordinary collaborative actions; storage, AI and sandbox capacity remain finite. The draft machine-readable values are in [collaboration-plans.json](../catalog/collaboration-plans.json). They are not active paid entitlements. Existing development AI allowances must not become public free balances.

Use contribution margin, not a flat provider markup:

`minimum revenue = (provider + compute + storage + egress + operations + allocated support/hosting + fixed payment fees) / (1 - percentage payment fees - target margin)`

For illustration only: $10 total variable/allocated cost, $0.30 fixed fees, 3% percentage fees and a 30% target require at least **$15.38** revenue. A 20% cost markup produces only 16.7% margin before other costs. Actual fees, taxes, refunds, mobile-store charges, support demand and failed runs change the result. No plan guarantees every customer is profitable.

Storage is cheap but delivery can dominate: R2 Standard lists $0.015/GB-month plus operations and no Internet egress charge; Supabase Pro lists 100 GB included storage, then $0.0213/GB, and 250 GB uncached egress, then $0.09/GB. Keep the existing Supabase adapter initially, measure downloads, and compare R2 before media scale. [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Supabase pricing](https://supabase.com/pricing)

Before paid launch: settled-payment entitlements; atomic prepaid reservations; organization and provider-wide kill switches; per-run/output limits; invoice reconciliation; quotas for retained files, metadata and downloads; account-farming controls; idempotent billing webhooks; bounded refund/chargeback exposure. BYOK still incurs Powwow orchestration costs. Price AI/compute from a versioned rate card that includes tools and storage, not tokens alone. [OpenAI pricing](https://developers.openai.com/api/docs/pricing)

## Agent capability and delivery sequence

| Capability | Initial foundation / next delivery |
| --- | --- |
| Share agents, instructions, model policy | Organization-owned versioned definitions and permission checks first; publishing does not certify quality. |
| Memory | Shared project facts separate from private user memory, with provenance, deletion and retrieval permissions. [OpenClaw reference](https://docs.openclaw.ai/concepts/memory) |
| Tools, skills, MCP/plugins | Registry, pinned versions, scoped credentials, admin enable/disable, per-run authorization and logs. Preserve existing image/3D specialist routes. [OpenClaw tools](https://docs.openclaw.ai/tools) |
| Schedules, webhooks, reminders | Durable scheduling, timezone, explicit authority, budgets, cancellation and quiet unchanged results. [OpenClaw automation](https://docs.openclaw.ai/automation/cron-jobs) |
| Subagents | Delegation tree, bounded concurrency/depth, shared run budget, cancellation propagation and recorded handoffs. |
| Browser, shell, files | Isolated execution adapters; no broad host access by default. [OpenClaw security guidance](https://docs.openclaw.ai/help/faq/security-and-access-control) |
| Messaging/channels | Optional scoped connectors, verified destinations and send permissions; avoid importing a user's private messages into organization memory. |
| Enterprise | SSO/SCIM, audit export, policy history, retention/legal hold, data residency, customer-hosted runners and validated recovery. These remain separate acceptance gates. |

Delivery order: **(1)** organizations/roles/invites/shared tasks/private chats/web and Flutter surfaces; **(2)** GitHub App, repository browser, diffs and one sandbox adapter; **(3)** funded billing, provider connections, executable agents/MCP and schedules; **(4)** enterprise controls and additional execution providers. Complete tenant/privacy and billing concurrency tests at each step. New or changed AI experiences remain candidates until the [model quality policy](model-quality-policy.md) live evaluation and owner review pass.
