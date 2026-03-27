# LEXORA Authentication & RBAC

Enterprise-grade authentication for the Lexora platform is delivered through a dual-mode abstraction that can run on Supabase or a self-hosted JWT authority. Both modes share the same RBAC, audit logging, and Next.js middleware, so switching between them is a matter of environment configuration—not code changes.

## Components

- `lib/auth/`
  - `config.ts` reads environment-driven settings and validates that the active mode is ready.
  - `providers/` implements Supabase (`supabase.ts`) and custom JWT (`jwt.ts`) providers behind the common interface in `types.ts`.
  - `index.ts` exposes a single `authProvider`, `getAuthContext`, and `requireUser` helper that every server component/API route can consume.
- `lib/rbac/`
  - `roles.ts`, `permissions.ts`, `policies.ts`, and `authorizer.ts` define role hierarchy, permission bundles, and route-level enforcement.
- `lib/audit/`
  - `logger.ts` + `types.ts` emit structured audit events for every auth operation.
- `middleware.ts`
  - Runs on every `/api/*` request. It authenticates, enforces RBAC policies, forwards the caller’s identity via headers, and blocks violations with exhaustive audit logs.

## Supported Roles

| Role       | Access Summary |
|------------|----------------|
| Admin      | Full tenancy, billing, configuration |
| Lawyer     | Case management, billing actions |
| Paralegal  | Case assistance, document handling |
| Client     | View-only portal access |

Hierarchy flows downward (Admin > Lawyer > Paralegal > Client). Permissions are derived from the hierarchy so upgrades don’t require manual reconfiguration.

## Switching Auth Modes

Set the `LEXORA_AUTH_MODE` environment variable to `supabase` (default) or `jwt`. No code changes are necessary; the middleware and helper functions will automatically use the correct provider.

### Supabase Mode

Required environment variables:

- `LEXORA_AUTH_MODE=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` *(optional; useful for client helpers but not required server-side)*

Supabase roles are read from `user.app_metadata.role` (fallback to `user.user_metadata.role`). If no role is set, the user is treated as a `client`. Sessions are validated by calling `supabase.auth.getUser(accessToken)` using the service role key.

### Custom JWT Mode

Required environment variables:

- `LEXORA_AUTH_MODE=jwt`
- `LEXORA_JWT_SECRET`
- `LEXORA_JWT_ISSUER` *(default: `lexora`)*
- `LEXORA_JWT_AUDIENCE` *(default: `lexora-clients`)*
- `LEXORA_JWT_EXPIRES_IN` *(seconds, default: 3600)*

JWT claims must include at least `sub` (user id) and `role`. Tokens can be created through `authProvider.issueTokens` (available only in JWT mode). Tokens are accepted via `Authorization: Bearer <token>` headers or the `lexora-jwt` cookie.

## API Middleware Flow

1. Request hits `/api/*`.
2. `middleware.ts` calls `getAuthContext` to authenticate.
3. If unauthenticated → `401 Unauthorized` + `auth.authorization.denied` audit event.
4. If authenticated → `authorizeRequest` evaluates the applicable policy.
5. Violations return `403 Forbidden` with an audit entry explaining the reason.
6. Approved requests receive identity headers:
   - `x-lexora-user-id`
   - `x-lexora-user-role`
   - `x-lexora-user-email` (when available)

Policies can be tuned through `lib/rbac/policies.ts` using regex-based matchers, required roles, HTTP method filters, and explicit permission lists.

## Audit Logging

All auth-related actions funnel through `lib/audit/logger.ts`, which currently streams JSON events to stdout. The logger supports multiple sinks, so integrating with SIEM platforms only requires registering a new sink via `auditLogger.use(customSink)` during bootstrap.

Each event captures:

- Event type (e.g., `auth.login`, `auth.authorization.denied`)
- Timestamp + unique ID
- Actor metadata (id, email, IP, user agent)
- Context (resource, request ID, etc.)
- Result details and success status

## Usage Tips

- **API Routes:** Import `requireUser` or `getAuthContext` in route handlers to access the authed user without duplicating logic.
- **Server Components/Actions:** Call `getAuthContext(headers())` (or pass along the `Request`) to obtain the user.
- **Extending Policies:** Add or adjust entries in `DEFAULT_ROUTE_POLICIES` to guard new namespaces.
- **Zero Trust Defaults:** Routes without explicit policies allow access but still require authentication because the middleware short-circuits unauthenticated requests.

## Dependencies

Install the runtime dependencies inside the Lexora app:

```bash
npm install @supabase/supabase-js jose
```

Both libraries tree-shake well and are compatible with Next.js 15 edge/server targets.

---
For questions or future extensions (SCIM/IdP sync, adaptive MFA, etc.), open a new issue in the Lexora repo and reference this document.
