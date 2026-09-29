# Realplay: registration with attribution and redirect

A small React demo that captures first-touch marketing attribution, preserves it through registration and redirects, and opens URL-triggered modals. The backend and accounts are mocked.

Everything the task asks for is in place: first-touch attribution, mock registration and session with return to the requested page, and URL-triggered modals.

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

Full verification: `npm run typecheck && npm run lint && npm test && npm run build`.

## Stack

React 18, TypeScript (strict), Vite, MUI (Emotion), React Router, React Query, MSW 2 (mock API). No global state library: React Query owns request state and React Context owns the session and the modal stack. React Compiler runs on React 18 (`babel-plugin-react-compiler` with `target: '18'` and `react-compiler-runtime`), so components carry no manual `useMemo`/`useCallback`/`memo`; `eslint-plugin-react-hooks` enforces the compiler rules.

## Registration and session (mock)

- Routes: `/` home, `/register` inline sign-up form, `/account` protected account page.
- Form rules: a well-formed email (format only) and a password of at least 8 characters. The password is never trimmed or altered. The mock server re-checks both rules.
- Failure trigger: registering with `fail@example.com` always returns HTTP 500 with a safe message. Change the email and submit again to retry.
- The request is a real `fetch('/register', { method: 'POST' })` with a JSON body `{ email, password, anonymousVisitorId, attribution }` (see [Attribution](#first-touch-attribution)), answered by [MSW](https://mswjs.io) (Mock Service Worker, `public/mockServiceWorker.js`, generated with `npx msw init public --save`). It is visible in DevTools > Network. The worker starts before the first render in dev, build, and preview; only `POST /register` is mocked, so `GET /register` still serves the app. MSW console logging is off so the request body (with the password) is never printed.
- On success the mock returns a user (`id`, `email`) and an unsigned, JWT-shaped demo token (`alg: "none"`, no signature, no password). The app stores the token in the `realplay_session` cookie (Path `/`, SameSite Lax, Secure on HTTPS, no expiry: it lasts for the browser session) and keeps the user in React Context. The password is never stored, logged, or put in the token.
- A protected page visited without a session redirects to `/register`, remembering the requested location (path, query, hash). After registering, or when `/register` is opened with a session already present, the app returns there. Without a remembered location it goes to `/` with `/register`'s own query and hash. A success toast survives the redirect.
- Reload keeps the session (the cookie is read synchronously before any route renders). A malformed cookie is ignored. If the cookie cannot be written, the app still signs you in for this page view and says that a reload will sign you out.
- The header shows an avatar with the email's first letter (links to `/account`) and Log out. Log out deletes the cookie, clears the session, the React Query cache and every open modal, and returns to a clean `/` (no query, no hash), so nothing reopens. Attribution and the anonymous visitor id stay.
- There is no login: after logging out you can only register a new mock account.
- Security limits: the cookie is written by JavaScript, so it cannot be HttpOnly, and the token is decoded in the browser without verification. This is demonstration behavior; a real backend would validate the session and set an HttpOnly cookie. Production traffic would use HTTPS.

## First-touch attribution

- Captured keys: every nonempty query key starting with `utm_`, plus exactly `ref`, `gclid`, and `fbclid`. Everything else (`welcome`, `promo`, `invite`, `signup`, ...) is ignored. Values are read with `URLSearchParams` and stored as decoded strings, otherwise untouched (click IDs are opaque). For a repeated key the first nonempty value wins.
- Stored in localStorage under `realplay_attribution` as `{ params, capturedAt }` (`capturedAt` is an ISO 8601 time). The anonymous visitor id is a separate key, `realplay_anonymous_visitor_id`, created once with `crypto.randomUUID()` and reused across navigation, reloads, and attribution replacement.
- First-touch rule, applied only while signed out, on entry and on every URL query change, before a protected route redirects to `/register`:
  - a fresh record (younger than 30 days) is kept as is: no merging, no new timestamp;
  - with no fresh record (missing, expired, or corrupt), a visit with tracked parameters replaces it with a new record captured now;
  - a visit without tracked parameters stores nothing and does not start a window. No values like `utm_source=direct` are invented, so a direct first visit never blocks a campaign click that follows.
- 30-day window: a record is expired when its age is 30 days or more (one shared constant, `ATTRIBUTION_DURATION_MS`). Expiry is checked on every read, since localStorage never expires by itself. An expired record is never sent.
- Registration sends a snapshot taken for each request: `anonymousVisitorId` and `attribution` (the fresh record, or `null`). A failed request keeps the record for a retry; a successful one removes the record but keeps the anonymous id. Logout removes neither; after logout the same rule applies with the same id. Signed-in visits capture nothing.
- The anonymous id labels this browser profile only: no cross-device identity, no proof a campaign click happened. The window is an app rule, not guaranteed retention: private browsing, browser privacy features, or clearing site data can remove both keys earlier.
- If localStorage cannot be written, both values live in memory for the current page, and a notice says campaign details are lost on reload. A corrupt or future-dated stored record is treated as absent. When site data is blocked entirely, the MSW worker cannot start either, so the mock registration fails with an error (a limit of the mock, not the app).
- The mock server checks the new fields (UUID format, record shape, tracked keys only) and returns 400 otherwise.
- Nothing in the UI shows the pending record: inspect it in DevTools > Application > Local Storage and in the `POST /register` payload under Network.

Example links (dev server):

- Campaign landing on a protected page, captured before the redirect: <http://localhost:5173/account?utm_source=google&utm_medium=cpc&utm_campaign=spring&gclid=Cj0KCQ>
- Referral plus modal parameters (not captured as attribution; signed out, they lead to registration first): <http://localhost:5173/?ref=partner42&fbclid=IwAR0abc&welcome=1&promo=SPRING>
- A later campaign that does not replace a fresh record: <http://localhost:5173/?utm_source=instagram&utm_medium=social>

## URL modals

| Query parameter     | Modal        | Content                                                                          |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `welcome=1`         | Welcome      | A short greeting.                                                                |
| `promo=<code>`      | Promo code   | The code from the link, labelled as demo content: no promotion is applied.       |
| `invite=<friendId>` | Invitation   | The inviter id from the link and a generic line; nothing is looked up or joined. |
| `signup=1`          | Registration | A neutral placeholder (see the open question below).                             |

- Modals open only from these parameters, on any page, on cold load, refresh, back/forward, and in-app navigation. There are no launch buttons. `welcome` and `signup` count only with the value `1`; `promo` and `invite` need a nonempty value. Keys are case-sensitive; anything else (`welcome=2`, `promo=`, `Welcome=1`) is ignored and left in the URL. Values are shown as plain text (never HTML) and long values wrap.
- Link order decides the sequence: modals show one at a time in the order their parameters appear, and campaign or unrelated parameters do not affect it. A repeated key counts once, at its first occurrence and with its first value.
- Closing (Close, Escape, or a backdrop click) removes only that modal's key from the URL (every occurrence of it), with route replacement, keeping every other parameter and the hash. The next modal shows immediately. Opening a modal never changes the URL.
- Modals render only for a signed-in visitor. A signed-out visitor opening a modal link on any page other than `/register` is sent to `/register` (attribution is captured first), and after registering returns to the original URL, where the modals open. `/register?promo=X` itself does not redirect and, after registering, continues to `/?promo=X`.
- The URL is the only source of modal intent: a React Context provider (`src/features/modals`) exposes `openModal({ type, params })` and `closeModal(type)`, and one root sync component is the only caller of `openModal`, following every location change. One root renderer shows the first entry only (one dialog, one backdrop, one focus trap). The stack is not persisted; it is rebuilt from the URL.
- Open question: The task maps `signup=1` to a Registration modal but shows modals only to authenticated users; its purpose is not specified, so it is a placeholder handled like the other modals. Would confirm with the team. It creates no account and makes no claims; a signed-out visitor is redirected to register like any other modal link, and returns to the same URL, so the placeholder then shows.

Example links (dev server; any email and an 8+ character password register a mock account):

- Promo then Welcome, with attribution, on a protected page: <http://localhost:5173/account?utm_source=newsletter&utm_campaign=spring&promo=SPRING&welcome=1#top>
- All four in link order, with a referral and an unrelated parameter: <http://localhost:5173/?ref=partner42&welcome=1&invite=friend_8f3a2c&lang=en&promo=SPRING&signup=1>
- Repeated and ignored keys: <http://localhost:5173/?promo=FIRST&gclid=Cj0KCQ&promo=SECOND&welcome=2&invite=friend_1>

## Folder structure

```
src/
  main.tsx        entry: fonts, starts the MSW worker, React root
  app/            application composition: providers, router, theme, shell (header, root toast)
  pages/          route pages: HomePage, RegisterPage, AccountPage
  features/
    attribution/  first-touch capture, 30-day expiry, registration snapshot and cleanup, anonymous visitor id
    registration/ request contract, shared validation rules, registration form (React Query mutation)
    session/      session cookie and token decoding, SessionProvider (React Context), RequireSession guard
    modals/       modal types and URL parsing, ModalProvider (React Context), URL sync, redirect guard, root renderer
  mocks/          MSW worker and the POST /register handler
  shared/         toast context: the shell renders the root toast, pages show it
tests/
  app.spec.ts     the single Playwright harness
tsconfig.app.json   browser code (src/): DOM types only, no Node globals
tsconfig.node.json  Node code: tests and config files
```

## Dependency direction

`app` composes `pages` and `features` (the shell triggers attribution capture and hosts the modal sync and renderer); `pages` compose `features`; `registration` uses `session`'s public types and `attribution`'s snapshot and cleanup; `modals` uses `session`'s user and its redirect to `/register`; `mocks` reuses the registration and attribution checks; `shared` imports no app, page, or feature code. No circular imports and no reaching into another feature's internals.

## Testing

One boundary: Playwright (`tests/app.spec.ts`) drives the real app in a real Chromium, with the real router, history, cookies, and localStorage. The config starts `npm run dev` (or reuses a server already on port 5173), so tests run against the same app reviewers use, including the MSW worker. Covered so far: validation errors, duplicate-submit prevention, `fail@example.com` and retry, return to the requested page with a toast, session reload, protected access, malformed cookies, a blocked cookie write, and logout. Attribution tests pin time with Playwright's clock API (`setFixedTime`, which fakes the date but keeps timers running) and cover capture before the redirect, the request payload, retention within 30 days, the exact expiry boundary (29d 23h 59m kept, 30d expired), replacement after expiry, `attribution: null` after an untagged expired visit, an untagged first visit, retry after a failure, cleanup on success, logout keeping the record and the id, no capture while signed in, corrupt records, and failing storage. Modal tests cover a modal link through attribution, registration and return, a direct `/register?promo=` link that shows nothing until registration, link order, closing by button, Escape and backdrop with only its key removed (other parameters and the hash kept), repeated and invalid keys, refresh, back/forward and in-app navigation, `signup=1` signed in and signed out, logout, and dialog labels and keyboard focus. The context API (`openModal`/`closeModal`) is covered through the URL sync and renderer, not by calling provider internals.

## Design

Plain MUI: the default light theme with a few deliberate overrides in `src/app/theme.ts` (primary blue, light gray background, 8px radius, flat buttons without uppercase). Light only.
