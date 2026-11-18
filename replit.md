# Margin

Margin is a local-first study notebook that turns source notes into reviewable, source-linked learning material.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- The first version processes notes locally rather than sending private material to an external AI provider. Browser persistence is not cloud synchronization or account-based access control.
- Treat original excerpts as evidence, never as editable generated prose. Merging items must retain every source reference.
- Only approved items belong in the learning library and study material. Demo-approved content must be labeled as such.

## Product

Add text or Markdown notes, review extracted items, and study approved material using source-linked summaries, flashcards, quizzes, and focused sessions.

## User preferences

- Keep the experience calm, professional, private, responsive, and optimized for reading.
- Every extracted item must include its original source excerpt and be reviewable before entering the library.
- Clearly separate source facts from generated interpretation. Never invent facts outside the supplied material.
- Include demo material and show the smallest useful version first.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
