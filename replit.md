# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (API), SQLite / better-sqlite3 (RSS announcements)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## RSS Announcements Feature

The API server serves two additional root-level routes:

- **`/rss.xml`** — Public RSS 2.0 feed (no auth). Channel: "Hunter Gatherer Mental Health Announcements". Only active announcements, newest first.
- **`/admin`** — Password-protected admin UI. Login with `ADMIN_PASSWORD` secret.

Data is stored in `artifacts/api-server/data/announcements.db` (SQLite).

### Environment variables
- `ADMIN_PASSWORD` (secret) — admin page password
- `SESSION_SECRET` (secret) — express-session secret
- `BASE_URL` (optional) — public base URL shown in admin. Auto-detected from `REPLIT_DOMAINS` if not set.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
