# LEXORA Platform Architecture

## 1. Executive Summary
LEXORA is an enterprise legal CRM optimized for highly regulated firms. The platform must ship quickly via a managed Supabase + Vercel stack ("Fast Path") while remaining portable to an air-gapped, self-hosted Docker deployment ("Air-Gapped Mode"). The core principle is to isolate all external dependencies behind swappable interfaces so that application code remains deployment-agnostic.

```
          ┌─────────────┐      ┌──────────────────────┐
          │ Next.js API │──────│  Platform Interfaces │──────┐
          └─────────────┘      └──────────────────────┘      │
                             Auth / DB / Storage facades     │
                                                               │
         ┌───────────────┐                         ┌───────────┴───────────┐
         │ Supabase SaaS │                         │ Self-Hosted Services │
         └───────────────┘                         └──────────────────────┘
```

## 2. Deployment Modes
- **Phase 1 – Fast Path**: Next.js hosted on Vercel, Supabase provides Auth, Postgres, and Storage. Minimal infra ownership, fastest iteration.
- **Phase 2 – Air-Gapped Mode**: Next.js deployed via Docker Compose alongside PostgreSQL and MinIO. Custom JWT issuer replaces Supabase Auth (optional, depending on client IdP). No outbound calls; designed for secure networks.

`DEPLOYMENT_MODE` governs runtime behavior (`supabase` or `self_hosted`). All configuration is injected via environment variables grouped by interface layer.

## 3. Abstraction Layers & Interfaces
Each layer exposes a narrow contract implemented by adapters per deployment mode. Interfaces live in `/lib/platform/interfaces`.

### 3.1 Auth Interface
```ts
export interface AuthAdapter {
  verifyToken(token: string): Promise<AuthContext>;
  issueToken?(claims: AuthClaims, options?: IssueOptions): Promise<string>;
  getUser(userId: string): Promise<UserProfile>;
}
```

- **Supabase Adapter**: wraps `@supabase/auth-helpers-nextjs`. Uses Supabase JWT verification endpoint and user management APIs.
- **Custom JWT Adapter**: uses internal signing key pair (HS256 default, configurable) and optional OIDC federation for enterprise IdPs.

### 3.2 Database Interface
```ts
export interface DatabaseAdapter {
  getClient(): Promise<Pool | SupabaseClient>;
  runInTransaction<T>(fn: (client: TxClient) => Promise<T>): Promise<T>;
  healthCheck(): Promise<HealthStatus>;
}
```

- **Supabase Adapter**: uses Supabase TypeScript client for PostgREST RPC + direct SQL via `pg` over Supabase pooled connection string.
- **Self-Hosted Adapter**: connects directly to PostgreSQL (managed by Compose) via `pg` Pool. Migrations handled by Prisma or Drizzle, abstracted so both modes share the same schema migrations.

### 3.3 Storage Interface
```ts
export interface StorageAdapter {
  upload(objectPath: string, data: Buffer, options?: UploadOptions): Promise<void>;
  getSignedUrl(objectPath: string, expiresIn: number): Promise<string>;
  delete(objectPath: string): Promise<void>;
}
```

- **Supabase Storage Adapter**: wraps Supabase Storage buckets.
- **MinIO Adapter**: uses S3-compatible SDK with MinIO endpoint + static credentials from env.

Adapters are resolved by a `PlatformProvider` factory based on `DEPLOYMENT_MODE`. This factory is the single entry point used by API handlers and background jobs.

## 4. Service Topology
### Fast Path (Supabase/Vercel)
- Vercel-hosted Next.js (Edge + Node runtimes)
- Supabase project (Auth, Postgres, Storage)
- Optional Vercel KV / Edge Config for caching (out of scope for self-hosted parity)

### Air-Gapped Mode (Docker Compose)
- Next.js app container (`web`)
- PostgreSQL (`postgres`) with WAL-G (optional) or encrypted volume
- MinIO (`minio`) for object storage
- Optional Traefik / NGINX reverse proxy managed by the client's infra (not bundled)
- Custom Auth service (can be part of `web` or separate microservice)

## 5. Configuration & Environment Management
Environment variables are namespaced per interface:
- `AUTH_*`
- `DB_*`
- `STORAGE_*`
- `SUPABASE_*`
- `SELF_HOSTED_*`

`.env.example` documents both modes and highlights mutually exclusive settings. The app loads shared variables first (e.g., `NEXT_PUBLIC_APP_URL`, `DEPLOYMENT_MODE`), then adapter-specific ones.

## 6. Observability & Resilience
- Health endpoints (`/api/health`) invoke each adapter’s `healthCheck`.
- Structured logging with mode tags (`mode=supabase|self_hosted`).
- Metrics exporters (Prometheus-compatible) enabled in Docker mode.
- Graceful degradation: if Storage adapter is unavailable, uploads queue locally; tasks retry with exponential backoff.

## 7. Migration Strategy (Supabase → Self-Hosted)
1. **Schema Parity**: Maintain migrations in repo (Prisma/Drizzle). Run `supabase db diff` during Fast Path for validation, but canonical migrations live in version control.
2. **Data Export**:
   - Use `supabase db dump --data-only` to export relational data.
   - Download Supabase Storage buckets via `supabase storage list` + `supabase storage download`.
3. **Import to Self-Hosted**:
   - Restore SQL dump into self-hosted Postgres (`psql -f dump.sql`).
   - Sync Storage objects into MinIO via `mc mirror`.
4. **Auth Cutover**:
   - Export Supabase users using Admin APIs.
   - If continuing Supabase Auth: host Supabase Auth self-hosted (optional) or migrate to custom JWT service. Provide temporary compatibility layer that accepts Supabase JWTs until all clients refresh tokens.
5. **Configuration Switch**:
   - Update `.env` to `DEPLOYMENT_MODE=self_hosted`.
   - Point Next.js to local services via Docker networking.
6. **Validation**:
   - Run integration tests against Docker stack.
   - Perform dual-write/double-read window if feasible (optional) to ensure parity before final cutover.

## 8. Security Considerations
- Secrets mounted via Docker `secrets/` or env files; never baked into images.
- TLS termination handled upstream (Vercel or organization reverse proxy). MinIO and Postgres accept internal traffic only.
- Audit logging persisted in Postgres via dedicated schema; adapters must implement audit hooks identically.

## 9. Roadmap Alignment
- **Phase 1**: Deliver Supabase adapters + Vercel deployment. Start collecting seed customer feedback.
- **Phase 2**: Finalize Docker Compose stack, run migration rehearsals, and document air-gapped deployment in `DEPLOYMENT_MODES.md`.
- **Future Enhancements**: Optional Kubernetes manifests, background worker service, and integrations with external DMS/ERP systems via the same adapter pattern.

---
This architecture ensures the same codebase powers both the managed SaaS experience and highly controlled enterprise deployments with minimal divergence.
