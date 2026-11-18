# Margin

A local-first study notebook that turns your own source material into reviewable, source-linked study items.

## What is included

- **Study app:** paste notes or upload text/Markdown; review, edit, merge, tag, approve, or discard extracted items.
- **Approved library:** source-linked summaries, concept pages, and how-to material.
- **Study tools:** flashcards, short quizzes, focused sessions, and an understanding dashboard based on recorded results.
- **Demo course:** “Learning how to learn,” with sample sources and clearly labeled demo-approved items.
- **Animated introduction:** a 30-second widescreen film with its soundtrack and editable animation source.
- **Project configuration:** pnpm workspace, dependency lockfile, security patch, TypeScript settings, and Replit artifact/workflow metadata.

## Privacy and limits

The study app processes notes locally using rule-based extraction, **not an external AI model**. Original excerpts are kept separately from generated questions and user interpretation. Suggested items need human review.

Study data is saved in the current browser's localStorage. It is not uploaded to the API server or this repository. There is no cloud sync, account-based access control, or encryption guarantee. Use **Privacy & data** in the app to export or import your notebook. Clearing browser data can erase it. Fonts may load from Google Fonts.

This public repository contains demo material and application code, not the contents of your browser notebook.

## Requirements

- Node.js **24**
- pnpm **10** (the project was prepared with pnpm 10.26.1)
- Linux x64 is the supported setup represented by this lockfile. Several native-package overrides exclude other platforms; macOS, Windows, or ARM may require adapting those overrides and regenerating the lockfile.

## Install

From the repository root:

```sh
pnpm install --frozen-lockfile
```

Use pnpm, not npm or Yarn. Keep the `patches/` directory: the workspace applies a dependency security patch from it.

## Run locally outside Replit

These examples use a POSIX shell. Each frontend requires an explicit port and base path.

### Study app

```sh
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/margin run dev
```

Open `http://localhost:3000/`.

### Animated introduction

In a second terminal:

```sh
PORT=3001 BASE_PATH=/margin-film/ pnpm --filter @workspace/margin-film run dev
```

Open `http://localhost:3001/margin-film/`.

The app and film can run independently; neither requires a database or an AI API key.

## Build static files

```sh
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/margin run build
PORT=3001 BASE_PATH=/margin-film/ pnpm --filter @workspace/margin-film run build
```

Build output is written to each artifact's `dist/public/` directory. Configure your static host to serve the app at `/`, the film at `/margin-film/`, and provide an `index.html` fallback for client-side routes. Keep the chosen base paths consistent between build and hosting.

The video project is an animated web composition, not a pre-rendered MP4. Its soundtrack is included. Replit's video preview provides export; running Vite alone does not produce an MP4.

## Checks

```sh
pnpm run typecheck:libs
pnpm --filter @workspace/margin run typecheck
bash artifacts/margin-film/scripts/validate-recording.sh
```

The film's scaffold TypeScript configuration may report missing browser globals in a standalone full-workspace typecheck. Recording validation checks the recording lifecycle wiring; it does not prove a video export rendered successfully.

## Optional API and database scaffold

The repository also includes an Express API server and shared database/client packages. The current local-first study app does not depend on them.

```sh
PORT=5000 pnpm --filter @workspace/api-server run dev
```

The health endpoint is `/api/healthz`. If you extend the app with server-side storage, configure your own PostgreSQL `DATABASE_URL` privately before using `@workspace/db`. Never commit the connection string.

API contracts live in `lib/api-spec/openapi.yaml`. After changing them, regenerate clients:

```sh
pnpm --filter @workspace/api-spec run codegen
```

## Project map

```text
artifacts/margin/           Study app
artifacts/margin-film/      Animated film and soundtrack
artifacts/mockup-sandbox/   Design preview sandbox
artifacts/api-server/       Optional API scaffold
lib/                       Shared API, validation, and database packages
patches/                   Required dependency security patch
scripts/                   Project utilities and dependency regression checks
```

## Replit

Artifact metadata is retained under each artifact's `.replit-artifact/` directory. Run the existing managed app and film workflows in Replit; they supply each service's port and base path. No secrets are included in this repository.
