# Lexora OS — Enterprise Legal CRM

Lexora is a secure legal operating system that combines case management, an evidentiary document vault, and a hardened client portal. This repository contains the Next.js 15 application, storage abstraction, and API surfaces required for Phase 1 of the build.

## Tech Stack

- **Next.js 15 (App Router)** with TypeScript and Tailwind CSS
- **Shadcn UI** components + Radix Primitives
- **React Query** for client data synchronization
- **Zod** for runtime validation
- **PostgreSQL** (Supabase SaaS or self-hosted) accessed through the shared `lib/api/db.ts`
- **Supabase Auth / Custom JWT** via `lib/auth`
- **Storage abstraction** for Supabase Storage (phase 1) and MinIO/S3 (phase 2)

## Project Structure

```
lexora/
├─ app/                 # App Router routes, layouts, API handlers
├─ components/          # Reusable UI + feature modules
├─ lib/
│  ├─ api/              # Database + domain logic (cases, documents, portal)
│  ├─ auth/             # Prebuilt authentication providers (Supabase & JWT)
│  ├─ storage/          # Storage adapters + checksum utilities
│  ├─ rbac/, audit/     # Enforcement + logging (already provided)
├─ database/            # Canonical schema + migrations
├─ types/               # Shared domain types
├─ middleware.ts        # /api middleware enforcing auth + RBAC
└─ ...config files      # next.config.js, tailwind.config.ts, tsconfig.json, etc.
```

## Getting Started

```bash
cd lexora
npm install
npm run dev
```

### Required Environment

Create `.env.local` (Vercel) or `.env` (Docker) with the following variables:

```bash
# Deployment mode controls adapters (supabase | self_hosted)
DEPLOYMENT_MODE=supabase

# Database
SUPABASE_DB_URL="postgresql://..."      # Required in supabase mode
SELF_HOSTED_DATABASE_URL="postgresql://..."  # Required in self-hosted mode
DB_POOL_SIZE=10

# Auth (provided via lib/auth)
LEXORA_AUTH_MODE=supabase                # or jwt
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...                    # optional but recommended

# Storage abstraction
LEXORA_STORAGE_MODE=supabase             # or minio
SUPABASE_STORAGE_BUCKET=lexora-documents
# MinIO mode
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=secret
MINIO_BUCKET=lexora-documents
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=https://files.example.com   # optional, for signed link translation
```

> **Tip:** set `NEXT_PUBLIC_DEPLOYMENT_MODE` if you want the active mode surfaced in the sidebar UI.

### Database

Use the canonical SQL in `database/schema.sql` (or the per-object migrations in `database/migrations/`) to provision your Postgres instance. The application reads and writes through parameterized SQL so it stays compatible with both Supabase-hosted Postgres and self-hosted clusters.

- `lib/api/cases.ts` → case CRUD, timeline assembly, notes, and team assignments
- `lib/api/documents.ts` → document vault CRUD, upload → chain-of-custody logging
- `lib/api/portal.ts` → client-facing projections (approved updates, secure messaging)

### Storage

`lib/storage/` exposes a `storageAdapter` selected via `LEXORA_STORAGE_MODE`:

| Mode      | Adapter                         | Requirements |
|-----------|----------------------------------|--------------|
| supabase  | Supabase Storage via service key | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| minio     | MinIO/S3 via AWS SDK            | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` |

Every upload automatically:

1. Streams file bytes through the adapter
2. Calculates a SHA-256 checksum
3. Inserts `documents` + `document_versions` rows
4. Appends a `document_chain_of_custody` event with metadata + hash verification

### Auth & RBAC

Middleware and helpers in `lib/auth` are already wired into the API routes. Configure auth mode through `LEXORA_AUTH_MODE` (`supabase` or `jwt`). RBAC policies live in `lib/rbac/policies.ts` and currently cover:

- `/api/cases/*` → paralegal+
- `/api/billing/*` → lawyer+
- `/api/portal/*` → client

### Client Portal Skeleton

The `/portal` route renders the client-facing experience:

- Assigned cases with status + recent updates
- Document list filtered to `CLIENT_VISIBLE` / `CLIENT_DOWNLOADABLE`
- Basic messaging queue (writes stored as `documents` with `document_type = 'PORTAL_MESSAGE'`)

Client-to-firm messages are stored as `RESTRICTED` until an internal reviewer promotes them for internal use, aligning with the quarantine-first requirement.

## Scripts

| Script        | Description                              |
|---------------|------------------------------------------|
| `npm run dev` | Next.js dev server w/ hot reload          |
| `npm run build` | Production build                         |
| `npm run start` | Start compiled app                       |
| `npm run lint`  | ESLint (Next config)                     |
| `npm run typecheck` | TypeScript diagnostics               |

## Next Steps

- Implement the publishing engine + quarantine queue tables referenced in `database/SCHEMA.md`
- Connect the client messaging API to the approval workflow described in the master brief
- Add role-aware UI (admin vs. lawyer vs. client) and surface the RBAC permissions visually
- Expand analytics panels (case KPIs, billing dashboards) once data stabilizes

---
Need help wiring a new adapter or deployment target? See `ARCHITECTURE.md` for the platform blueprint or open an issue with the environment details.
