# Realplay: registration with attribution and redirect

A small React demo that captures first-touch marketing attribution, preserves it through registration and redirects, and opens URL-triggered modals. The backend and accounts are mocked.

Current state: foundation (ticket 01) plus mock registration and session (ticket 02). Attribution and modals arrive in later tickets.

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

React 18, TypeScript (strict), Vite, MUI (Emotion), React Router, React Query, MSW 2 (mock API). No global state library: React Query owns request state and React Context owns the session (modal state arrives in a later ticket). React Compiler runs on React 18 (`babel-plugin-react-compiler` with `target: '18'` and `react-compiler-runtime`), so components carry no manual `useMemo`/`useCallback`/`memo`; `eslint-plugin-react-hooks` enforces the compiler rules.

## Registration and session (mock)

- Routes: `/` home, `/register` inline sign-up form, `/account` protected account page.
- Form rules: a well-formed email (format only) and a password of at least 8 characters. The password is never trimmed or altered. The mock server re-checks both rules.
- Failure trigger: registering with `fail@example.com` always returns HTTP 500 with a safe message. Change the email and submit again to retry.
- The request is a real `fetch('/register', { method: 'POST' })` with a JSON body `{ email, password }`, answered by [MSW](https://mswjs.io) (Mock Service Worker, `public/mockServiceWorker.js`, generated with `npx msw init public --save`). It is visible in DevTools > Network. The worker starts before the first render in dev, build, and preview; only `POST /register` is mocked, so `GET /register` still serves the app. MSW console logging is off so the request body (with the password) is never printed.
- On success the mock returns a user (`id`, `email`) and an unsigned, JWT-shaped demo token (`alg: "none"`, no signature, no password). The app stores the token in the `realplay_session` cookie (Path `/`, SameSite Lax, Secure on HTTPS, no expiry: it lasts for the browser session) and keeps the user in React Context. The password is never stored, logged, or put in the token.
- A protected page visited without a session redirects to `/register`, remembering the requested location (path, query, hash). After registering, or when `/register` is opened with a session already present, the app returns there. Without a remembered location it goes to `/` with `/register`'s own query and hash. A success toast survives the redirect.
- Reload keeps the session (the cookie is read synchronously before any route renders). A malformed cookie is ignored. If the cookie cannot be written, the app still signs you in for this page view and says that a reload will sign you out.
- The header shows an avatar with the email's first letter (links to `/account`) and Log out. Log out deletes the cookie, clears the session and the React Query cache, and returns to a clean `/`.
- There is no login: after logging out you can only register a new mock account.
- Security limits: the cookie is written by JavaScript, so it cannot be HttpOnly, and the token is decoded in the browser without verification. This is demonstration behavior; a real backend would validate the session and set an HttpOnly cookie. Production traffic would use HTTPS.

## Folder structure

```
src/
  main.tsx        entry: fonts, starts the MSW worker, React root
  app/            application composition: providers, router, theme, shell (header, root toast)
  pages/          route pages: HomePage, RegisterPage, AccountPage
  features/
    registration/ request contract, shared validation rules, registration form (React Query mutation)
    session/      session cookie and token decoding, SessionProvider (React Context), RequireSession guard
  mocks/          MSW worker and the POST /register handler
  shared/         toast context: the shell renders the root toast, pages show it
tests/
  app.spec.ts     the single Playwright harness
tsconfig.app.json   browser code (src/): DOM types only, no Node globals
tsconfig.node.json  Node code: tests and config files
```

## Dependency direction

`app` composes `pages` and `features`; `pages` compose `features`; `registration` uses `session`'s public types; `mocks` reuses the registration rules; `shared` imports no app, page, or feature code. No circular imports and no reaching into another feature's internals.

## Testing

One boundary: Playwright (`tests/app.spec.ts`) drives the real app in a real Chromium, with the real router, history, cookies, and localStorage. The config starts `npm run dev` (or reuses a server already on port 5173), so tests run against the same app reviewers use, including the MSW worker. Covered so far: validation errors, duplicate-submit prevention, `fail@example.com` and retry, return to the requested page with a toast, session reload, protected access, malformed cookies, a blocked cookie write, and logout. Later tickets control time with Playwright's clock API.

## Design

Plain MUI: the default light theme with a few deliberate overrides in `src/app/theme.ts` (primary blue, light gray background, 8px radius, flat buttons without uppercase). Light only.
