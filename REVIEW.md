# Repository Review

Date: 2026-05-30

Scope: architecture consistency, Angular implementation, NestJS implementation, Prisma schema, duplication/dead code, security, and error handling. This review did not change application code.

## Findings

### High

1. Placeholder admin protection is easy to accidentally ship.
   - Evidence: `api/src/app/common/placeholder-admin.guard.ts:17` reads `x-admin-key`, `api/src/app/common/placeholder-admin.guard.ts:20` compares it directly with the configured value, and `api/src/app/config/environment.validation.ts:20` defaults `ADMIN_API_KEY` to `dev-admin-key`.
   - Risk: If a non-local environment starts without an explicit secret, all admin CRUD endpoints have a known credential. This is acceptable only as a short-lived development placeholder.
   - Recommendation: Before deployment, remove the default, require a strong secret outside development, use real auth, and consider disabling admin routes until auth exists.

2. The web reader has a hardcoded local API origin.
   - Evidence: `apps/owl-reading/src/app/core/novel-api.service.ts:11` sets `apiBaseUrl = 'http://localhost:3000/api'`.
   - Risk: Production builds, preview deployments, Docker-hosted environments, and same-origin reverse proxy setups will call the wrong API.
   - Recommendation: Move this to Angular environment configuration, an injection token, or runtime config loaded from assets.

### Medium

3. Workspace layout diverges from the requested Nx architecture.
   - Evidence: `AGENTS.md:39`-`AGENTS.md:47` specifies `apps/web-reader`, `apps/admin-dashboard`, `apps/api`, and `libs/...`. Actual project metadata uses `apps/owl-reading/project.json:2`, root-level `api/project.json:2`, root-level `admin-dashboard/project.json:2`, and root-level `shared-types/project.json:2`.
   - Risk: New Nx generators, ownership boundaries, docs, and future contributors will have to remember the mixed layout. It also makes the current `owl-reading` app name differ from the requested `web-reader` app.
   - Recommendation: Either align the structure with `AGENTS.md` or update the architecture docs and scripts to bless the current layout intentionally.

4. The project version drifted from the documented frontend target.
   - Evidence: `AGENTS.md:10` and `AGENTS.md:129` call for Angular 20, while `package.json:26`-`package.json:34` use Angular 21.2 packages.
   - Risk: This is not inherently wrong, but it makes the foundation inconsistent with the project contract and can affect Angular Material/API expectations.
   - Recommendation: Decide whether Angular 21 is now the target. If yes, update `AGENTS.md` and README; if no, downgrade deliberately.

5. Public novel search/listing will not scale well without database indexes.
   - Evidence: `api/src/app/novels/novels.service.ts:119`-`api/src/app/novels/novels.service.ts:130` performs case-insensitive `contains` search on title and filters status. `prisma/schema.prisma:27`-`prisma/schema.prisma:37` has unique slug only and no indexes on `status`, `title`, or search-related fields.
   - Risk: Public listing/search can become slow as the catalog grows.
   - Recommendation: Add at least an index on `Novel.status` and consider a Postgres search strategy such as trigram indexes or full-text search for title search.

6. Chapter navigation and detail pages silently cap novels at 100 chapters.
   - Evidence: `apps/owl-reading/src/app/pages/novel-detail.page.ts:67` loads chapters with `pageSize: 100`; `apps/owl-reading/src/app/pages/chapter-reader.page.ts:101` does the same for previous/next navigation.
   - Risk: Novels with more than 100 chapters will hide later chapters on detail pages, and reader navigation can fail past chapter 100.
   - Recommendation: Add pagination/infinite loading in the chapter list and use chapter-specific previous/next API data instead of fetching a capped list.

7. Swagger is exposed in every environment.
   - Evidence: `api/src/main.ts:42`-`api/src/main.ts:48` always configures Swagger at `docs`.
   - Risk: Public API documentation can expose admin placeholder routes and request shapes in production.
   - Recommendation: Gate Swagger behind environment configuration, restrict it to non-production, or protect it.

8. Shared API/domain models are duplicated instead of reused.
   - Evidence: `shared-types/src/lib/models.ts:16`-`shared-types/src/lib/models.ts:29` defines `NovelModel` and `ChapterModel`; `apps/owl-reading/src/app/core/novel-api.models.ts:8`-`apps/owl-reading/src/app/core/novel-api.models.ts:27` defines similar `Novel` and `Chapter` interfaces. Current imports reference the local model file, for example `apps/owl-reading/src/app/pages/home.page.ts:8`.
   - Risk: API DTOs, frontend state, and shared library models can drift as fields are added.
   - Recommendation: Use `@owl-reading/shared-types` for shared read models, or clearly separate transport DTOs from domain models and document the boundary.

### Low

9. Generated shared UI code is unused placeholder code.
   - Evidence: `shared-ui/src/lib/shared-ui/shared-ui.ts:4` declares `lib-shared-ui`, and `shared-ui/src/lib/shared-ui/shared-ui.html:1` contains `SharedUi works!`. Repository search found no application imports of `@owl-reading/shared-ui` or `SharedUi`.
   - Risk: Low immediate risk, but placeholder libraries make it harder to see which shared surfaces are real.
   - Recommendation: Remove the generated component or replace it with the first real shared UI primitive when needed.

10. Development seed data contains a weak deterministic test credential.
    - Evidence: `prisma/seed.js:21`-`prisma/seed.js:27` creates `reader@example.com` with a SHA-256 hash of `password123`.
    - Risk: Fine for local development, unsafe if seed scripts are ever run against shared or hosted environments.
    - Recommendation: Keep seed execution scoped to local/dev only, name the credential clearly in README, and use the eventual password hashing implementation once auth exists.

11. API tests cover useful service paths but not controller/HTTP behavior.
    - Evidence: `api/src/app/novels/novels.service.spec.ts:26`-`api/src/app/novels/novels.service.spec.ts:81` and `api/src/app/chapters/chapters.service.spec.ts:26`-`api/src/app/chapters/chapters.service.spec.ts:72` cover service query behavior. There are no matching controller specs for validation pipes, guards, Swagger decorators, or HTTP status mapping.
    - Risk: Route-level regressions can pass unit tests.
    - Recommendation: Add targeted controller/e2e tests for public access, admin guard failures, validation errors, and not-found responses.

12. E2E coverage is present but environment-sensitive.
    - Evidence: `apps/owl-reading-e2e/src/example.spec.ts:3`-`apps/owl-reading-e2e/src/example.spec.ts:11` contains a basic Playwright smoke test.
    - Risk: This is useful, but local execution previously depended on Playwright browser installation and port availability.
    - Recommendation: Add setup docs/scripts for Playwright browser installation and reserve non-conflicting dev-server ports in CI.

## Architecture Consistency

The backend foundation is organized around Nest modules for health, database, novels, and chapters (`api/src/app/app.module.ts:10`-`api/src/app/app.module.ts:23`). That matches the current feature scope and avoids implementing auth before requested.

The main architectural inconsistency is project placement/naming. The requested structure in `AGENTS.md` places all apps under `apps/` and all libraries under `libs/`; the repository currently mixes `apps/owl-reading` with root-level `api`, `admin-dashboard`, `shared-types`, and `shared-ui`. This is workable in Nx, but it should be made intentional because future generators and docs will otherwise point people in different directions.

## Angular Review

Good:
- Uses standalone routes with lazy-loaded pages in `apps/owl-reading/src/app/app.routes.ts:3`-`apps/owl-reading/src/app/app.routes.ts:31`.
- Uses `provideHttpClient(withFetch())` in `apps/owl-reading/src/app/app.config.ts:14`.
- Uses Signals for page state and request state, which fits the current Angular style.
- The pages include loading, empty, and error states and rely only on public novel/chapter endpoints.

Concerns:
- API origin is hardcoded to localhost.
- Chapter list and reader navigation assume a maximum of 100 chapters.
- Search/page state on the novel list is internal signal state only, so refresh/share loses current query and page.
- Request-state/error-state handling is repeated across pages. This is acceptable for the current size, but a small shared helper or component would reduce drift.
- PWA support is required by `AGENTS.md:14`; I did not find clear evidence of service-worker/PWA configuration in the inspected Angular project files.

## NestJS Review

Good:
- `ConfigModule` is global and validates environment shape in `api/src/app/app.module.ts:11`-`api/src/app/app.module.ts:18`.
- Global validation uses transformation and whitelisting in `api/src/main.ts:28`-`api/src/main.ts:34`.
- API prefix `/api` is configured in `api/src/main.ts:36`.
- CORS is configured for Angular dev origins in `api/src/main.ts:37`-`api/src/main.ts:40`.
- Health endpoint exists at `api/src/app/health/health.controller.ts:7`-`api/src/app/health/health.controller.ts:18`.
- DTO validation is present for novel and chapter create/update inputs.

Concerns:
- Admin guard is explicitly a placeholder and should not be treated as production security.
- Swagger is always enabled.
- Param validation is weaker than body/query validation on admin `:id` routes. The controllers pass plain `string` params to services, for example `api/src/app/novels/novels.controller.ts:66` and `api/src/app/chapters/chapters.controller.ts:77`.
- Error mapping handles common Prisma errors, but there is no global exception/logging strategy yet.

## Prisma Review

Good:
- Core entities match the MVP: users, novels, chapters, bookmarks, and reading progress.
- Slugs are unique (`prisma/schema.prisma:29`).
- Chapter numbers are unique per novel (`prisma/schema.prisma:51`).
- Reading progress is unique per user and novel (`prisma/schema.prisma:78`), which fits "continue reading".

Concerns:
- No indexes for common public filters/search.
- IDs are Prisma-generated strings without Postgres `@db.Uuid`; that is valid, but less strict at the database level.
- `Chapter.content` is stored directly as `String`. That is fine for MVP, but long content, versioning, sanitization, and future EPUB import/storage should be designed before larger imports.

## Duplication And Dead Code

- Shared types are defined but not consumed by the web reader.
- Generated `shared-ui` placeholder code is unused.
- The Angular pages repeat similar loading/error/empty templates and request-state transitions. This is tolerable now but will become noisy as login, bookmarks, history, and reader settings are added.

## Security Notes

- The default admin key is the main issue.
- Swagger exposure should be environment-gated.
- Seed credentials must stay local-only.
- Docker uses default local Postgres credentials in `docker-compose.yml:7`-`docker-compose.yml:9`; this is fine for local development but should not be reused outside dev.
- No security headers middleware such as Helmet is configured yet.

## Missing Error Handling

- Frontend `getErrorMessage` returns `Error.message` directly in `apps/owl-reading/src/app/core/request-state.ts:15`-`apps/owl-reading/src/app/core/request-state.ts:20`, which can expose low-level HTTP/client details to users.
- Backend service methods map expected Prisma conflicts/not-found cases, but unexpected errors rely on Nest defaults. Add structured logging and a global exception filter before production.
- The reader currently does not have a graceful strategy for a valid published novel whose requested chapter number is outside the fetched navigation window.

## Verification Notes

I did not run new build/lint/test commands during this report-only pass to avoid generating extra output while the request was to review and create documentation. Existing scripts are present in `package.json:10`-`package.json:15`, and database scripts are present in `package.json:16`-`package.json:22`.

Recommended next verification before code changes:

```bash
pnpm verify
pnpm exec nx e2e owl-reading-e2e
```

The E2E command may require Playwright browser installation and an available dev-server port.
