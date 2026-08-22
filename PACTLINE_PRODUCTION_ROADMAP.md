# Pactline Production Roadmap

## Purpose

Pactline currently demonstrates the core ArmorIQ promise: an invoice agent can execute routine work autonomously and pause before a side effect when the action leaves its captured intent. This roadmap converts that hackathon-ready vertical slice into a production SaaS platform in controlled, verifiable phases.

## Delivery method

Each phase follows the same gate: implement one capability, add or update tests, run type-check and production build validation, save a recoverable checkpoint, synchronize the phase to GitHub, and then provide the user with one precise local verification step. No phase is considered complete merely because its interface exists.

## Stable baseline

The current baseline includes the React/Tailwind control center, the local Express API, ArmorIQ SDK v0.6.10 integration, the `pactline-invoice` MCP surface, captured intent and intent-token flow, human approval and rejection, durable JSON run evidence, Settings persistence, exports, local demo authorization, and separated Approval queue, Intent plans, and Audit trail views.

## Current implementation status

**Overall production completion estimate: approximately 65%.** The hackathon-critical control loop is complete; approximately 35% remains for PDF/image extraction, full relational ownership, organization/team administration, real external integrations, and enterprise operations.

| Roadmap area | Status | What is implemented now |
|---|---|---|
| Database-backed runtime | **Complete for run snapshots** | Active run snapshots use the managed MySQL table when `DATABASE_URL` is available, with a safe JSON fallback for local machines without a database. |
| Structured invoice intake | **Complete** | JSON invoices can be uploaded, validated, registered, stored in managed storage when available, and used as protected-run inputs. |
| PDF/image extraction | **Pending** | Storage and metadata foundations exist, but OCR and document extraction are not yet implemented. |
| Organizations and approvals | **Pending** | Basic operator authorization and approve/reject behavior exist; multi-user organizations, invitations, assignment, and escalation remain. |
| Real integrations and effects | **Pending** | The approved effect is still a controlled test outbox, not external email/ERP delivery. |
| Operations and enterprise readiness | **Pending** | Monitoring, backups, recovery, key rotation, load tests, and production runbooks remain. |

## Phase 1 — Database-backed runtime

Replace active JSON runtime ownership with Drizzle/MySQL tables for organizations, users, invoices, runs, actions, intent evidence, approvals, settings, and side-effect records. The first implementation slice is complete for active run snapshots: the database migration exists, the managed table is applied, and the active run lifecycle uses it when a database connection is available. Full relational ownership for every domain record remains part of the later hardening work.

## Phase 2 — Real invoice intake

The structured-upload slice is complete: the dashboard sends a JSON invoice and its original document bytes to the backend, the backend validates and stores the document when managed storage is available, and the resulting invoice becomes the next protected-run input. The remaining Phase 2 work is secure PDF/image extraction, tax/date/line-item parsing, ambiguity handling, and duplicate detection. Acceptance requires a user-uploaded document to become the input to a real run and requires invalid or ambiguous documents to stop safely for review.

## Phase 3 — Organizations and approvals

Add organization creation, invitations, workspace membership, owner/operator/approver/viewer roles, approval assignment, comments, escalation, deadlines, and decision history. Acceptance requires authorization to be checked server-side and approval actions to be visible only to eligible operators.

## Phase 4 — Real integrations and safe effects

Add configurable integrations for email, accounting, ERP, procurement, and webhooks. Implement idempotency, retries, delivery status, dead-letter handling, token expiry recovery, and explicit confirmation for consequential actions. Acceptance requires a failed provider call to avoid duplicate effects and leave complete evidence.

## Phase 5 — Operations and enterprise readiness

Add structured production logs, monitoring, alerts, backups, restore procedures, key rotation, staging and production configuration, threat modeling, load tests, browser integration tests, accessibility review, onboarding, documentation, and deployment runbooks. Acceptance requires repeatable deployment and recovery procedures with security-sensitive data excluded from logs.

## What the user does after each checkpoint

The user pulls the phase commit, runs the documented local command, performs the single requested verification flow, and reports the result without sharing secrets. If the verification fails, the failure is fixed before the next phase begins.
