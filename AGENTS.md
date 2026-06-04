Codex Project Foundation Prompt
Project Context
Build a production-ready Novel Reading Platform.
Technology Stack
Monorepo
Nx Workspace (latest stable)
Package Manager: pnpm
Node.js: 22 LTS
Frontend
Angular 20
Angular Material
Angular Signals for state management
Responsive design (mobile-first)
PWA support enabled
Backend
NestJS 11
Prisma ORM
PostgreSQL 16
Storage
Cloudflare R2 (abstract behind a storage service interface)
Authentication
JWT Authentication
Refresh Token support
Testing
Vitest (frontend)
Jest (backend)
Quality
ESLint
Prettier
Husky
lint-staged
Deployment
Docker support
Docker Compose for local development
---
Architecture
Create an Nx monorepo with the following applications:
```txt
apps/
  web-reader/
  admin-dashboard/
  api/

libs/
  shared-types/
  shared-ui/
  shared-utils/
```
---
Business Goal
The platform allows users to read novels online.
The first release is WEB ONLY.
Do NOT create Android applications yet.
The system must be designed so a mobile app can be added later using the same backend APIs.
---
MVP Features
Public
Home page
Novel listing
Novel detail page
Chapter list
Search novels
Read chapters
Authenticated User
Register
Login
Logout
Bookmark chapters
Reading history
Continue reading
Reader Settings
Dark mode
Font size adjustment
Line height adjustment
Admin
Manage novels
Manage chapters
Upload cover image
Publish/unpublish novels
---
Initial Database Design
User
id
email
passwordHash
displayName
createdAt
updatedAt
Novel
id
title
slug
description
coverImageUrl
status
createdAt
updatedAt
Chapter
id
novelId
chapterNumber
title
content
createdAt
updatedAt
Bookmark
id
userId
chapterId
createdAt
ReadingProgress
id
userId
novelId
chapterId
lastReadAt
---
Novel Content Management
For MVP:
Admin manually creates novels
Admin manually creates chapters
No EPUB import
No scraping
No external APIs
Design the architecture so EPUB import can be added later.
---
Phase 1 Requirements
Generate the Nx workspace structure.
Configure Angular 20 applications.
Configure NestJS application.
Configure Prisma with PostgreSQL.
Create Docker Compose for local PostgreSQL.
Create shared TypeScript models.
Create initial Prisma schema.
Create README with setup instructions.
Create CI-friendly scripts.
Follow clean architecture principles.
Do not implement all features immediately.
Phase 1 should only establish project structure, configuration, Prisma schema, Docker setup, and shared models.
---
Follow-up Prompt 2: Backend
```txt
Implement NestJS modules for:
- auth
- users
- novels
- chapters
- bookmarks
- reading-progress

Generate controllers, services, DTOs, validation, Prisma integration, and Swagger documentation.
```
---
Follow-up Prompt 3: Reader App
```txt
Implement Angular web-reader application.

Pages:
- Home
- Novel List
- Novel Detail
- Chapter Reader
- Login
- Register

Use Angular Material and Signals.
Create responsive layouts optimized for mobile screens.
```
---
Follow-up Prompt 4: Admin Dashboard
```txt
Implement Angular admin-dashboard.

Features:
- CRUD novels
- CRUD chapters
- Upload cover images
- Publish/unpublish novels

Use Angular Material tables, forms, and dialogs.
```
---
Recommended First Command
Use this command only after confirming Node.js 22 LTS and pnpm are installed:
```bash
npx create-nx-workspace@latest novel-platform
```
Then use the Phase 1 prompt above inside Codex/Antigravity.