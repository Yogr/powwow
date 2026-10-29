# Powwow mobile

Flutter 3.44.8 / Dart 3.12.2. Android and iOS use the same FastAPI backend as the web app. Workspace opens organizations and assigned tasks; Chat, Files, and Runs retain the existing model workflows and project image previews. The web app currently has the complete media workspaces.

## Collaboration

- Create an organization, switch organizations, or join by pasting an invitation code or web link.
- Browse organization projects and task boards; create tasks, change their status, and assign a member or yourself.
- Open a task's private conversation. Opening it creates/reuses the caller's chat without submitting a paid model request. Task details remain shared.
- Owners and admins can create single-use invitations with seven-day expiration, optionally restricted to an email address. Copy the code, open an email draft, or revoke an invitation. Opening the email draft does not send it.
- Read shared agent definitions and create an agent. Organization policy controls who can create agents. The interface explicitly marks execution as unavailable; saving a definition does not execute it.
- Sign in or create an account using the shared Supabase authentication service.

All collaboration writes go through the server's membership and role checks. Viewers cannot modify tasks or open a task chat. Invitation tokens appear only when created; they are not persisted by the mobile app. Agent execution, model/MCP policy administration, repository diff review, code execution, mobile asset uploads, universal invite-link app opening, and push notifications remain future native work. Shared agent editing/administration remains on the web.

## Local Android

Start the backend with `scripts/start-local.ps1` from the repository root, then run from this directory:

```powershell
flutter pub get --enforce-lockfile
flutter run -d emulator-5554
```

The default API is `http://10.0.2.2:8000`, the Android emulator's route to the host computer. On launch, the app reads the public `/v1/config` endpoint and initializes Supabase Auth with that backend's URL and public key. Sign in with the same account used on the web. When the configured Supabase URL is loopback and the API uses `10.0.2.2`, Android changes only the authentication transport hostname to `10.0.2.2`; the API continues to validate the server's original JWT issuer. Missing or local-only authentication configuration blocks the workspace. There is no anonymous local account fallback.

The composer defaults to **Let Powwow choose**. It calls `/v1/intent` before creating a project, chat, message, or paid run, then sends the decision ID with the request. Unavailable workflows show a clear message. Image-conditioned workflows currently direct the user to the web app to attach an image; mobile attachment controls are not implemented yet.

The debug manifest allows development HTTP. Release traffic uses HTTPS. For a physical phone or release build, supply the deployed shared API:

```powershell
flutter build apk --release `
  --dart-define=POWWOW_API_URL=https://YOUR_API_DOMAIN
```

Optional `SUPABASE_URL` and `SUPABASE_ANON_KEY` defines override discovery; provide both together. Use a confirmed Supabase user for sign-in. Never put a service role, database password, or Runpod key in these defines. The example application identifiers and debug signing must be replaced before store publication. On an iOS simulator, use `--dart-define=POWWOW_API_URL=http://127.0.0.1:8000` for a backend on that Mac; the Android default address is not an iOS route.

## Validation

```powershell
flutter analyze
flutter test
# Requires the shared authenticated API/worker/Ollama and an Android emulator.
flutter test integration_test/shared_backend_test.dart -d emulator-5554 --dart-define-from-file=local-test-defines.json
flutter build apk --debug
```

Model requests are serialized through the generated Dart contract in `packages/dart-client`. Collaboration uses the same authenticated JSON transport and `/v1/organizations`, `/v1/projects/{id}/tasks`, `/v1/tasks`, and invitation routes. Pending job submissions/retries persist with their request ID so a lost network response can be reconnected safely. Run `scripts/generate-contracts.ps1` from the repository root when the API schema changes.

For the optional live integration test, create the ignored `local-test-defines.json` with `POWWOW_TEST_EMAIL` and `POWWOW_TEST_PASSWORD` for an existing disposable test account. Those credentials are included only in that test build; never ship the file in a release or commit it. The test signs in normally and submits a real model request. Unit/widget tests cover configuration discovery, the Android hostname mapping, blocked unauthenticated access, automatic intent preflight, organization task loading at phone width and double text size, task mutations/private-chat opening, and viewer controls without contacting a live model. Collaboration still needs an emulator/device integration run with the authenticated API; passing unit tests does not establish that result.

An iOS scaffold is included. iOS compilation, signing, and device validation require macOS/Xcode and were not performed on this Windows host. The repository CI includes an optional unsigned iOS simulator build. See the [deployment guide](../../docs/setup/02-accounts-and-deployment.md).
