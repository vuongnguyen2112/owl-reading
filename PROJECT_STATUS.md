# Owl Reading Project Status

This document is a continuation handoff for a future Codex session.

## Current Architecture

Nx monorepo at `d:\my_projects\owl-reading`.

Applications and libraries:

- `apps/owl-reading`: Angular reader frontend.
- `admin-dashboard`: Angular admin frontend.
- `api`: NestJS backend.
- `shared-types`: shared TypeScript/domain models.
- `shared-ui`: shared Angular UI library.
- `libs/shared-utils`: shared utility library.
- `prisma`: Prisma schema, migrations, seed, and admin promotion scripts.
- `docker-compose.yml`: local PostgreSQL setup.

Runtime shape:

- Reader and admin Angular apps call the Nest API.
- API is served under `/api`.
- Prisma talks to PostgreSQL.
- Auth uses JWT access tokens plus a refresh-token cookie.
- Frontends store the access token in `sessionStorage` under `owl_access_token`.
- Refresh-token requests use `withCredentials: true`.

Important scripts:

```json
"dev:web": "nx serve owl-reading",
"dev:admin": "nx serve admin-dashboard --port 4201",
"dev:api": "nx serve api",
"verify": "pnpm lint && pnpm test && pnpm build",
"start:api:prod": "node dist/api/main.js",
"db:migrate:deploy": "prisma migrate deploy",
"admin:promote": "node prisma/promote-admin.js"
```

## Completed Features

Backend:

- Prisma/PostgreSQL integration.
- Novel and chapter reader APIs with explicit DTO boundaries.
- Admin novel/chapter APIs with DTO boundaries.
- Novel/chapter indexes and previous/next chapter navigation.
- Auth foundation: register, login, refresh, logout, current user.
- Role-based admin authorization replacing placeholder admin key auth.
- Safe admin promotion path via `pnpm admin:promote`.
- Reading progress MVP.
- Bookmarks MVP.
- User profile MVP.
- Admin delete guardrails:
  - Cannot delete `PUBLISHED` novels.
  - Cannot delete chapters whose parent novel is `PUBLISHED`.
- Auth endpoint rate limiting with `@nestjs/throttler`.
- Health/readiness endpoints:
  - `GET /api/health`
  - `GET /api/health/live`
  - `GET /api/health/ready`

Reader frontend:

- Novel listing, novel detail, and chapter reader.
- Login, register, and logout UI.
- Account/profile integration.
- Bookmarks integration.
- Reading progress integration.
- Auth state hydration.
- Refresh-token retry flow on `401`.

Admin frontend:

- Admin login UI.
- Admin logout control.
- Rejects non-`ADMIN` users and clears token.
- Protected admin routes.
- Novel CRUD MVP.
- Chapter CRUD MVP.
- Delete confirmation and delete hiding/disable behavior for published content.
- API/auth error rendering fixed so errors take priority over empty states.
- Refresh-token retry flow on `401`.

## Deployment Status

Implemented:

- Production env validation for critical backend settings.
- Swagger gated so docs are not exposed in production.
- Production-safe Prisma deploy script: `pnpm db:migrate:deploy`.
- Production API start command: `pnpm start:api:prod`.
- Seed script refuses production and non-local DB unless explicitly allowed.
- Admin promotion script refuses production unless explicitly allowed.
- Health/readiness endpoints are available for deploy smoke checks.
- `pnpm verify` passes.

Not implemented yet:

- Dockerfiles.
- Platform-specific deployment config.
- Runtime frontend config.
- Structured request logging.
- Global exception filter.
- Redis/distributed throttling.
- CSRF protection.

## Railway Status

Current staging approach:

- Reader/admin production builds use a direct Railway API URL.
- Placeholder currently documented/configured as `https://api-staging.up.railway.app/api`.
- Before a real Railway staging build, replace this placeholder in:
  - `apps/owl-reading/src/environments/environment.production.ts`
  - `admin-dashboard/src/environments/environment.production.ts`

Recommended Railway services:

- API service.
- PostgreSQL service.
- Reader static/frontend service.
- Admin static/frontend service.

Required Railway backend environment variables:

```env
NODE_ENV=production
DATABASE_URL=...
CORS_ORIGINS=https://reader-url,https://admin-url
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
```

Deployment order:

1. Create PostgreSQL.
2. Deploy API with environment variables.
3. Run `pnpm db:migrate:deploy`.
4. Promote the first admin intentionally.
5. Build/deploy reader and admin with the real API URL.
6. Smoke test health, auth, admin, and reader visibility.

## Auth Status

Current auth is MVP-usable:

- Access token is stored in `sessionStorage` as `owl_access_token`.
- Refresh token is cookie-based.
- Refresh requests use `withCredentials: true`, needed for Railway cross-site staging.
- On `401`, reader/admin interceptors call `/auth/refresh`, store the returned access token, and retry the original request once.
- If refresh fails, session is cleared and the user is redirected to `/login`.
- Admin auth enforces `ADMIN` role client-side and backend-side.

Security caveats:

- Access token in `sessionStorage` is acceptable for MVP but remains XSS-sensitive.
- Cross-site cookie staging requires `SameSite=None; Secure`.
- CSRF protection has not been added yet.
- Password reset, email verification, and MFA are not implemented.

## Admin Status

Admin backend:

- Role guard protects admin APIs.
- Admin CRUD exists for novels and chapters.
- Delete guardrails block destructive deletes for published content.
- DTO validation exists, including chapter content length.

Admin frontend:

- Login page exists.
- Admin token is stored in admin-origin `sessionStorage`.
- Non-admin users are denied and token is cleared.
- Novel list/create/edit/status/delete MVP exists.
- Chapter list/create/edit/delete MVP exists.
- Error/empty-state rendering bug has been fixed.

## Known Issues And Risks

High-value remaining risks:

- `README.md` still opens by describing the project as Phase 1 scaffolding with business features intentionally not implemented. That is stale.
- No runtime frontend config; staging/prod API URL requires rebuild.
- No platform-specific Railway config yet.
- No Dockerfiles yet.
- No CSRF protection for refresh-cookie flow.
- No structured request logging.
- No global exception filter.
- Rate limiting is in-memory only, not distributed.
- Token storage is still `sessionStorage`, not an httpOnly access-token cookie.
- Bookmark/progress failure UX is likely still minimal.
- No real file upload or Cloudflare R2 integration yet.
- No cover image upload MVP yet.

## Current Branch State

Latest observed branch state:

```text
## main...origin/main [ahead 1]
```

At the time this document was written, the working tree was clean and local `main` was ahead of `origin/main` by one commit.

## Latest Completed Task

Latest completed task: frontend refresh-token integration MVP for reader and admin.

Result:

- Integration was already present.
- No new edits were needed for that task.
- Verified by inspecting:
  - `apps/owl-reading/src/app/core/reader-auth.service.ts`
  - `apps/owl-reading/src/app/core/auth-refresh.interceptor.ts`
  - `admin-dashboard/src/app/core/admin-auth.service.ts`
  - `admin-dashboard/src/app/core/auth-refresh.interceptor.ts`
  - both `auth-http-context.ts` files
  - both `app.config.ts` files
- `pnpm verify` passed.

## Exact Next Recommended Task

Update the stale project/deployment documentation, especially `README.md`, so it reflects the actual implemented MVP instead of Phase 1-only scaffolding.

Smallest safe next task:

```text
Audit and update README.md to match the current implemented MVP:
- reader auth
- admin auth
- bookmarks
- reading progress
- profile
- admin novel/chapter CRUD
- production/Railway deployment notes
- remaining gaps
Run pnpm verify afterward.
```

Reason: the codebase has moved well beyond the README's current "business features are intentionally not implemented yet" statement. That mismatch is now the easiest way for a future engineer or deployment operator to make wrong assumptions.
