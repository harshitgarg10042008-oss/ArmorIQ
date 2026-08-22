# IntentFence Round 2 Qualification MVP

- [x] Lock the Round 2 MVP acceptance criteria and clearly label simulated versus SDK-ready behavior.
- [x] Complete the polished IntentFence control-center dashboard layout.
- [x] Add responsive behavior for desktop and mobile-sized screens.
- [x] Implement demo controls for starting a run, showing an ArmorIQ hold, approving, and rejecting.
- [x] Add visible evidence of captured intent, allowed tool calls, held action, and audit trail.
- [x] Add accessible interaction states, keyboard focus, and reduced-motion support.
- [x] Update page metadata and brand styling.
- [x] Run the frontend build and type checks.
- [x] Capture representative screenshots for visual verification.
- [x] Write a simple usage guide for the team’s demo recording.
- [ ] Save a final checkpoint and deliver the project version plus usage instructions.
- [x] Add a persistent dark-mode toggle with premium contrast and readable audit states.
- [x] Verify the light and dark dashboard screenshots and demo interactions.
- [x] Inspect the configured GitHub remote and working-tree status.
- [x] Confirm the target repository and changed files.
- [x] Commit and push the completed dashboard changes to the selected GitHub repository under `intentfence-control-center`.
- [x] Report the final GitHub synchronization status.
- [x] Prepare the selected GitHub repository without overwriting its existing README.
- [x] Copy the verified IntentFence frontend and usage files into a dedicated repository directory.
- [x] Commit and push the IntentFence frontend to GitHub.
- [x] Verify the pushed commit and repository contents.
- [x] Move all Microsoft Hack project files from the nested folder to the GitHub repository root.
- [x] Preserve the repository README and remove the extra nested project folder.
- [x] Push and verify the corrected root-level repository structure.
- [x] Redesign light and dark themes so their surfaces, contrast, and accents are clearly different.
- [x] Replace the current yellow-dominant styling with a more refined premium palette.
- [x] Implement working routes/pages for Overview, Live runs, Approval queue, Audit trail, and Intent plans.
- [x] Verify navigation, theme switching, responsive layout, and demo interactions.
- [x] Push the redesign and navigation fixes to the root of the GitHub repository.
- [x] Select and document the stronger ArmorIQ solution name.
- [x] Generate and integrate a distinctive logo mark and favicon-ready asset.
- [x] Verify the new brand across light/dark themes and navigation pages.
- [x] Push the branding update to the root of GitHub.
- [x] Implement Phase 1 agent proof with explicit authorization and hold states.
- [x] Document the Phase 1 SDK-ready mapping and clearly label simulated versus live behavior.
- [x] Verify the Phase 1 evidence path: plan, allowed actions, held action, human decision, audit.
- [ ] Prepare PPT content covering problem, novelty, architecture, workflow, feasibility, and future scope.
- [ ] Prepare and record a concise demo video with a scripted judge-facing narrative.
- [ ] Run a final honesty, UX, build, and submission-readiness review.
- [x] Push the Phase 1 agent proof to the root of GitHub and verify the commit.
- [x] Inspect the shared ArmorIQ reference repository and extract the official integration pattern.
- [x] Add configuration checks for agent URL, policy metadata, approval mode, and delegation amounts.
- [x] Add diagnostics and fallback behavior for registration, policy, approval, and SDK metadata failures.
- [x] Re-test the hardened Phase 1 path and document external ArmorIQ dependencies.
- [x] Push the integration-hardening update to GitHub.
- [x] Fix the Phase 1 agent path construction for Windows and URL-encoded paths.
- [x] Test the corrected agent and generated audit/outbox evidence.
- [x] Push and verify the Windows path fix on GitHub.
- [x] Send exact PowerShell update and run instructions.
- [ ] Confirm Node.js/npm versions and install the organizer-approved ArmorIQ SDK version.
- [ ] Diagnose the npm 11 resolver error without deleting project files.
- [ ] Install `@armoriq/sdk@0.6.10` through a working package-manager path.
- [ ] Verify the SDK package and project lockfile remain healthy.
- [ ] Configure local ArmorIQ credentials without committing secrets.
- [ ] Run the ArmorIQ preflight successfully.
- [ ] Register the agent/MCP and create the default-deny policy.
- [ ] Run one safe live SDK allow/hold test.
- [x] Prepare a separate stateless Vercel agent endpoint without exposing secrets.
- [x] Correct the Vercel Root Directory to `vercel-agent`.
- [x] Remove the incompatible explicit Vercel runtime declaration.
- [x] Push the Vercel configuration fix and verify the commit.
- [ ] Confirm Vercel is connected to the correct GitHub repository and `main` branch.
- [ ] Redeploy the corrected commit `45ea5ae` with Root Directory `vercel-agent`.
- [ ] Verify the new deployment uses the corrected commit and serves `/api/agent`.
- [ ] Configure only the required endpoint environment variables.
- [ ] Redeploy and test `GET /api/agent` and the hold decision endpoint.
- [x] Set Vercel Framework Preset to Other and use `echo "No build required"` as the required no-build command.
- [ ] Redeploy the corrected API-only project.
- [ ] Verify the public `/api/agent` health and hold endpoints.
- [ ] Create a fresh Vercel project connected to `harshitgarg10042008-oss/ArmorIQ` at repository root.
- [ ] Set Framework Preset to Other and the no-build command.
- [x] Capture the final Vercel error lines after dependency installation: stale `outputDirectory` requires missing `dist`.
- [ ] Remove the stale `outputDirectory` from the root Vercel configuration and push the fix.
- [ ] Deploy and verify `/api/agent`.
- [ ] Register the verified endpoint in ArmorIQ.and branch `main`.
- [ ] Verify `vercel-agent` exists at the GitHub `main` root.
- [ ] Correct the Vercel repository, branch, or Root Directory setting based on the verified structure.
- [ ] Set Root Directory to `vercel-agent` and Framework Preset to Other.
- [ ] Set the no-build command and deploy the new API project.
- [x] Add a root-level `/api/agent` endpoint so Vercel needs no Root Directory setting.
- [x] Add root-level API-only Vercel configuration and test it.
- [x] Push the simplified root deployment and send one-step Vercel instructions.
- [ ] Confirm the Vercel project is connected to `harshitgarg10042008-oss/ArmorIQ`, branch `main`, and root directory is the repository root.
- [ ] Deploy fresh from commit `0402ebb` instead of the stale `45ea5ae` deployment.
- [x] Verify the new production domain serves `/api/agent` JSON: `https://pactline-agent.vercel.app/api/agent` returns `status: ok`.
- [x] Register the verified endpoint in ArmorIQ; Pactline appears in the registry with a starter policy attached.
- [x] Run the ArmorIQ security scan; the optional scan returned no findings for the minimal JSON endpoint and can be omitted from the demo.
- [x] Capture evidence of the registered agent and starter policy for the Round 2 demo.
- [ ] Validate one live allow/hold decision path or use the Phase 1 local evidence honestly if live decision APIs are not yet configured.
- [ ] Keep the working API deployment unchanged at `pactline-agent.vercel.app`.
- [ ] Optional: deploy the Pactline frontend publicly as a separate Vercel project using the Vite build; do not block submission on this.
- [ ] Add real ArmorIQ environment variables only if the organizers provide them.
- [x] Freeze the working local dashboard, deployed API, and ArmorIQ registration as the judge-demo baseline.
- [ ] Save a screenshot of the ArmorIQ Pactline details page as registration evidence.
- [ ] Open Pactline Control Center and record the allow/allow/allow/hold/reject workflow using localhost:3000.
- [ ] Describe the integration honestly as ArmorIQ-registered and SDK-ready, not live-enforced.
- [x] Document the distinction between simulated frontend behavior, SDK-ready adapter code, deployed safe-simulation API, and a live SDK connection.
- [x] Replace hardcoded frontend state with API-fetched run, approval, and audit data.
- [ ] Add an animated loading state while fetching the initial run state.
- [x] Fix broken Pactline logo and hero banner asset references in the dashboard.
- [ ] Audit every visible dashboard control for a real action or clear disabled state.
- [ ] Ensure reject and approve update backend state and refresh all views.
- [ ] Remove misleading static metrics, owner labels, and connection claims.
- [ ] Fix the sticky sidebar and scrolling behavior so the user card does not appear detached or misleading.
- [ ] Add a retryable inline error state when the backend fetch fails.
- [ ] Add request-pending feedback and disabled controls for start/approve/reject actions.
- [ ] Wire the real server-side ArmorIQ SDK to the registered Pactline MCP.
- [ ] Add server endpoints for starting runs, reading state, submitting approvals, and reading audit events.
- [ ] Test live behavior with real credentials without exposing secrets.
- [x] Confirm that MCP setup should precede policy setup for the stronger ArmorIQ integration path.
- [ ] Build a real remote Pactline MCP endpoint exposing the four invoice tools.
- [ ] Register the MCP server in ArmorIQ and confirm tool discovery.
- [ ] Create and attach Pactline’s least-privilege policy after MCP discovery.
- [ ] Capture the final audit trail and empty outbox state.
- [ ] Register the verified endpoint in ArmorIQ.
- [ ] Open the active domain plus `/api/agent` and verify Pactline JSON.
- [ ] Register the active endpoint URL in ArmorIQ using Connect by URL.
- [ ] Register the full `/api/agent` URL in ArmorIQ using Connect by URL.
- [ ] Configure live credentials and policy after registration.
- [ ] Run the first safe allow/hold test.
- [ ] Register the endpoint in ArmorIQ using Connect by URL.
- [ ] Configure policy and approval behavior for the live endpoint.
- [x] Implement the minimal Vercel-ready Pactline HTTP agent endpoint.
- [x] Add Vercel configuration and environment-variable documentation.
- [x] Test the endpoint locally and push it to GitHub.
- [x] Send pull and Vercel deployment commands.

## Live ArmorIQ credential setup
- [ ] Obtain the real ArmorIQ API key without sharing it in chat or committing it.
- [ ] Replace `ARMORIQ_API_KEY` locally and validate only its presence, never its value.
- [ ] Add `USER_EMAIL` and confirm the MCP/policy identifiers.
- [ ] Configure the same server-side variables in Vercel after local validation.

## Complete non-hardcoded vertical slice
- [ ] Use a real invoice fixture as the source of tool data.
- [ ] Persist ledger records in SQLite.
- [ ] Route safe test-mail behavior through a controlled outbox or sandbox mailbox.
- [ ] Wire the official ArmorIQ SDK into the server execution path.
- [ ] Persist SDK decision and audit metadata.
- [ ] Make the frontend render only backend-derived run and audit state.
- [ ] Test real allow, hold, reject, and approve paths without exposing credentials.

## Final live verification sequence
- [ ] Pull GitHub commit `b58233a` into the Windows project.
- [ ] Confirm `agent\armoriq-live-test.mjs` exists locally.
- [ ] Confirm `@armoriq/sdk` is installed locally.
- [ ] Load `.env` into the current PowerShell process without printing secrets.
- [ ] Run the sanitized one-action SDK smoke test.
- [ ] Redeploy only after the local smoke test succeeds.

## Complete today
- [ ] Pull and verify the latest implementation on Windows.
- [ ] Run the real ArmorIQ SDK smoke test and resolve any error.
- [ ] Redeploy the latest MCP/run API after live-path validation.
- [ ] Test allow, hold, reject, and approve branches with outbox evidence.
- [ ] Record the one-minute demo.
- [ ] Create and review the maximum-10-slide PPT.
- [ ] Finalize honest claims and submit all required links/files.

## SDK smoke-test correction
- [ ] Align `armoriq-live-test.mjs` imports with the exports in `armoriq-live-adapter.mjs`.
- [ ] Validate the corrected SDK runner and synchronize it to GitHub.
- [ ] Rerun the smoke test with the already configured local credentials.

## Real end-to-end startup
- [ ] Pull GitHub commit `4ba258a` or newer on Windows.
- [ ] Install dependencies and confirm `@armoriq/sdk` is present.
- [ ] Load local server credentials without exposing them.
- [ ] Run the corrected SDK smoke test.
- [ ] Start the backend/MCP runtime and verify real tool calls.
- [ ] Start the frontend against the backend and test approve/reject.
- [ ] Verify ledger, outbox, and audit evidence.

## Deployment versus local frontend
- [ ] Keep `pactline-agent.vercel.app` as the deployed API/MCP backend.
- [ ] Treat any missing frontend Vercel link as stale until a new frontend deployment is verified.
- [ ] Start the Windows frontend locally from the synchronized repository.
- [ ] Verify localhost frontend calls the backend and starts a real run.

## Localhost run and visual repair
- [ ] Diagnose why localhost `/api/run` start returns an error.
- [ ] Make reject visibly resolve the active run and refresh all derived views.
- [ ] Align localhost logo and hero banner asset URLs with the verified design.
- [ ] Re-test idle, start, held, rejected, and approved states.

## Final completion audit
- [ ] Confirm the pushed `main` branch is the source used for the Windows demo checkout.
- [ ] Verify local `.env` values are present only on the demo machine and never committed.
- [ ] Run the real SDK smoke test and capture sanitized success evidence.
- [ ] Run the full local flow: start → three allowed tools → ArmorIQ hold → reject.
- [ ] Run the full local flow: start → three allowed tools → ArmorIQ hold → approve → controlled outbox effect.
- [ ] Verify ledger, outbox, and audit files after both decision branches.
- [ ] Verify the deployed MCP endpoint, tool discovery, and ArmorIQ registration/policy evidence.
- [ ] Decide and document whether the public frontend is needed; do not block the demo if localhost is accepted.
- [ ] Prepare and rehearse the final one-minute demo recording.
- [ ] Create and review a maximum-10-slide Round 2 presentation.
- [ ] Complete final security, honesty, UX, build, and submission-form review.

## Stages 1–3 implementation
- [x] Route the deliberate out-of-scope email proposal through ArmorIQ SDK authorization before showing the hold.
- [x] Persist runs, actions, audit events, approval decisions, ledger records, and outbox state durably.
- [x] Add safe idempotency and restart recovery for run decisions.
- [x] Add invoice input API with validated JSON invoice upload/selection.
- [x] Connect the dashboard invoice input to the real start-run request.
- [ ] Validate allow, hold, reject, approve, persistence, and input-validation paths.
- [ ] Push stages 1–3 implementation to GitHub.

## Phases 4–8 hardening
- [x] Add server-side authentication and role-aware approval authorization.
- [x] Add approval idempotency, decision comments, and immutable decision metadata.
- [ ] Add organization, workspace, user, and run ownership data foundations.
- [x] Replace broad CORS with configured origin validation and add security headers.
- [x] Add request validation, rate limiting, correlation IDs, and safe error responses.
- [x] Make dashboard secondary views backend-derived and add run reset/history controls.
- [ ] Add automated unit/integration tests and CI-ready validation scripts.
- [x] Add structured observability and health/readiness endpoints.
- [x] Add deployment and operations documentation/configuration.
- [ ] Validate phases 4–8 and push changes to GitHub.

## Hardening corrections required before delivery
- [x] Enforce approval authentication unconditionally in production paths and remove spoofable header-only role fallback.
- [x] Persist operator-supplied approval comments and immutable approval records with explicit idempotency handling.
- [ ] Wire organizations, workspaces, members, runs, actions, and audit events into the active backend flow with ownership checks.
- [x] Remove wildcard CORS fallback for non-local deployments and apply consistent route middleware.
- [x] Add schema-based validation for `/api/run` and MCP tool arguments.
- [ ] Add integration tests for run, invoice, MCP, auth, and persistence/restart behavior plus CI configuration.
- [x] Add structured logs/metrics and propagate request IDs into persisted audit events.

## Final hardening corrections
- [x] Derive operator roles only from trusted server-side authentication or token mapping; ignore client role headers in production.
- [x] Make approval records tamper-evident and use the tamper-evident record in the live decision path.
- [x] Add real counters and latency metrics for starts, holds, approvals, rejections, MCP errors, and expose them safely.

## SaaS production completion
- [x] Restore and verify the Pactline logo asset in the actual running dashboard build.
- [x] Build real Settings navigation and workspace configuration view.
- [x] Replace static subpage events, timestamps, plan metadata, and health metrics with API-derived data.
- [ ] Make visible buttons perform real actions or show honest disabled states.
- [x] Add backend-backed workspace settings read/update endpoints with authentication.
- [ ] Add real audit, run-history, and approval data endpoints for the dashboard.
- [ ] Add production-safe authentication redirect, authorization, CORS, validation, and error handling.
- [ ] Add UI tests/integration tests for settings, navigation, run reset, approve, and reject.
- [x] Verify logo, responsive layout, all major routes, and production build.
- [ ] Save checkpoint and synchronize the SaaS completion changes to GitHub.

## Secondary-view data corrections
- [x] Replace static Intent Plans labels, workflow text, status labels, and timestamps with backend values.
- [x] Add a dedicated backend dashboard response for run history, approvals, audit, and intent-plan metadata.
- [ ] Revalidate reset/history and decision branches with refreshed derived views.

## UX, profile, preferences, and reporting
- [x] Add loading skeletons and retryable error states to the Settings page.
- [x] Add loading, empty, and error states to dashboard data and secondary views.
- [x] Add a real profile section with avatar customization and persisted profile data.
- [x] Add persisted notification preferences with accessible toggle controls.
- [x] Add backend-backed CSV export for audit trail and run history.
- [x] Add backend-backed PDF export for audit trail and run history.
- [x] Add export controls to the relevant dashboard views with loading/error feedback.
- [ ] Add tests for profile, notification preferences, exports, loading, and error states.
- [ ] Verify visuals, TypeScript, tests, production build, checkpoint, and GitHub synchronization.

## Settings authorization correction
- [x] Allow authenticated operators to update their own profile and notification preferences without requiring approver role.
- [x] Keep workspace boundary settings restricted to the appropriate workspace role.
- [x] Re-test profile, notification, and export authorization behavior.

## Windows local startup repair
- [x] Prevent the Vite frontend from serving before the local API is ready.
- [x] Remove the child-process shell warning from the development launcher.
- [x] Avoid malformed analytics script requests when optional analytics variables are absent.
- [x] Validate `pnpm dev` startup and `/api/run` reachability on the local stack.
- [ ] Save checkpoint and synchronize the Windows startup fix.

## Settings localhost authorization bug
- [x] Diagnose the localhost `/api/profile` 403 shown when saving profile settings.
- [x] Apply a secure local-development-compatible authorization fix without weakening production authorization.
- [x] Add or update a regression test for profile read/update authorization.
- [ ] Validate profile save and reload from the localhost Settings page.
- [ ] Save checkpoint and synchronize the fix to GitHub.

## Current architecture audit
- [x] Audit the frontend, backend, ArmorIQ SDK adapter, MCP surface, and durable storage boundaries.
- [x] Verify the latest GitHub `main` commit and key integration files.
- [x] Create the current architecture and honest integration-status report.
- [x] Create and render the end-to-end Pactline architecture flowchart.
- [x] Save checkpoint and synchronize the architecture files to GitHub.

## Complete local authentication repair
- [x] Audit the 403 run failure and missing-session behavior across local frontend and API.
- [x] Implement explicit secure local demo authentication behavior without weakening production authorization.
- [x] Remove the missing favicon browser error.
- [x] Add regression coverage for local run authorization and origin handling.
- [ ] Validate start, hold, reject, approve, and outbox behavior locally.
- [ ] Save checkpoint and synchronize the complete auth repair to GitHub.

## Simplified local demo and Settings redesign
- [x] Make `pnpm dev` the only required local startup command after one-time `.env` setup.
- [x] Make local demo operator authorization explicit and prevent localhost OAuth/session failures.
- [x] Remove the localhost origin 403 for all dashboard API requests.
- [x] Add the missing favicon and remove avoidable browser console errors.
- [x] Redesign Settings page with premium Pactline hierarchy, cards, status indicators, and responsive layout.
- [x] Preserve backend-backed profile, notification, and workspace persistence in the redesigned Settings page.
- [x] Add tests for local auth mode and Settings persistence paths.
- [ ] Verify the complete dashboard run flow and Settings interactions.
- [ ] Save checkpoint and synchronize all changes to GitHub.
