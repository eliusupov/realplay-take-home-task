# Realplay: registration with attribution + redirect

React 18 take-home: first-touch campaign attribution kept through registration and redirects, plus URL-triggered modals for signed-in users. Backend mocked with MSW.

## Run

Requires Node 24.12+ and npm 11.

```bash
npm ci
npm run dev   # http://localhost:5173
```

## Scripts

- `npm run build`: type-check and production build into `dist/`
- `npm run preview`: serve the production build on http://localhost:4173
- `npm run typecheck`: strict TypeScript, no emit
- `npm run lint`: ESLint
- `npm test`: unit/component tests with Vitest
- `npm run test:e2e`: Playwright end-to-end (first run: `npx playwright install chromium`)

## Try it

Start each block signed out, in a private window, or after DevTools > Application > Storage > Clear site data. Watch Application > Cookies and the `POST /register` body in Network. Signed in = registered at `/register` with any email and an 8+ character password.

**Attribution**

1. Capture: <http://localhost:5173/?utm_source=google&utm_campaign=spring&gclid=G1&fbclid=F1&ref=partner42&other=x>. The `realplay_attribution` cookie holds the five tracked params (not `other`) and `capturedAt`; `realplay_anonymous_visitor_id` holds a UUID.
2. First touch wins within 30 days: then open <http://localhost:5173/?utm_source=instagram>. The cookie is unchanged.
3. Untagged visits record nothing: clean data, open <http://localhost:5173/>. No attribution cookie. Then step 1 captures normally.
4. After 30 days, a new campaign replaces it: after step 1, age the record in the DevTools console, then open <http://localhost:5173/?utm_source=newsletter>. The cookie now holds `newsletter` with a new `capturedAt`. Repeat from step 1 with clean data and `days = 29`: it stays `google`.

   ```js
   const days = 31;
   const [, v] = document.cookie.match(/realplay_attribution=([^;]+)/);
   const r = JSON.parse(decodeURIComponent(v));
   r.capturedAt = new Date(Date.now() - days * 864e5).toISOString();
   document.cookie = `realplay_attribution=${encodeURIComponent(JSON.stringify(r))}; Path=/`;
   ```

5. Sent, then cleared: after step 1, open <http://localhost:5173/register> and register. The payload has `attribution` and `anonymousVisitorId`, a toast shows, and the attribution cookie is gone while the UUID stays.
6. A failure keeps it: after step 1, register with `fail@example.com`. HTTP 500 and an error; the cookie remains. Retry with another email: the payload still carries it.
7. Logout keeps the UUID: after step 5, log out, open <http://localhost:5173/register> and register again. Same `anonymousVisitorId`, `attribution: null`.

**Redirect and modals**

8. Deep link while signed out: <http://localhost:5173/account?utm_source=google&promo=SPRING&welcome=1#top> goes to `/register`. Register: the payload carries the attribution, you return to `/account?...#top`, and Promo then Welcome open.
9. Detour: open the step 8 link, click Home, then Register, and register. You still return to `/account?...` with Promo then Welcome.
10. Link order, one at a time (signed in): <http://localhost:5173/?welcome=1&invite=friend_8f3a2c&promo=SPRING&signup=1>. Closing each (button, Escape, or backdrop) removes only its own param and shows the next. Reorder the params and the order follows.
11. Any page: <http://localhost:5173/account?invite=friend_8f3a2c> (signed in).
12. Refresh and back/forward (signed in): open <http://localhost:5173/?welcome=1> and refresh: it reopens. With it still open, type <http://localhost:5173/account> in the address bar (the modal blocks header clicks), press Back: Welcome reopens; Forward: it closes.
13. `signup=1`: signed out, <http://localhost:5173/?signup=1> goes to `/register`. Signed in, it shows the Registration placeholder.
14. Invalid values are ignored: <http://localhost:5173/?welcome=2&promo=> opens nothing, signed in or out, and doesn't redirect to `/register`.
15. Session: refresh `/account` while signed in and you stay signed in. Log out and you land on a clean `/`.

## Behavior

- Attribution: `utm_*`, `ref`, `gclid`, `fbclid`. First touch kept 30 days in a first-party cookie (`realplay_attribution`), with an anonymous visitor UUID in `realplay_anonymous_visitor_id`; both are renewed on each visit. Safari may cap these script-written cookies at 7 days. Cleared on successful registration, kept on logout.
- Why cookies, not localStorage: first-party cookies are the production standard for attribution (Google `_gcl_aw`, Meta `_fbc`). The server can read and set them, they can span subdomains, and they expire natively; localStorage is JS-only and single-origin. With no backend, JS writes them and the `POST /register` body still carries the values. Server-set HttpOnly cookies (beating Safari's cap) would be a backend-only change.
- Modals: `welcome=1`, `promo=<code>`, `invite=<friendId>`, `signup=1`. Signed-in only, one at a time in link order; closing removes only its own param. A pop-up link survives leaving `/register`: register later and you still return to it.
- In-app links keep the URL's query params; logout goes to a clean `/`.
- Mock auth: email + password of 8+ chars, cookie session; field errors show when you leave a field. No login: after logout you can only register again.
- Open question: The task maps `signup=1` to a Registration modal but shows modals only to authenticated users; its purpose is not specified, so it is a placeholder handled like the other modals. Would confirm with the team.
