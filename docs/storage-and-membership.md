# Storage, settings, and desktop installation

Settings opens from the account menu. General controls the app-language preference and installation. Storage selects a local folder or Powwow Cloud. Subscription and Upgrade your storage are the only product screens that display plan prices.

## What works now

- Account preferences are saved by `GET/PATCH /v1/account/preferences`. App language supplies language-learning defaults; some interface text remains English.
- **New project** opens a compact Project Name dialog with Local and Cloud choices. Local is selected by default when the secure top-level browser supports a directory picker; otherwise only Cloud is shown. Creating a local project opens the browser folder picker if a permitted folder is not already connected. Each project persists its own storage mode; older projects inherit the account default.
- File actions require a usable storage choice. The server independently rejects uploads and media generation while storage is unselected. Existing chats, project metadata, and text replies remain available.
- Cloud mode retains uploaded and generated files in the account's private server storage. The current free quota is **500 MiB** (524,288,000 bytes), with server-side usage enforcement. A single admission can cross the allowance by at most 5%, capped at 25 MiB; once used and reserved capacity reaches the nominal allowance, further cloud file requests are rejected. Reservations share the same cap under the account lock. Already-admitted runs may finish within the hard cap. Rejections open Upgrade your storage; existing files, text chats, and project metadata stay available. The Storage screen reads its allowance from the API.
- Local mode writes original files to a folder the user selects. Writes finish and are read back before SHA-256 and size are verified. Only then does the browser send `/v1/artifacts/{id}/local-save` with the verified hash and size.
- A local file receipt belongs to the signed-in account and device. A receipt from another device never substitutes for a local copy. Reads verify the file again, so later edits are not silently presented as the original artifact.
- Local files stay temporarily available on the server for **24 hours from creation**, even after a save receipt. The backend then expires the temporary content; artifact metadata remains. A verified local original can still be previewed or downloaded, and can be uploaded again for another AI operation.

Project details and conversations remain in Powwow's online database in both modes. Local mode is not a local-only database or an offline AI feature. Project metadata is copied to `.powwow/project.json` while the workspace is open; the explicit project export also gathers conversation messages. The exports are readable JSON; importing a complete workspace backup is not implemented.

Local files use this layout beneath the chosen folder:

```text
.powwow/project.json
.powwow/project-memory.md
src/assets/images/<filename>
src/assets/models/<filename>
src/assets/videos/<filename>
src/assets/audio/<filename>
src/assets/documents/<filename>
src/assets/fonts/<filename>
src/assets/other/<filename>
```

The selected folder is the project root; no account hash, project ID, or artifact ID is added to its visible asset paths. Folder connections and receipts remain scoped to the account and project in browser IndexedDB. The `.powwow/project.json` ownership fields prevent another project from replacing the same folder's settings. A filename collision with different content gets a numeric suffix, such as `hero (2).png`; existing files and edits are preserved. Identical verified content can reuse its existing filename. Powwow serializes filesystem writes across its browser tabs.

When the project is opened, previously saved files are verified and copied from the old `Powwow/.../files` layout into the new media folders. This also works after server staging expires. A receipt switches to the new path only after the new copy is verified; old files are retained. Choosing another project folder similarly copies verified originals while the project is open, without deleting the previous copies. Clearing browser site data loses the folder connections and receipts but does not delete disk files. Background saving requires the app to remain open and folder permission to remain granted; a previously unsaved file must still be available on the server.

## Browser behavior

Chrome and Edge support the folder picker used here. The picker requires a secure context and a user action. Reconnecting a folder is an explicit click; background checks only inspect existing permission. Browsers can require permission again after reopening the app. See [MDN's directory-picker documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) and [Chrome's File System Access guide](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

Browsers without a directory picker offer Cloud for new projects. They show current cloud usage and an upgrade option on the free tier or near the limit. File downloads remain available, but are not advertised as automatic Local storage. Existing download-mode records remain readable; new file operations require choosing Cloud or connecting a supported folder.

## Desktop installation

The production web build includes an install manifest, 192/512-pixel icons, and a service worker. Chrome and Edge can offer installation when their criteria are met. Settings shows an install button when the browser provides an install event. Safari on macOS Sonoma 14 or later supports **File → Add to Dock**. An installed app is detected through the standalone display mode. Local remains the default where folder access works. Choosing Cloud in the installed app also connects a local folder; uploaded/generated files remain permanent in the cloud and verified copies download to that folder while the app is open. Metadata exports are also saved locally. External edits to local files are not automatically uploaded, and offline/bidirectional conflict resolution is not implemented. These are installed web apps; signed Windows/macOS native installers have not been built. See [MDN's installability guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) and [Apple's web-app instructions](https://support.apple.com/en-us/104996).

The production deployment needs HTTPS and the root public assets. Localhost is a secure development exception. Development builds skip automatic service-worker registration so Vite updates remain immediate. The service worker caches only the public offline page, manifest, and two icons. It does not cache account API responses, project content, generated files, or application HTML sessions. Offline navigation shows reconnect guidance; AI and synced projects need a connection.

## Membership and cloud proposal

The Subscription screen shows Free, a planned **$20/month Powwow** subscription, and a proposed **+$10/month Cloud add-on with 100 GB**. Checkout is disabled. There is no payment provider, subscription activation, invoice workflow, or paid storage entitlement. The current quota remains in effect, and plan fields cannot be changed through the preferences endpoint.

Pricing research checked October 3, 2026:

| Provider | Published storage economics | Implication |
| --- | --- | --- |
| Cloudflare R2 Standard | $0.015/GB-month, $4.50/million Class A requests, $0.36/million Class B requests, no Internet egress charge | 100 GB stored for a month costs about $1.50 before free allowances and operation costs. [Official pricing](https://developers.cloudflare.com/r2/pricing/) |
| Supabase Pro | Starts at $25/month; 100 GB storage included, then $0.0213/GB; 250 GB uncached egress included, then $0.09/GB | Existing Supabase deployment is the simpler initial path, but shared allowances and download traffic affect costs. [Official pricing](https://supabase.com/pricing) |

The proposed $10 add-on leaves room above raw object storage for operations, application hosting, support, and payment costs. This is a planning estimate, not a measured margin. AI inference needs its own usage economics. R2 has not been integrated; switching providers requires an implementation and migration plan. Confirm billing, entitlements, retention, and measured traffic before offering a paid plan.

## Verification

`node apps/web/scripts/local-files-layout-qa.mjs` checks the standard media folders, descriptive filenames, concurrent filename collisions, user-edit preservation, verified receipts, safe legacy migration, account/project isolation, and the actual persistence hook migrating expired assets without a network request. The test uses isolated browser filesystem handles and never touches user folders. Its report is saved in `evals/reports/local-files-layout/report.json`.

`node apps/web/scripts/account-settings-qa.mjs` uses isolated account/API fixtures and real browser origin-private directory handles; it never touches user-selected folders. It checks folder persistence, account isolation, verified writes and reads, edited-file detection, permission recovery, explicit downloads, the React save hook and receipt contract, responsive settings, disabled billing, and public-only service-worker caching. The current run has 15 passing checks with screenshots in `evals/reports/account-settings/`.

The local test runner uses installed Edge because the bundled headless Chromium crashed when reopening serialized file handles on this Windows host. Native folder-picker prompts, operating-system installation UI, and Safari's Add to Dock still require manual testing on their target systems. The web production build passes.

## Configuration and regression checks

`CLOUD_STORAGE_GRACE_PERCENT` defaults to 5 and `CLOUD_STORAGE_GRACE_MAX_BYTES` to 26,214,400. The server returns the computed grace and full status with account preferences. Project create/patch accepts `storage_mode: "local" | "cloud"`; null on existing rows means inherit. Switching a choice controls new files and does not move or reclassify existing artifacts.

`node apps/web/scripts/project-storage-qa.mjs` covers compact creation, actual browser folder-handle persistence using a QA-only filesystem, canceled permission selection, per-project requests, Cloud-only fallback, the upgrade path, installed-app behavior, six restored creation shortcuts, and the narrow layout. PostgreSQL tests cover the grace boundary, repeated rejections, simultaneous crossing attempts, per-project routing, and additive migration.
