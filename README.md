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

- <http://localhost:5173/account?utm_source=google&utm_campaign=spring&gclid=abc&promo=SPRING&welcome=1>: signed out, goes to `/register`, then back with Promo, then Welcome. The `POST /register` payload in DevTools > Network carries the attribution.
- <http://localhost:5173/?ref=partner42&welcome=1&invite=friend_8f3a2c&promo=SPRING&signup=1>: all four modals in link order.
- Register with `fail@example.com` to get an HTTP 500, then change the email to retry.

## Behavior

- Attribution: `utm_*`, `ref`, `gclid`, `fbclid`. First touch kept 30 days in a first-party cookie (`realplay_attribution`), with an anonymous visitor UUID in `realplay_anonymous_visitor_id`; both are renewed on each visit. Safari may cap these script-written cookies at 7 days. Cleared on successful registration, kept on logout.
- Modals: `welcome=1`, `promo=<code>`, `invite=<friendId>`, `signup=1`. Signed-in only, one at a time in link order; closing removes only its own param.
- Mock auth: email + password of 8+ chars, cookie session. No login: after logout you can only register again.
- Open question: The task maps `signup=1` to a Registration modal but shows modals only to authenticated users; its purpose is not specified, so it is a placeholder handled like the other modals. Would confirm with the team.
