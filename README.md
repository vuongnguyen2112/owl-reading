# Owl Reading

Owl Reading is a web-only novel reading platform built as an Nx monorepo. The current MVP includes a public reader app, an admin dashboard, and a NestJS API backed by Prisma and PostgreSQL.

The first release is web only. The backend API and shared models are structured so a mobile app can be added later without changing the core API shape.

## Requirements

- Node.js 22 LTS
- pnpm 11+
- Docker Desktop, or another Docker Compose compatible runtime

## Applications

- `apps/owl-reading`: Angular reader frontend.
- `admin-dashboard`: Angular admin frontend.
- `api`: NestJS API served under `/api`.
- `shared-types`: shared TypeScript API/domain models.
- `shared-ui`: shared Angular UI library.
- `libs/shared-utils`: shared TypeScript utilities.
- `prisma`: Prisma schema, migrations, seed script, and admin promotion script.

Default local URLs:

- Reader: `http://localhost:4200`
- Admin: `http://localhost:4201`
- API: `http://localhost:3000/api`
- Swagger docs in non-production: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`

## Local Development

Install dependencies:

```sh
pnpm install
```

Create `.env` with at least the local database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/owl_reading?schema=public"
```

Start PostgreSQL:

```sh
pnpm db:up
```

Generate the Prisma client and apply local migrations:

```sh
pnpm db:generate
pnpm db:migrate
```

Run the apps:

```sh
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

Useful commands:

```sh
pnpm lint
pnpm test
pnpm build
pnpm verify
pnpm format
pnpm format:check
```

`pnpm verify` runs lint, tests, and builds across the workspace.

## Environment Variables

Backend configuration is validated on startup.

Required:

- `DATABASE_URL`: PostgreSQL connection string.

Production also requires:

- `NODE_ENV=production`
- `CORS_ORIGINS`: comma-separated reader/admin origins.
- `JWT_ACCESS_SECRET`: at least 32 characters.
- `JWT_REFRESH_SECRET`: at least 32 characters.
- `AUTH_COOKIE_SECURE=true`

Optional backend settings:

- `PORT`: defaults to `3000`.
- `JWT_ACCESS_TTL_SECONDS`: defaults to `900`.
- `JWT_REFRESH_TTL_DAYS`: defaults to `30`.
- `AUTH_COOKIE_SAMESITE`: `strict`, `lax`, or `none`; defaults to `lax`.
- `AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS`: defaults to `60`.
- `AUTH_LOGIN_RATE_LIMIT_MAX`: defaults to `5`.
- `AUTH_REGISTER_RATE_LIMIT_TTL_SECONDS`: defaults to `60`.
- `AUTH_REGISTER_RATE_LIMIT_MAX`: defaults to `3`.
- `AUTH_REFRESH_RATE_LIMIT_TTL_SECONDS`: defaults to `60`.
- `AUTH_REFRESH_RATE_LIMIT_MAX`: defaults to `30`.

Local frontend builds use `http://localhost:3000/api`. Production frontend builds currently use the API URL configured in:

- `apps/owl-reading/src/environments/environment.production.ts`
- `admin-dashboard/src/environments/environment.production.ts`

There is no runtime frontend config yet, so changing the production API URL requires rebuilding the frontends.

## Database And Migrations

Local PostgreSQL is defined in `docker-compose.yml` using PostgreSQL 16.

```sh
pnpm db:up
pnpm db:down
pnpm db:validate
pnpm db:studio
```

Use `pnpm db:migrate` while developing migrations locally. Use `pnpm db:migrate:deploy` in production or deployment environments to apply committed migrations without creating new ones.

The seed script is for development data only:

```sh
pnpm db:seed
```

It refuses to run in production and refuses non-local database hosts unless `ALLOW_DEV_SEED=true` is set intentionally.

Current core models include users, refresh tokens, novels, chapters, bookmarks, and reading progress.

## Auth

The MVP auth flow supports register, login, refresh, logout, and current-user profile lookup.

- Access tokens are returned by the API and stored by the frontends in `sessionStorage` as `owl_access_token`.
- Refresh tokens are stored in a cookie.
- Refresh requests use `withCredentials: true`.
- On `401`, reader and admin interceptors call `/auth/refresh`, store the new access token, and retry the original request once.
- If refresh fails, the frontend clears the session and redirects to `/login`.
- Admin routes require a user with the `ADMIN` role on both the client and API.

For local admin access, create or seed a normal user and promote it:

```sh
ADMIN_EMAIL="reader@example.com" pnpm admin:promote
```

PowerShell:

```powershell
$env:ADMIN_EMAIL="reader@example.com"; pnpm admin:promote
```

The promotion script refuses production unless `ALLOW_ADMIN_PROMOTION=true` is explicitly set.

## Reader MVP

The reader app currently supports:

- Novel listing and search.
- Novel detail pages.
- Chapter lists and chapter reading.
- Previous/next chapter navigation from the API.
- Register, login, logout, and auth hydration.
- Account/profile integration.
- Bookmarks.
- Reading progress and continue-reading behavior.
- Automatic access-token refresh on expired sessions.

## Admin MVP

The admin dashboard currently supports:

- Admin login and logout.
- Client-side rejection of non-admin users.
- Protected admin routes.
- Novel create, read, update, delete, and status changes.
- Chapter create, read, update, and delete.
- Manual content management for novels and chapters.
- Delete confirmation UI.
- Delete guardrails for published content:
  - `PUBLISHED` novels cannot be deleted.
  - Chapters whose parent novel is `PUBLISHED` cannot be deleted.
- API/auth error rendering that takes priority over empty states.
- Automatic access-token refresh on expired sessions.

Novel status values are `DRAFT`, `PUBLISHED`, and `ARCHIVED`.

## API And Operations

The API exposes reader, auth, profile, bookmark, reading-progress, and admin novel/chapter endpoints. Swagger documentation is available only outside production.

Health endpoints:

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`

Use liveness to confirm the API process is running. Use readiness to confirm the API can reach PostgreSQL.

Production API start command:

```sh
pnpm start:api:prod
```

## Production And Railway Notes

Recommended Railway services:

- API service.
- PostgreSQL service.
- Reader static/frontend service.
- Admin static/frontend service.

Typical deployment order:

1. Create the PostgreSQL service.
2. Deploy the API with production environment variables.
3. Run `pnpm db:migrate:deploy`.
4. Promote the first admin intentionally.
5. Build and deploy reader/admin with the real API URL.
6. Smoke test health, auth, admin, and reader workflows.

For cross-site Railway staging, configure the API with the real frontend origins:

```env
NODE_ENV=production
DATABASE_URL="..."
CORS_ORIGINS="https://reader-url,https://admin-url"
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
```

Smoke checks after deployment:

- `GET /api/health/live` returns `200`.
- `GET /api/health/ready` returns `200` when PostgreSQL is reachable.
- `GET /api/health/ready` returns `503` when PostgreSQL is unavailable.
- `/api/docs` is not exposed when `NODE_ENV=production`.
- Reader and admin production builds call the intended API URL.

## Known Remaining Gaps

- No Dockerfiles yet.
- No platform-specific Railway config yet.
- No runtime frontend config; API URL changes require frontend rebuilds.
- No Cloudflare R2 integration or real cover image upload yet.
- No EPUB import, scraping, or external content APIs.
- No CSRF protection for the refresh-cookie flow.
- Access tokens are stored in `sessionStorage`, which remains XSS-sensitive.
- No password reset, email verification, or MFA.
- No structured request logging.
- No global exception filter.
- Rate limiting is in-memory only, not distributed.
- Bookmark/progress failure UX is still minimal.
