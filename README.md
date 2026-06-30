# WortLoop

An Anki-style, mobile-first **Angular PWA** that shows **German expressions** as cards with
their **Hungarian translation** (powered by the Tatoeba API). Tap a card to flip it, then page
through the deck.

- **Data source:** [Tatoeba](https://tatoeba.org) (`deu` → `hun`), accessed through a Vercel
  serverless proxy (`/api/cards`), because the Tatoeba API cannot be called from the browser
  directly (CORS).
- **Progress:** fetched cards are stored in `localStorage`, so they stay browsable offline.
- **PWA:** installable; the app shell loads offline, but fetching new cards needs an internet
  connection.

## Local development

The frontend and the API are two processes. Start them in two terminals:

```bash
# 1) Tatoeba proxy (local stand-in for the Vercel function) – http://localhost:3001
npm run dev:api

# 2) Angular dev server (forwards /api calls to the proxy) – http://localhost:4200
npm start
```

`npm start` uses `proxy.conf.json` to route `/api` to `localhost:3001`.

## Build

```bash
npm run build      # output: dist/wortloop/browser
```

## Tests

```bash
npm test           # Vitest unit tests
```

## Deploy (Vercel)

Import the repo root into Vercel. `vercel.json` configures:

- the output directory (`dist/wortloop/browser`),
- the SPA fallback rewrite (`/(.*) → /index.html`); static files and the `/api/*` serverless
  function are matched before this, so the proxy and assets stay intact.

`api/cards.mjs` is deployed automatically as a serverless function (the `_`-prefixed
`api/_tatoeba.mjs` helper module is not exposed as a route).

## Structure

| Path | Role |
| --- | --- |
| `src/app/app.ts` | Main view: deck, paging, loading, error handling (signals). |
| `src/app/card/` | Presentational flip-card component. |
| `src/app/card.service.ts` | `/api/cards` fetching + `localStorage` deck cache. |
| `api/cards.mjs` | Vercel proxy to Tatoeba (`{id, de, hu}[]`). |
| `api/_tatoeba.mjs` | Tatoeba fetch + translation extraction (shared helper). |
| `scripts/dev-api.mjs` | Local proxy server for development. |
