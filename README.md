<div align="center">

# readmesh

### Read, write, and understand documentation — with AI woven in.

**readmesh** turns any public GitHub repository into a beautiful, explorable reading
experience, gives you a live Markdown workspace, and layers AI on top — summaries,
beginner-mode rewrites, translations, and a repo-aware chat grounded in the docs.

`Markdown` × `Documentation` × `AI` × `Knowledge Mapping`

[Features](#-features) · [Tech stack](#-tech-stack) · [Quick start](#-quick-start) · [Configuration](#-configuration) · [Deployment](#-deployment)

</div>

---

## Overview

readmesh is a full‑stack monorepo with three pieces:

- **`frontend/`** — a Next.js (App Router) app with a distinctive *"Neural Mesh"* UI: a
  guest Markdown editor, an immersive repository reader, an AI assistant, and a
  document workspace for signed‑in users.
- **`backend/`** — an Express + Prisma API: authentication (local + OAuth), GitHub repo
  ingestion, the AI summary/translation engine, a Pinecone‑backed RAG chat, annotations,
  and saved documents.
- **`packages/shared/`** — a small workspace package of constants, route definitions, and
  shared limits used by both sides so the contract never drifts.

The whole product is usable as a **guest** (write Markdown, read repos, preview); creating
an account unlocks **saving, notes/highlights, and AI features**.

---

## Features

### Reading & writing
- **Live Markdown workspace** — split editor/preview with a formatting toolbar, drafts
  saved locally for guests and to the server for signed‑in users (multi‑document, autosave).
- **Repository reader** — paste any public GitHub URL and read its docs, rendered with
  **Shiki** syntax highlighting, **Mermaid** diagrams, **KaTeX** math, GitHub‑style callouts,
  collapsible sections, a scroll‑spy table of contents, breadcrumbs, in‑document search, and a
  reading‑progress bar.
- **File navigation** across a repo's Markdown files, with branch switching.
- **Export** any document to **Markdown**, **HTML**, or **PDF** (theme‑aware).

### AI (Google Gemini)
- **TL;DR & insights** — summary, what it does, who it's for, how to run, key commands,
  detected tech stack, and highlights.
- **Beginner mode** — rewrites docs in plain language.
- **Translate** — render the docs in another language, preserving code.
- **Repo‑aware chat (RAG)** — ask questions answered from the repo's own docs, with
  inline **source citations**, powered by Gemini embeddings + a **Pinecone** vector store.

### Collaboration & accounts
- **Notes, highlights & comments** — quote‑anchored annotations persisted per file.
- **Authentication** — email/password with JWTs in httpOnly cookies (access + rotating
  refresh tokens), plus **Google** and **GitHub** OAuth sign‑in.
- **6 themes** — light, dark, GitHub, Dracula, Nord, and VS Code, saved to your profile.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4, TanStack Query, Zustand, react‑markdown (remark/rehype), Shiki, Mermaid, KaTeX, lucide‑react |
| **Backend** | Node.js (ESM), Express, Prisma ORM, Zod, JWT (`jsonwebtoken`), `bcryptjs`, `pino` |
| **Database** | PostgreSQL |
| **AI** | Google Gemini (generation + embeddings), Pinecone (vector store) |
| **Tooling** | pnpm workspaces, ESLint, Prettier |

---

## 🗂 Project structure

```
readmesh/
├─ frontend/            # Next.js app (App Router) — UI, pages, hooks
│  ├─ app/              # routes: / (editor), /read, /editor/[id], /dashboard, /oauth/...
│  ├─ components/       # editor, reader, markdown engine, auth, brand, ui primitives
│  ├─ hooks/ lib/       # data hooks (react-query) and API clients
├─ backend/             # Express API + Prisma
│  ├─ prisma/           # schema.prisma, migrations, seed
│  └─ src/
│     ├─ modules/       # auth, oauth, user, github, summary, rag, annotation, document
│     ├─ middleware/    # authenticate, validate, rate limit, error handler
│     ├─ utils/ lib/    # jwt, cookies, gemini, prisma client
│     └─ config/        # env (zod-validated)
├─ packages/
│  └─ shared/           # ROUTES, API_PREFIX, limits, shared constants
└─ docs/                # project requirements
```

---

## Prerequisites

- **Node.js ≥ 20**
- **pnpm ≥ 9** (`npm i -g pnpm`)
- **PostgreSQL ≥ 14** running locally (or a managed instance)
- *Optional (for AI features):* a **Google Gemini** API key and a **Pinecone** account
- *Optional (for social login):* **Google** and/or **GitHub** OAuth apps

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/<your-username>/readmesh.git
cd readmesh

# 2. Install all workspaces
pnpm install

# 3. Configure environment (see Configuration below)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
#   …then fill in DATABASE_URL and the JWT secrets at minimum.

# 4. Set up the database (creates tables + seeds roles)
pnpm prisma:migrate      # runs prisma migrate dev in the backend
pnpm db:seed             # seeds the 'developer' and 'admin' roles

# 5. Run the API + web app together
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:8080/api/v1  (health check: `/api/v1/health`)

> Run only one side with `pnpm dev:web` or `pnpm dev:api`.

Generate strong JWT secrets (each ≥ 32 chars):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Configuration

### Backend — `backend/.env`

| Variable | Required | Description |
| --- | :---: | --- |
| `NODE_ENV` | | `development` \| `production` (default `development`) |
| `PORT` | | API port (default `8080`) |
| `CORS_ORIGIN` | | Allowed browser origin (default `http://localhost:3000`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | Access‑token secret (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh‑token secret (≥ 32 chars) |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | | Token lifetimes (default `15m` / `7d`) |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` / `COOKIE_DOMAIN` | | Cookie tuning (auto: `secure`+`SameSite=None` in prod, `Lax` in dev) |
| `FRONTEND_URL` | | Where the browser runs — used for OAuth (default = first `CORS_ORIGIN`) |
| `GITHUB_PAT` | | GitHub token to raise the public‑repo read rate limit (optional) |
| **AI** | | |
| `GEMINI_API_KEY` | ▲ | Enables all AI features (summaries, translate, chat) |
| `GEMINI_MODEL` | | LLM model (default `gemini-2.5-flash`) |
| `GEMINI_EMBED_MODEL` / `EMBED_DIMENSION` | | Embedding model + dim (default `gemini-embedding-001` / `768`) |
| `PINECONE_API_KEY` / `PINECONE_INDEX` / `PINECONE_HOST` | ▲ | Vector store for repo‑aware chat |
| **OAuth** | | |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | ▲ | Google sign‑in |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` | ▲ | GitHub sign‑in |

> ▲ = optional; the app runs without it, but the related feature is disabled until configured.

### Frontend — `frontend/.env`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the API (default `http://localhost:8080/api/v1`) |

---

## OAuth setup (Google & GitHub)

readmesh uses a **frontend‑callback** flow: the provider redirects the browser to a page in
the web app, which forwards the authorization code to the API to exchange and set the session.
The **redirect/callback URL you register must point to the frontend** and match exactly.

For local development (frontend on `:3000`), register:

| Provider | Where | Redirect / callback URL |
| --- | --- | --- |
| **Google** | Cloud Console → Credentials → OAuth client → *Authorized redirect URIs* | `http://localhost:3000/oauth/google/callback` |
| **GitHub** | Settings → Developer settings → OAuth Apps → *Authorization callback URL* | `http://localhost:3000/oauth/github/callback` |

Then set the matching `*_CLIENT_ID`, `*_CLIENT_SECRET`, and `*_CALLBACK_URL` in `backend/.env`
and restart the API. In production, swap `http://localhost:3000` for your deployed web origin
in **both** the provider console and the `.env`.

---

## AI setup

1. Create a **Gemini API key** and set `GEMINI_API_KEY`.
2. Create a **Pinecone index** with **dimension `768`** (matching `EMBED_DIMENSION`) and the
   **cosine** metric, then set `PINECONE_API_KEY` and `PINECONE_INDEX` (`readmesh` by default).

Summaries/translations work with just the Gemini key; the repo‑aware **chat** additionally
needs Pinecone.

---

## Scripts

Run from the repo root:

| Command | Description |
| --- | --- |
| `pnpm dev` | Run API + web together |
| `pnpm dev:web` / `pnpm dev:api` | Run one side |
| `pnpm build` | Build all workspaces |
| `pnpm lint` / `pnpm format` | Lint / format the repo |
| `pnpm prisma:migrate` | Apply DB migrations (dev) |
| `pnpm prisma:generate` | Regenerate the Prisma client |
| `pnpm db:seed` | Seed default roles |

Backend‑only: `pnpm --filter readmesh-backend run prisma:studio` opens Prisma Studio, and
`prisma:deploy` applies migrations in production.

---

## API overview

All routes are under `/api/v1`.

| Group | Base | Purpose |
| --- | --- | --- |
| Health | `/health` | Liveness check |
| Auth | `/auth` | Register, login, logout, refresh, current user |
| OAuth | `/oauth/:provider` | Google/GitHub sign‑in (start + callback) |
| Users | `/users` | Profile & preferences |
| GitHub | `/github` | Resolve, load, and read public repo content |
| Summary | `/summary` | TL;DR, commands, beginner, translate |
| RAG | `/rag` | Ingest a repo and chat (streaming, with sources) |
| Annotations | `/annotations` | Highlights, notes, comments |
| Documents | `/documents` | Saved Markdown documents (CRUD) |

---

## Deployment

readmesh deploys as two services + a database.

**Database** — any managed PostgreSQL (Neon, Supabase, RDS, …). Apply migrations once on
deploy:

```bash
pnpm --filter readmesh-backend run prisma:deploy
pnpm --filter readmesh-backend run db:seed   # first deploy only
```

**Backend** (Render / Railway / Fly / a container):

- Start command: `pnpm --filter readmesh-backend run start`
- Set `NODE_ENV=production`, `DATABASE_URL`, the JWT secrets, `CORS_ORIGIN` and `FRONTEND_URL`
  to your web origin, and the AI/OAuth keys you use.
- In production the app issues **cross‑site cookies** (`Secure` + `SameSite=None`), so the API
  **must be served over HTTPS**.

**Frontend** (Vercel or any Next.js host):

- Set `NEXT_PUBLIC_API_BASE_URL` to your deployed API base (e.g. `https://api.example.com/api/v1`).
- Build: `pnpm --filter readmesh-frontend run build`.

**Don't forget:** update the OAuth redirect URIs in the Google/GitHub consoles to your
production web origin, and keep `*_CALLBACK_URL` in sync.

---

## Status & roadmap

Implemented: guest editor, repo reader & Markdown engine, search/navigation, AI summary engine,
RAG chat, annotations, saved documents, local + OAuth auth, theming, and the redesigned UI.

Planned / possible next: shareable document links, richer dashboard, image uploads (currently
images are added by URL; pasting embeds base64 in the editor only), and team workspaces.

---

## Contributing

Issues and PRs are welcome. Please run `pnpm lint` and `pnpm format:check` before opening a PR.
