# Deployment Modes

LEXORA ships with two fully supported deployment tracks. Both modes share a single codebase, guarded behind deployment-aware adapters.

## 1. Fast Path (Supabase + Vercel)
Designed for rapid delivery and minimal DevOps overhead.

### Steps
1. **Environment**
   - Set `DEPLOYMENT_MODE=supabase` in Vercel project settings.
   - Provide Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
2. **Adapters**
   - Auth: Supabase Auth (OAuth + magic links).
   - Database: Supabase-hosted Postgres via Prisma/Drizzle connection string.
   - Storage: Supabase Storage bucket (`SUPABASE_STORAGE_BUCKET`).
3. **CI/CD**
   - Vercel Git integration builds on push to `main`.
   - Supabase migrations applied via GitHub Action or `supabase db push` job.
4. **Observability**
   - Use Vercel + Supabase dashboards.

## 2. Air-Gapped Mode (Docker Self-Hosted)
Tailored for regulated enterprises that require on-prem or isolated cloud deployments.

### Steps
1. **Clone Repository & Copy Env**
   - `cp .env.example .env`
   - Set `DEPLOYMENT_MODE=self_hosted` and populate `DB_*`, `MINIO_*`, and `AUTH_*` secrets.
2. **Bring Up Stack**
   - `docker compose up -d --build`
   - Services: `web`, `postgres`, `minio`.
3. **Migrations**
   - Run `docker compose exec web pnpm prisma migrate deploy` (or equivalent) against the internal Postgres service.
4. **Storage Prep**
   - Create bucket via `mc mb minio/case-files`.
5. **Auth Provider**
   - Use built-in JWT signer (keys from `.env`) or integrate with customer IdP by swapping adapter implementation.
6. **Networking**
   - Terminate TLS at client-managed reverse proxy. Point proxy to `web:3000` within the cluster.

## 3. Mode Switching Checklist
| Step | Fast Path → Self-Hosted | Self-Hosted → Fast Path |
|------|-------------------------|-------------------------|
| Configuration | Flip `DEPLOYMENT_MODE`, update env groups. | Flip back and remove self-hosted secrets. |
| Database | Export Supabase dump, import into Postgres container. | Point Prisma connection string to Supabase. |
| Storage | Sync Supabase bucket to MinIO (`mc mirror`). | Upload MinIO objects to Supabase bucket. |
| Auth | Enable custom JWT adapter, migrate users. | Re-enable Supabase Auth adapter, invalidate custom tokens. |
| Testing | Run integration suite against target mode. | Same |
| Rollout | Deploy Compose stack or Vercel project. | Deploy Vercel build. |

## 4. Automation Hooks
- Scripts can read `DEPLOYMENT_MODE` to select Terraform/Vercel/Compose workflows.
- Future enhancement: `./scripts/switch-mode.sh supabase|self_hosted` to validate env files and adapters automatically.

Keep `ARCHITECTURE.md` as the canonical reference for adapter contracts. This document focuses on the operational steps required to move between modes.
