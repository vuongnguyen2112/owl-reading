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

## Database

Local PostgreSQL is defined in `docker-compose.yml` using PostgreSQL 16.

Useful commands:

```sh
pnpm db:up
pnpm db:down
pnpm db:studio
```

The initial schema includes:

- `User`
- `Novel`
- `Chapter`
- `Bookmark`
- `ReadingProgress`

For MVP content management, admins will manually create novels and chapters. EPUB import, scraping, and external content APIs are not part of Phase 1.
