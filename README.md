# Realplay: registration with attribution + redirect

React 18 take-home: first-touch campaign attribution kept from the first visit to sign-up, plus URL-triggered modals for signed-in users. Backend mocked with MSW.

## Run

Requires Node 24.12+.

```bash
npm ci
npm run dev   # http://localhost:5173
```

## How it works

- **Attribution capture** (`src/utils/attribution.ts`, `src/components/Layout.tsx`): while signed out, a layout effect reads `utm_*`, `ref`, `gclid` and `fbclid` before any redirect runs. One first-touch record `{ params, capturedAt }` lives in the first-party cookie `realplay_attribution` (URI-encoded JSON, `Path=/`, `SameSite=Lax`, `Secure` on https). After logout, capture pauses until the next full page load.
- **30-day rule** (`src/utils/attribution.ts`): the cookie is written once at capture with `Max-Age` 30 days. A record younger than 30 days wins and new params are ignored; `capturedAt` never moves. An expired or invalid record counts as absent: the next tagged visit replaces it, untagged visits store nothing.
- **Session** (`src/utils/session.ts`, `src/context/SessionProvider.tsx`): the mock user's JSON sits in the `realplay_session` cookie, is restored on reload and deleted on logout.
- **Modals** (`src/context/ModalProvider.tsx`, `src/hooks/useModals.ts`): the URL is the only modal state. `welcome=1`, `promo=<code>`, `invite=<friendId>`, `signup=1`. `useModals()` returns `modals`, `openModal({ type, params })`, which adds the trigger to the URL, and `closeModal(type)`, which removes only its own key. One modal at a time, in link order, only when signed in; a signed-out visitor with a trigger is sent to `/register`.
- **Query kept everywhere** (`src/components/Header.tsx`, `src/routes/RequireSession.tsx`): every in-app link and button, the redirect to `/register`, the return after registering and logout keep the query string as is. Links and the redirect drop the hash; the redirect keeps it in `from`, so the return restores it. While signed out with a modal trigger in the URL, the header hides Home and the logo is plain text.
- **Return after registering** (`src/pages/RegisterPage.tsx`, `src/utils/returnLocation.ts`): the redirect passes the original location as `from`, and it is also remembered in `sessionStorage`, so leaving `/register` and registering later still returns to the link. Order: the current page's link (`from`, or `/` plus `/register`'s own query when it has modal triggers), then the remembered one, then `/` plus the own query. Then it is forgotten.
- **Mock backend** (`src/mocks/handlers.ts`, `src/api/register.ts`): `POST /register` takes `{ email, password, attribution }`; the attribution cookie is cleared on success and kept on failure. `fail@example.com` gets HTTP 500.

## Why cookies

First-party cookies are the standard for attribution (Google `_gcl_aw`, Meta `_fbc`). With no backend, JS writes them and the `POST /register` body carries the values; server-set cookies would be a backend-only change.

## Try it

Reset before each step: a private window, or DevTools > Application > Storage > Clear site data. "After step 1" means run step 1 first. Watch Application > Cookies and the `POST /register` body in Network. Signed in = registered at `/register` with any email and an 8+ character password.

1. Capture: <http://localhost:5173/?utm_source=google&utm_campaign=spring&gclid=G1&fbclid=F1&ref=partner42&other=x>. `realplay_attribution` holds the five tracked params (not `other`) and `capturedAt`.
2. First touch within 30 days: after step 1, open <http://localhost:5173/?utm_source=instagram>. The cookie value is unchanged.
3. Untagged visits: open <http://localhost:5173/>. No attribution cookie.
4. 30-day expiry: after step 1, run this in the console, then open <http://localhost:5173/?utm_source=newsletter>. The cookie now holds `newsletter` with a new `capturedAt`. With `days = 29` it stays `google`.

   ```js
   const days = 31;
   const [, v] = document.cookie.match(/realplay_attribution=([^;]+)/);
   const r = JSON.parse(decodeURIComponent(v));
   r.capturedAt = new Date(Date.now() - days * 864e5).toISOString();
   document.cookie = `realplay_attribution=${encodeURIComponent(JSON.stringify(r))}; Path=/`;
   ```

5. Sent, then cleared: after step 1, open <http://localhost:5173/register> and register. The payload has `attribution`, a toast shows, and the cookie is gone.
6. Failure keeps it: after step 1, register at <http://localhost:5173/register> with `fail@example.com`. HTTP 500, an error shows, the cookie stays. Change the email and register: the payload still carries it.
7. Deep link while signed out: <http://localhost:5173/account?utm_source=google&promo=SPRING&welcome=1#top> goes to `/register` with the same query; Home is hidden. Register: the payload carries `utm_source`, you land on `/account?...#top`, and Promo then Welcome open.
8. Detour: open the step 7 link, then in the same tab open <http://localhost:5173/> in the address bar, click Register and register. You still land on `/account?...#top` with Promo then Welcome.
9. All four, in link order (signed in): <http://localhost:5173/?welcome=1&invite=friend_8f3a2c&promo=SPRING&signup=1>. Welcome, Invite, Promo, Registration, one at a time. Closing one (button, Escape or backdrop) removes only its param. Reorder the params and the order follows.
10. Invalid values are ignored: <http://localhost:5173/?welcome=2&promo=&signup=0> opens nothing when signed in and does not redirect when signed out.
11. Back/forward (signed in): open <http://localhost:5173/?promo=SPRING>, then open <http://localhost:5173/account> in the address bar. Press Back: Promo opens again. Forward: no modal.
12. Logout keeps the query (signed in): open <http://localhost:5173/account?utm_source=newsletter> and log out. You land on `/?utm_source=newsletter` with no attribution cookie; reload and it is captured.

## Open question

The task maps `signup=1` to a Registration modal, but modals show only to signed-in users, so its purpose is unspecified. It shows a short "You're registered and signed in." confirmation. Would confirm with the team.

## Scripts

- `npm run dev`: dev server on http://localhost:5173
- `npm run build`: type-check and production build into `dist/`
- `npm run preview`: serve the build on http://localhost:4173
- `npm run typecheck`: strict TypeScript, no emit
- `npm run lint`: ESLint
- `npm test`: Vitest unit and component tests
- `npm run test:e2e`: Playwright end-to-end (first run: `npx playwright install chromium`)
