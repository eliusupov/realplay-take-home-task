# Realplay: registration with attribution and redirect

A small React demo that captures first-touch marketing attribution, preserves it through registration and redirects, and opens URL-triggered modals. The backend and accounts are mocked.

Current state: the application foundation (ticket 01). Registration, attribution, and modals arrive in later tickets.

## Requirements

- Node.js 24.12 or newer
- npm 11 (the only package manager; `package-lock.json` is committed)

## Commands

```sh
npm ci              # clean, reproducible install
npx playwright install chromium   # once, if the browser is not cached yet
npm run dev         # Vite dev server on http://localhost:5173
npm run typecheck   # strict TypeScript, no emit (tsc -b: browser app and Node configs/tests checked separately)
npm run lint        # ESLint (typescript-eslint strict type-checked, react-hooks, react-refresh)
npm run format      # Prettier
npm test            # Playwright against the running app
npm run build       # type-check, then production build into dist/
npm run preview     # serve dist/ on http://localhost:4173
```

## Stack

React 18, TypeScript (strict), Vite, MUI (Emotion), React Router, React Query. No global state library: later tickets use React Context for session and modal state. React Compiler runs on React 18 (`babel-plugin-react-compiler` with `target: '18'` and `react-compiler-runtime`), so components carry no manual `useMemo`/`useCallback`/`memo`; `eslint-plugin-react-hooks` enforces the compiler rules.

## Folder structure

```
src/
  main.tsx        entry: fonts and React root
  app/            application composition: providers, router, theme, shell (header)
  pages/          route pages (HomePage.tsx for /)
  features/       feature-owned behavior, one folder per feature, created when the feature arrives
  shared/         primitives actually reused by more than one feature, created only when needed
tests/
  app.spec.ts     the single Playwright harness
tsconfig.app.json   browser code (src/): DOM types only, no Node globals
tsconfig.node.json  Node code: tests and config files
```

`features/` and `shared/` do not exist yet; nothing needs them in ticket 01.

## Dependency direction

`app` composes `pages` and `features`; `pages` compose `features`; `features` use `shared`; `shared` imports nothing from features, pages, or app. No circular imports and no reaching into another feature's internals.

## Testing

One boundary: Playwright (`tests/app.spec.ts`) drives the real app in a real Chromium, with the real router, history, cookies, and localStorage. The config starts `npm run dev` (or reuses a server already on port 5173), so tests run against the same app reviewers use. Later tickets add cases to this file and control time with Playwright's clock API.

## Design

Plain MUI: the default light theme with a few deliberate overrides in `src/app/theme.ts` (primary blue, light gray background, 8px radius, flat buttons without uppercase). Light only.
