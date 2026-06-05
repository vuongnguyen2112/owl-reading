# Owl Reading

Phase 1 Nx workspace for a web-only novel reading platform. This repository currently establishes the project structure, application shells, shared libraries, Prisma schema, PostgreSQL Docker setup, and CI-friendly scripts. Business features are intentionally not implemented yet.

## Requirements

- Node.js 22 LTS
- pnpm 11+
- Docker Desktop, or another Docker Compose compatible runtime

Verified locally with:

```sh
node --version
pnpm --version
```

## Projects

- `owl-reading`: Angular web reader app (`apps/owl-reading`)
- `admin-dashboard`: Angular admin app (`admin-dashboard`)
- `api`: NestJS API (`api`)
- `shared-types`: shared TypeScript API/domain models (`shared-types`)
- `shared-ui`: shared Angular UI library (`shared-ui`)
- `shared-utils`: shared TypeScript utilities (`libs/shared-utils`)

The first release is web only. The backend and shared models are intended to support a future mobile app without adding mobile code in Phase 1.

## Setup

Install dependencies:

```sh
pnpm install
```

Create or update `.env` with the local PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/owl_reading?schema=public"
```

For production deployments, set `NODE_ENV=production` and provide explicit
values for `DATABASE_URL`, `CORS_ORIGINS`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, and `AUTH_COOKIE_SECURE=true`. Production startup should
fail if these critical settings are missing or unsafe.

Auth endpoints are rate-limited with development-safe defaults:

- Login: `AUTH_LOGIN_RATE_LIMIT_MAX=5` per
  `AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS=60`.
- Register: `AUTH_REGISTER_RATE_LIMIT_MAX=3` per
  `AUTH_REGISTER_RATE_LIMIT_TTL_SECONDS=60`.
- Refresh: `AUTH_REFRESH_RATE_LIMIT_MAX=30` per
  `AUTH_REFRESH_RATE_LIMIT_TTL_SECONDS=60`.

Start PostgreSQL:

```sh
pnpm db:up
```

Generate the Prisma client:

```sh
pnpm db:generate
```

Apply database migrations during local development:

```sh
pnpm db:migrate
```

Apply committed migrations in production or deployment environments:

```sh
pnpm db:migrate:deploy
```

Use `db:migrate` only while developing migrations locally. Use
`db:migrate:deploy` during deployment; it applies existing migration files
without creating new migrations.

Validate the Prisma schema without changing the database:

```sh
pnpm db:validate
```

## Development

Run the web reader:

```sh
pnpm dev:web
```

Run the admin dashboard:

```sh
pnpm dev:admin
```

Run the API:

```sh
pnpm dev:api
```

Default local URLs:

- Web reader: `http://localhost:4200`
- Admin dashboard: `http://localhost:4201`
- API: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

Operational health endpoints:

- Liveness: `GET /api/health` or `GET /api/health/live`
- Readiness: `GET /api/health/ready`

Use liveness to check that the API process is running. Use readiness after
deployments to confirm the API can reach PostgreSQL.

## Quality Checks

Run all CI-friendly checks:

```sh
pnpm verify
```

Run checks individually:

```sh
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

Format the workspace:

```sh
pnpm format
```

## Production Smoke Checks

After deployment, verify:

- `GET /api/health/live` returns `200`.
- `GET /api/health/ready` returns `200`.
- `GET /api/health/ready` returns `503` if PostgreSQL is unavailable.
- Swagger docs are not exposed at `/api/docs` when `NODE_ENV=production`.
- Reader and admin production builds call the configured `/api` endpoint.

## Database

Local PostgreSQL is defined in `docker-compose.yml` using PostgreSQL 16.

Useful commands:

```sh
pnpm db:up
pnpm db:down
pnpm db:studio
```

The seed script is for development data only. It refuses to run in production
and also refuses non-local database hosts unless `ALLOW_DEV_SEED=true` is set
for an intentional non-production environment.

## Local Admin User

Admin API routes require a logged-in user with the `ADMIN` role. There are no
default admin credentials.

For local development, first create a user through `POST /api/auth/register` or
run the local seed, then promote that existing user by email:

```sh
ADMIN_EMAIL="reader@example.com" pnpm admin:promote
```

On Windows PowerShell:

```powershell
$env:ADMIN_EMAIL="reader@example.com"; pnpm admin:promote
```

The promotion script refuses to run in production unless
`ALLOW_ADMIN_PROMOTION=true` is explicitly set.

The initial schema includes:

- `User`
- `Novel`
- `Chapter`
- `Bookmark`
- `ReadingProgress`

For MVP content management, admins will manually create novels and chapters. EPUB import, scraping, and external content APIs are not part of Phase 1.
