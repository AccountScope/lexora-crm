# LEXORA Database Schema (Phase 1 MVP)

## 1. Design Goals
- **Deployment parity:** All SQL is Postgres-native (no Supabase-only features) so migrations run on both Supabase DBaaS and self-hosted PostgreSQL.
- **Security-first:** Every record carries a `data_classification` flag (`INTERNAL_ONLY`, `FIRM_CONFIDENTIAL`, `CLIENT_VISIBLE`, `CLIENT_DOWNLOADABLE`, `RESTRICTED`) to support the internal/core vs. external/portal separation.
- **UUID everywhere:** All primary keys are UUIDs generated via `gen_random_uuid()` to avoid predictable sequences in multi-tenant or air-gapped deployments.
- **Soft deletes:** Mutable business objects (users, clients, matters, documents, time entries, invoices) include `deleted_at` for reversible removals. Audit logs remain append-only.
- **Immutability:** `audit_logs` is locked by a trigger to block updates or deletes, preserving forensic fidelity.

## 2. Global Structure
1. **Foundational types & extensions** – enables UUID/CITEXT plus the shared enums for statuses and the classification system.
2. **RBAC core** – `roles`, `permissions`, `role_permissions`, and `user_roles` power a classic RBAC layer compatible with Supabase Auth metadata or self-hosted identity providers.
3. **Operational data** – `users`, `clients`, `matters`, `matter_participants` capture legal work structure.
4. **Evidence vault** – `documents`, `document_versions`, `document_chain_of_custody` implement versioned files with chain-of-custody events and optional client exposure flags for the publish/sync pipeline.
5. **Billing + timekeeping** – `time_entries`, `invoices`, and `invoice_line_items` support billable hours plus fixed-fee items with automatic amount calculations.
6. **Audit plane** – `audit_logs` stores actor, event, and change metadata for every sensitive operation.

## 3. Entity Descriptions & Key Relationships
### Users & Roles
- `users` tracks both internal staff and external client accounts via `user_type`. Status and soft delete flags ensure compliance workflows.
- `user_roles` links users to RBAC roles. Roles bundle granular permissions captured in `permissions` and `role_permissions`.

### Clients
- `clients` stores firm/customer-level profiles with optional linkage to a `primary_contact_id` in `users`. This reflects the dual nature of users (staff vs. client contacts).

### Matters (Cases)
- `matters` belongs to a `client` and can optionally point to a `lead_attorney_id`. `matter_participants` tracks the broader delivery team with labeled roles.

### Documents & Chain of Custody
- `documents` represents the logical artifact (pleading, evidence, etc.).
- `document_versions` holds immutable blobs (bucket + path + checksum) with enforced sequential uniqueness per document and a boolean `available_to_client` flag for the publishing engine.
- `documents.latest_version_id` references the most recent version to avoid expensive joins when rendering UI lists.
- `document_chain_of_custody` records every custody event (upload, transfer, publish) with optional signatures + metadata to satisfy evidentiary standards.

### Time & Billing
- `invoices` capture issued statements with currency + totals. `matter_id` is optional for firm-wide invoices.
- `time_entries` compute `amount` via a generated column (`hours * hourly_rate`) to maintain source-of-truth math across deployments. Entries link to `matters`, `clients`, `users`, and (optionally) `invoices` once billed.
- `invoice_line_items` aggregates time entries or fixed-fee lines per invoice while maintaining their own classification flags.

### Audit Logs
- `audit_logs` persists actor, event, request, and change JSON payloads. A trigger throws on UPDATE/DELETE to keep the table append-only.

## 4. ERD Narrative
```
Users --< user_roles >-- Roles --< role_permissions >-- Permissions
   |                                \
   |                                 \__ (authorizes system capabilities)
   |
Clients --< Matters --< MatterParticipants >-- Users
   |            |
   |            \__ Documents --< DocumentVersions --< DocumentChainOfCustody
   |                           \__ (latest version shortcut on Documents)
   |
   \__ Invoices --< InvoiceLineItems
                \__ TimeEntries (also linking back to Matters & Users)

AuditLogs (actor_user_id -> Users) reference any table via target_table/target_id.
```

## 5. Deployment Notes
- **Supabase:** run migrations via `supabase db push` or `psql` using the provided files. All statements are transaction-wrapped to ensure atomicity.
- **Self-hosted:** execute the same migrations with `psql -f` or your migration runner of choice. No Supabase-proprietary features are used.
- **Storage abstraction:** the schema stores only bucket/path metadata, allowing Supabase Storage or MinIO/S3 backends to coexist.

## 6. Future Extensions
- Add `publishing_jobs` and `quarantine_queue` tables to model the outbound client portal sync described in the MASTER CRM BRIEF.
- Extend `document_chain_of_custody` with cryptographic proof references (e.g., Merkle root, blockchain anchor) if required for high-assurance deployments.
- Introduce partitioning or archival policies for `audit_logs` and `document_chain_of_custody` once data volumes grow.

This schema provides a hardened baseline for Lexora’s internal core while keeping all deployment modes (Supabase SaaS, hybrid, fully air-gapped) in lockstep.
