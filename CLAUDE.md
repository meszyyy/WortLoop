# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

WortLoop is an Anki-style, mobile-first **Angular 22 PWA** that shows German expressions as flip
cards with their Hungarian translation, sourced live from the **Tatoeba API**. It deploys to Vercel.

## Commands

```bash
npm run dev:api    # Tatoeba proxy on :3001 (local stand-in for the Vercel function) — run FIRST
npm start          # Angular dev server on :4200 (proxies /api -> :3001)
npm run build      # production build -> dist/wortloop/browser
npm test           # Vitest unit tests (single run)
```

Local dev needs **both** processes in separate terminals: `npm start` only serves the frontend,
and the app is broken without the proxy because the cards come from `/api/cards`.

To run a single test: `npx vitest run src/app/app.spec.ts` (or `npx vitest -t "should create"` to
filter by name). There is no e2e setup and no separate lint step (Prettier is the only formatter).

## Architecture

Data flow: **Angular app → `/api/cards?page=N` → Vercel serverless fn → tatoeba.org api_v0**.

The proxy is not optional: Tatoeba's `api_v0` blocks browser CORS, so the browser can never call it
directly. Everything routes through our own function so we control caching and avoid third-party
mirrors.

- **`api/_tatoeba.mjs`** — the only place that talks to Tatoeba. `fetchCards(page)` hits the
  `deu→hun` search endpoint and flattens Tatoeba's 2D `translations` array down to compact
  `{ id, de, hu }` cards, dropping any sentence without a Hungarian translation.
- **`api/cards.mjs`** — Vercel function wrapping `fetchCards`, adds edge `Cache-Control`.
- **`scripts/dev-api.mjs`** — a plain Node `http` server that imports the *same* `_tatoeba.mjs`
  helper, so dev and prod share one source of truth. `proxy.conf.json` points `ng serve` at it.
- **`src/app/card.service.ts`** — calls `/api/cards`, and is the sole owner of `localStorage`
  (keys `wortloop.deck` + `wortloop.page`). It merges/dedups fetched cards into the persisted deck
  so previously seen cards stay browsable offline.
- **`src/app/app.ts`** — the study view; holds all UI state in signals (deck, index, flipped,
  loading, message) and the paging/error logic. `src/app/card/` is a purely presentational flip card.

### Conventions that bite

- The `api/` and `scripts/` files are **ESM `.mjs`**, deliberately outside Angular's TypeScript
  build, and rely on Node's global `fetch`. They are not type-checked — keep them plain JS.
- Anything in `api/` becomes a Vercel route **except** files prefixed with `_` (hence
  `_tatoeba.mjs` is a private helper, not an endpoint).
- `fetch` request headers must be ASCII (ByteString). A non-ASCII char in e.g. the `User-Agent`
  throws at runtime — keep header values ASCII-only.
- Components are standalone + signal-based + `OnPush`; the app is bootstrapped via
  `bootstrapApplication` in `src/main.ts` (no NgModules). New Angular file naming omits the
  `.component` suffix (`app.ts`, `card.ts`).

### Deployment (Vercel)

`vercel.json` sets `outputDirectory` to `dist/wortloop/browser` and a SPA fallback rewrite
(`/(.*) → /index.html`). Static files and `/api/*` functions match before the rewrite. If the
Angular output path ever changes, update `vercel.json` to match or the deploy serves nothing.

### Notes

- Node v25 (odd, non-LTS) triggers Angular "unsupported engine" warnings but builds fine; prefer
  an LTS Node (24) for production.
- The service worker is disabled in dev (`isDevMode()`), so PWA/offline behavior only appears in a
  production build served statically.
