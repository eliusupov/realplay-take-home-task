# Registration with Attribution + Redirect

## Problem Statement

Visitors arrive through campaign links, browse, and may come back later through another campaign before they sign up. The app must keep the first campaign that brought them (for 30 days) and send it with a successful registration. Links can also open Welcome, Promo, Invite or Registration modals. Modals are for signed-in users only, so signed-out visitors must register first and then land back on the link they opened. Source: `docs/Home Task - FE.pdf`.

## Solution

A React 18 + TypeScript + Vite app with MUI, React Router (data router), React Query and the React Compiler. Routes: `/`, `/register`, `/account` (protected). Attribution lives in a first-party cookie and is captured before any redirect. Registration is a React Query mutation against an MSW mock of `POST /register` that carries the attribution in its body. The URL is the only modal state; one renderer at the root shows one modal at a time to signed-in users. A remembered return location brings new users back to the link they opened.

## User Stories

1. As a marketer, I want every `utm_*` key plus `ref`, `gclid` and `fbclid` captured on the first visit, so that a sign-up is credited to the campaign that brought the visitor.
2. As a marketer, I want the first touch kept for 30 days while the visitor is not registered, so that a later campaign does not take the credit.
3. As a marketer, I want a tracked visit after 30 days to replace the record and restart the clock, so that stale campaigns stop getting credit.
4. As a marketer, I want untagged visits to store nothing, so that a direct visit does not block a later campaign click.
5. As a visitor, I want attribution captured before any redirect, so that being sent to `/register` does not lose it.
6. As a backend developer, I want the attribution in the `POST /register` body, so that the new account is linked to its source.
7. As a visitor, I want attribution cleared only after a successful registration, so that a failed attempt can be retried with it and a success never sends it twice.
8. As a signed-in visitor, I want `welcome`, `promo`, `invite` and `signup` links to open their modal on any page, on cold load, refresh, back/forward and in-app navigation, so that a link works wherever it lands.
9. As a signed-in visitor, I want one modal at a time in link order, with closing removing only its own param, so that each modal gets attention and the rest stay pending.
10. As a signed-out visitor with a modal link, I want to be sent to `/register` and returned to the link after registering, so that I still see its modals.
11. As a visitor who leaves `/register` before signing up, I want to still return to the link I opened once I register, so that a detour does not lose it.
12. As a visitor, I want every link and redirect to keep the query string, so that moving around never strips the link I arrived with.
13. As a developer, I want `openModal({ type, params })` and `closeModal(type)` from any component, so that modals need no prop drilling.
14. As a visitor, I want a minimal email and password form with clear errors, a pending state and a success toast, so that signing up is quick and I know it worked.
15. As a registered visitor, I want my session kept across reloads and a way to log out, so that a refresh does not sign me out and I can end the session.

## Implementation Decisions

### Attribution and cookies

- Tracked keys: `utm_*` by prefix, plus `ref`, `gclid`, `fbclid`. Empty values are ignored; a repeated key keeps its first value. Modal keys and other params are not attribution.
- Capture runs in a layout effect in `Layout` while signed out, on every load and query change, before any redirect (`src/utils/attribution.ts`). Unknown URLs render Page not found inside the layout, so a mistyped campaign link still captures.
- One first-touch record `{ params, capturedAt }` in the first-party cookie `realplay_attribution`: URI-encoded JSON, `Path=/`, `SameSite=Lax`, `Secure` on https, `Max-Age` = time left of the 30 days. Written by JavaScript, so not HttpOnly.
- Rule: a fresh record (younger than 30 days by `capturedAt`) is kept and new params are ignored. No fresh record (missing, expired or invalid) and a tracked visit: save a new record with `capturedAt = now`. Otherwise store nothing.
- Renewal: each capture re-writes a fresh record with its remaining lifetime; `capturedAt` never moves. Safari caps script-written cookies at 7 days, so re-writing keeps the record for a visitor who returns within that cap, never past 30 days.
- `capturedAt` decides; the 30-day check runs on every read. Cookie expiry is only cleanup.
- Registration sends the fresh record or `null`. Success expires the cookie; failure keeps it.
- After logout, capture pauses until the next full page load: logging out is not a new visit.
- No anonymous visitor id and no fallback when cookies are blocked.

### Session

- Mock user `{ id, email }` as JSON in the browser-session cookie `realplay_session` (same attributes, no `Max-Age`). Read synchronously at start, so a reload stays signed in; a malformed cookie means signed out.
- Signed-in header: Log out button and an avatar with the email's initial linking to `/account`.
- Logout: pause capture, go to `/` keeping the query, delete the cookie, clear the user and the React Query cache, close the toast. Attribution is kept.

### Modals

- The URL is the only modal state (`src/context/ModalProvider.tsx`). `useModals()` exposes `modals` (read from the query), `openModal({ type, params })` (sets the trigger in the URL as a new history entry, overwriting that key's value; no-op if already there) and `closeModal(type)` (removes only its key, every occurrence, with replace; other params keep their values, re-encoded).
- Triggers: `welcome=1`, `promo=<code>`, `invite=<friendId>`, `signup=1`. `welcome` and `signup` need `1`; `promo` and `invite` need a non-empty value. Invalid values are ignored and left in the URL. A repeated key opens one modal with its first value.
- `ModalRenderer` at the root shows the first modal in link order as one MUI Dialog, only when signed in. Close button, Escape or backdrop closes it and reveals the next.
- Cold load, refresh, back/forward and in-app navigation need no extra code: the modals always follow the current URL.
- `signup=1` shows a "Registration" modal with a short neutral confirmation (see Further Notes).

### URLs and redirects

- Routes: `/` home, `/register`, `/account` (protected), anything else renders Page not found. Unexpected route errors show "Something went wrong" with a Reload button (the root `errorElement`).
- Signed out on `/account`, or on any page but `/register` with a modal trigger: redirect (replace) to `/register` keeping the query, with router state `from` = `{ pathname, search, hash }`.
- `/register` remembers the intended location in sessionStorage (`src/utils/returnLocation.ts`): `from`, or `/` plus its own query when that query has modal triggers. The newest link wins; a plain `/register` visit keeps the stored one.
- Signed in on `/register` (just registered, or arrived with a session): go (replace) to the current page's link, else the remembered location, else `/` plus `/register`'s own query and hash. Then forget the remembered location.
- Every in-app link and button, the redirect to `/register`, the return after registering and logout keep the query string as is. Links and the redirect to `/register` drop the hash; the redirect keeps it in `from`, so the return restores it.
- Signed out with a modal trigger in the URL, the header hides Home and shows the logo as plain text, since every page would redirect back to `/register`.

### Registration

- Form: email (format check) and password (8+ characters, never trimmed). A field's error shows on blur and clears while typing; submit validates both and focuses the first invalid field.
- React Query mutation posting JSON `{ email, password, attribution }` to `/register`. Pending disables submit and shows progress.
- MSW mock (browser worker in every mode, Node server in tests): 500 ms delay, re-validates input (400), `fail@example.com` returns HTTP 500 with a message and the form allows retry, otherwise 201 `{ user: { id, email } }`.
- Success clears attribution, starts the session and shows a toast owned by the layout, so it survives the redirect. Leaving the page mid-request does not sign the visitor in; the account is still created and attribution still cleared.

### Code standards

- React 18 with the React Compiler (`babel-plugin-react-compiler`, target `18`); no manual `useMemo`, `useCallback` or `memo`.
- Strict TypeScript, typescript-eslint strict type-checked rules, react-hooks lint, Prettier. Cookie, storage and mock request data are validated, not cast; the mock's response is trusted.
- One owner per state: URL for modals, a cookie for attribution, React state backed by a cookie for the session, sessionStorage for the return location, React Query for request state, a module flag for the post-logout capture pause.
- No code comments; conditional JSX lives in named render functions. Folders: `components`, `pages`, `routes`, `context`, `hooks`, `api`, `utils`, `mocks`, `test`.

## Testing Decisions

- Unit and component: Vitest + React Testing Library on jsdom, in `src/**/__tests__` next to the code. `renderWithProviders` uses the real routes and providers; an MSW Node server serves the same handlers, and unhandled requests fail.
- End to end: Playwright (Chromium) in `e2e/`, split by area, against the dev server with real history, cookies and the MSW worker.
- 30-day rule: Playwright's clock (`page.clock.setFixedTime`) moves page time but not the browser's cookie clock, so these tests exercise `capturedAt`. The session cookie is seeded with `context.addCookies()`; cookies are read with `context.cookies()`.
- Tests go through roles, labels, URLs and the `POST /register` body, not internals.

## Out of Scope

- Backend, real authentication, login, password recovery, session expiry.
- Server-set, HttpOnly or cross-subdomain cookies; they need a backend.
- Cross-device attribution, anonymous visitor ids, fingerprinting.
- Analytics, reporting and conversion uploads.
- Real promo, invite or game behavior.
- Modal priority other than link order; a persisted modal stack.
- React 19, external state libraries, hosting.

## Further Notes

### Assumptions

- Same user means the same browser profile.
- Only tracked visits start the 30-day window.
- Safari (7 days for script-written cookies, 24 hours after some tracked-link navigations), private browsing and users can drop the cookie before 30 days. Server-set cookies would fix that and need a backend.
- Promo and Invite show only the value from the link.

### Open question

The task maps `signup=1` to a Registration modal but shows modals only to signed-in users, who already have an account. Its purpose is not specified, so it shows a short neutral confirmation and is handled like the other modals. Would confirm with the team.

### References

- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies): attributes, `Max-Age`, JavaScript vs HttpOnly.
- [WebKit: Tracking Prevention](https://webkit.org/tracking-prevention/): current caps on script-written cookies.
- [WebKit: Intelligent Tracking Prevention 2.1](https://webkit.org/blog/8613/intelligent-tracking-prevention-2-1/): where the 7-day cap on `document.cookie` started.
- [Chrome: cookie Max-Age/Expires cap](https://developer.chrome.com/blog/cookie-max-age-expires): lifetimes are capped at 400 days; 30 days is well inside it.
