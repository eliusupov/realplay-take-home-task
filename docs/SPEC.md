# Registration with Attribution + Redirect

## Problem Statement

Visitors arrive through campaign links, may navigate before registering, and may return later through a different campaign. The application must preserve the correct first-touch attribution and include it in a successful registration request without losing it during navigation, authentication redirects, or failed submissions.

Links also carry instructions to open Welcome, Promo, Invite, or Registration modals. Those instructions must work on a fresh load, refresh, browser back/forward, and in-app navigation. Unauthenticated visitors must register before seeing modals or accessing the protected account page, and after registering they return to the page they originally requested.

This is a frontend take-home demonstration for Real Play. The supplied task defines the routing, modal triggers, attribution window, and mocked registration flow. It does not define detailed casino, promotion, invitation, or game-enrollment behavior.

This spec synthesizes the conversation. Explicit task requirements, user-selected decisions, and proposed implementation defaults are distinguished below.

## Solution

Build a React 18, TypeScript, and Vite application using MUI, React Router, and React Query. Session and modal state live in React Context; no external state library. Provide a home page, a registration page, and a protected account page. Use one modal-stack provider and one authenticated modal renderer at the app root.

Capture attribution before any registration redirect. Persist one first-touch record in a first-party cookie for a 30-day window, started only by a visit that carries tracking parameters, alongside a browser-scoped anonymous UUID in its own cookie. Submit the attribution and UUID with the registration credentials to a mocked endpoint (MSW) through a React Query mutation.

On successful registration, establish the mock session in a cookie and React state, clear the pending attribution, return the visitor to the originally requested location (path, query, hash), and show a success toast. The navigation must not destroy the toast.

For URL-triggered modals, the order of recognized parameters in the link determines presentation order. Show one modal at a time. Closing it removes only its own parameter and immediately reveals the next remaining eligible modal.

Logout ends the mock session, clears modal and cached user state, and navigates home keeping the query string. It does not clear attribution or the anonymous UUID; successful registration clears the submitted attribution. Demo sessions have no automatic expiry.

## User Stories

1. As a visitor, I want a home page, so that I can enter the application without registering immediately.
2. As an unregistered visitor, I want a dedicated registration page, so that I can create an account without needing an authenticated modal.
3. As a registered visitor, I want a protected account page, so that I can view my account information.
4. As an unauthenticated visitor, I want account-page access to redirect to registration, so that protected content is not displayed before authentication.
5. As a visitor arriving from a campaign, I want the application to capture my initial tracking parameters, so that my later registration retains its original marketing source.
6. As a visitor, I want every incoming parameter beginning with `utm_` to be captured, so that the application supports more than a fixed list of UTM fields.
7. As a visitor, I want `ref`, `gclid`, and `fbclid` to be captured, so that referral and provider click identifiers survive the registration flow.
8. As a visitor, I want unrelated query parameters to remain separate from attribution, so that modal instructions and other URL state are not mistaken for campaign metadata.
9. As a returning unregistered visitor within 30 days, I want my original attribution retained, so that a later campaign does not replace my first touch.
10. As a returning unregistered visitor, I want revisits to leave the original capture time unchanged, so that the attribution window does not slide forward indefinitely.
11. As an unregistered visitor returning through a campaign after the attribution window expires, I want the new campaign to replace the previous attribution and restart the clock, so that expired attribution is not credited indefinitely.
12. As a visitor arriving without campaign parameters, I want nothing recorded, so that a campaign click later still receives credit.
13. As a visitor, I want attribution to survive navigation and ordinary browser reloads, so that registration need not occur on the landing page.
14. As a visitor redirected to registration, I want attribution captured before the redirect, so that changing routes does not lose my campaign information.
15. As a visitor, I want an anonymous UUID for my browser journey, so that anonymous activity can be associated with my registration.
16. As a visitor, I want that UUID reused during the journey, so that each page view does not create a different identity.
17. As a visitor using another device or browser, I want the demo to behave predictably as a separate anonymous journey, so that it does not pretend to have cross-device identity.
18. As an authenticated visitor opening a Welcome link, I want a Welcome modal, so that the link's intent is honored.
19. As an authenticated visitor opening a Promo link, I want to see the supplied promo code, so that I understand the promotion referenced by the link.
20. As an authenticated visitor opening an Invite link, I want to see the supplied friend identifier, so that the invitation's source is represented.
21. As an authenticated visitor opening a signup link, I want a Registration modal, so that the link's intent is honored.
22. As a reviewer, I want the Registration modal's unspecified purpose shown as a neutral placeholder and documented, so that no product behavior is invented.
23. As an unauthenticated visitor opening any modal link, I want to be redirected to registration, so that modals remain restricted to authenticated users.
24. As a visitor redirected to registration, I want to return to the page I originally requested — path, query, and hash — after registering, so that the redirect loses neither my place nor my modal intent.
25. As an authenticated visitor opening a URL from scratch, I want its modal to appear, so that cold loads work without prior application state.
26. As an authenticated visitor refreshing a page, I want the URL's modal intent restored, so that refresh behavior is consistent.
27. As an authenticated visitor using browser back or forward, I want modals to follow the current URL, so that history navigation is respected.
28. As an authenticated visitor navigating within the app (for example between home and account), I want modal parameters in the destination URL recognized, so that deep links work without reloading.
29. As a visitor with several modal parameters, I want the link's parameter order to determine the sequence, so that link authors control presentation order.
30. As a visitor, I want only one modal visible and interactive at a time, so that dialogs do not compete for attention or focus.
31. As a visitor closing a URL-triggered modal, I want only that modal's parameter removed, so that other modal instructions and unrelated URL data survive.
32. As a visitor closing the current modal, I want the next remaining modal shown immediately, so that the remaining link instructions are handled consistently.
33. As an application developer, I want any descendant component to reach `openModal({ type, params })` and `closeModal(type)` through context, so that modal control does not depend on prop drilling.
34. As an authenticated visitor following a modal link, I want opening the modal to leave its URL intact until dismissal, so that opening does not consume the trigger prematurely.
35. As a visitor, I want repeated renders and URL synchronization to avoid duplicate modal entries, so that a single trigger does not produce repeated dialogs.
36. As a visitor, I want keyboard-accessible modals and sensible focus restoration, so that modal interactions work without a mouse.
37. As a registering visitor, I want a minimal form with only email and password, so that signing up is quick.
38. As a registering visitor, I want email-format validation, so that obvious input mistakes are caught before submission.
39. As a registering visitor, I want a simple minimum password length, so that trivially short passwords are rejected.
40. As a registering visitor, I want clear field errors, so that I know what to correct.
41. As a registering visitor, I want a pending state and duplicate-submit prevention, so that one action does not create concurrent registration attempts.
42. As a registering visitor, I want failed requests to show an error and permit retry, so that temporary failures do not end the flow.
43. As a registering visitor, I want failed requests to preserve attribution, so that a successful retry still carries my first touch.
44. As a registering visitor, I want my saved attribution included in the registration request body, so that the backend can associate it with the new account.
45. As a newly registered visitor, I want the browser's pending attribution cleared only after success, so that it is neither lost prematurely nor reused accidentally.
46. As a newly registered visitor, I want to be logged into the demo automatically, so that I can access authenticated content immediately.
47. As a newly registered visitor, I want a success toast that remains visible after navigation, so that I know registration completed.
48. As a registered visitor, I want my mock session restored after an ordinary reload, so that authentication does not disappear with React's in-memory state.
49. As a registered visitor, I want an avatar showing my email's initial and a logout button, so that I can recognize and control my session.
50. As a registered visitor, I want clicking the avatar to navigate to my account, so that account access is easy to discover.
51. As a registered visitor, I want logout to end my session without deleting attribution or my anonymous UUID, so that session cleanup does not discard journey data.
52. As a visitor, I want malformed or unavailable browser storage handled without crashing, so that browser restrictions do not break registration.
53. As a visitor, I want credentials excluded from persistent browser data, logs, and tokens, so that the demo does not unnecessarily expose passwords.
54. As a reviewer, I want assumptions and mock limitations documented, so that I can distinguish task compliance from production authentication or analytics.
55. As a visitor, I want my first touch and anonymous UUID kept in first-party cookies, so that persistence follows the industry-standard mechanism that a backend can later read and take over.
56. As a returning visitor, I want each visit to renew the cookies' remaining lifetime without moving the capture time, so that browser caps on script-written cookies do not drop my first touch while I keep returning.
57. As a visitor whose browser refuses cookies, I want attribution kept for the page session with a notice, so that registration still carries it and I know a reload would lose it.
58. As a reviewer, I want attribution and the UUID visible under the site's cookies in DevTools, so that I can verify capture without reading code.
59. As a visitor who leaves the registration page before signing up, I want to still return to my original link and see its modals after registering, so that a detour does not lose the link's intent.
60. As a visitor, I want every navigation and redirect to keep the URL's query parameters, so that moving around the app never strips the link I arrived with.
61. As a signed-out visitor with a pop-up link pending, I want no Home button, so that I am not bounced back to registration by a link that cannot take me home.

## Implementation Decisions

### Requirement and decision precedence

- The supplied PDF is the complete assignment (its second page is blank).
- Explicit assignment requirements govern routing, modal authentication, first-touch retention, and the registration payload.
- The title's "+ Redirect" is satisfied by returning the visitor to the originally requested location after registration.
- User-selected decisions: React Context instead of an external state library; a minimal email/password form; a session cookie; an anonymous UUID; the email-initial avatar; logout without attribution or UUID cleanup; URL order for modals; MSW for the mocked endpoint; only tracked visits start the attribution window; first-party cookies (the industry-standard mechanism) for attribution and the anonymous UUID, replacing the earlier localStorage choice.
- Closing a URL modal removes only its own parameter.
- Promo and Invite contents are demonstrative, derived only from their parameter values. The Registration modal is a neutral placeholder because the task does not specify its purpose.
- Proposed edge-case defaults below complete the design without introducing unrelated product features.

### Stack and application responsibilities

- Use React 18, TypeScript, Vite, MUI, React Query, React Router, and MSW (mock endpoint only).
- Remain on React 18 as requested. Use React Compiler on React 18 (`babel-plugin-react-compiler` with `target: '18'` plus `react-compiler-runtime`) and its lint rules; do not add manual `useMemo`/`useCallback`/`memo` unless the compiler cannot cover a case. React 19, Redux Toolkit, Zustand, and a separate toast library are unnecessary for this scope.
- Keep the implementation simple: deliver the requirements with best practices and nothing more.
- Use MUI Dialog for modal presentation and MUI Snackbar, optionally containing Alert, for notifications.
- Keep responsibilities small: attribution capture/persistence, mocked registration, session state, modal provider, URL synchronization, routes/forms, and root-level notifications.
- React Context (with `useState`/`useReducer`) holds reactive session and modal state. Cookies handle persistence; cookie changes alone do not trigger React rendering.
- Expose a modal-stack provider with `openModal({ type, params })` and `closeModal(type)`. Do not add a second competing source of modal state.
- Register one modal renderer at the application root. Render modal content only when the mock session is authenticated.
- Registration uses a React Query mutation. Keep request state in React Query rather than duplicating pending/error state in Context.
- Do not persist the modal stack. Rebuild it from the URL.

### Code organization and coding standards

These standards apply to all implementation work. They reflect the user's request for a clean, production-ready folder structure and clear naming; authentication and business services remain explicitly mocked.

- Use a conventional React layout: `components/`, `pages/`, `routes/` (router config and route guards), `context/`, `hooks/`, `api/`, `utils/`, `mocks/`. Create a folder only when it holds real code; no barrel files or speculative layers.
- Keep dependency direction clear: pages and components use hooks, context, api, and utils; utils import nothing from React layers. Avoid circular imports.
- Write self-documenting code with no comments. Replace inline conditional JSX (`&&`, ternaries, inline `.map` blocks) with named render functions called from the JSX.
- The root route has an `ErrorBoundary` as its `errorElement` for unexpected errors. Unknown URLs render a Page not found page inside the app layout, so header, attribution capture, and modal handling still apply (a campaign link with a mistyped path keeps its first touch).
- Use descriptive domain names such as attribution, capturedAt, anonymousVisitorId, returnLocation, and registeredUser. Name booleans as predicates, actions as verbs, and time values with explicit units.
- Enable strict TypeScript. Model modal variants and API contracts explicitly. Treat parsed cookies, URL values, and request bodies as untrusted until validated; avoid unchecked casts, non-null assertions, and unexplained any types.
- Keep components, hooks, and functions focused. Separate rendering from attribution/session rules without creating unnecessary service, repository, factory, or adapter layers.
- Keep one owner for each state: React Query for registration request state, React Context for the session, the URL for modal intent (the provider's modal list is written only from the URL), and cookies for persisted records.
- Centralize actual shared constants and repeated rules, particularly cookie names, cookie attributes, and cookie lifetimes (including the attribution duration). Do not create configuration for values that have no genuine variation.
- Clean up listeners, subscriptions, timers, and asynchronous work. Handle repeated React development execution, route changes, logout, and late request completion safely.
- Use MUI/native accessibility features, semantic elements, associated labels/errors, keyboard operation, and responsive layouts. Do not replace accessible controls with click-only containers.
- Unit/component tests live in a `__tests__` folder next to the code (Vitest + React Testing Library, MSW node server); real-browser flows live in `e2e/` (Playwright).
- Configure consistent linting and formatting, reproducible dependency installation, and scripts for development, type checking, linting, tests, production build, and preview. Keep the toolchain small and compatible with React 18.
- Test externally visible behavior at a focused application boundary. Share one harness, control time in tests, and avoid tests coupled to provider internals or component implementation details.
- Keep secrets and credentials out of source, persisted client state, diagnostics, and logs. Document mock security limitations and every deliberate product assumption.
- Delivery is a git repository with a lean `README.md` (what it is, how to run it, key behavior, example links). Commit each completed change separately.
- Every completed change must leave the app runnable, pass its relevant checks, and update the README when its behavior changes it. Remove unused scaffold code and dependencies.

### Routes and redirect flow

| Route | Behavior |
| --- | --- |
| `/` | Public home page. |
| `/register` | Public registration page with an inline email/password form; the form is not an unauthenticated modal. |
| `/account` | Protected account page showing the mock user's information. |

- A fresh load means an initial browser visit or refresh, rather than only an in-app route transition. In-app navigation means router transitions such as moving between `/` and `/account`.
- Initialize attribution capture and mock-session restoration before authentication-dependent redirects or modal rendering.
- An unauthenticated request for a protected page or a valid modal trigger redirects (replace) to `/register` keeping the query string, and passes the original location (pathname, search, hash) as router state `from`. Do not redirect when already on `/register`.
- Router state cannot be set by an external link, so `from` needs no open-redirect validation. It survives a reload of `/register`; opening `/register` fresh has no `from`.
- Remember the intended location for the tab session in sessionStorage: `from` after a redirect, or `/` with `/register`'s own query and hash when a direct `/register` link carries modal triggers. A plain `/register` visit does not overwrite it. It is per-tab navigation state, so it is not a cookie: it must not leak into other tabs or ride along to the server.
- Once authenticated on `/register` — after registration success, or on arrival with an existing session — navigate (replace) to `from`, else the remembered location, else `/` with `/register`'s own query and hash (so a direct `/register?promo=X` link keeps its modal intent). Then forget the remembered location.
- A visitor who leaves `/register` before signing up (for example by clicking Home) and registers later still returns to the original link and sees its modals.
- The returned location's modal parameters then display, first eligible modal in URL order. `signup` gets no special handling.
- Preserve attribution in its cookie independently of redirect URL construction.
- The query string is kept, exactly as is, across every in-app navigation and redirect: links and buttons (header logo, Home, account avatar, the home page's Register, Page not found's Go to home), the redirect to `/register`, the return after registering, and logout. Links drop the hash.
- While signed out with modal triggers in the URL, the header hides Home and shows the logo as plain text: every page would redirect back to `/register`.
- Use route replacement for automatic auth redirects and for removing a closed modal's URL parameter. Explicit user navigation may add history entries normally.
- Back/forward must still follow actual browser history: if navigation returns to an entry containing a trigger, that trigger is eligible again.
- Keep the success notification at the root so the registration-page unmount does not dismiss it.
- Explicit logout navigates to `/` keeping the query (no hash). Attribution capture then pauses until the next full page load: logging out is not a new visit, while a reload with campaign parameters is, and records them again when no fresh record exists.

### URL-triggered modals

| Query parameter | Modal | Content in this demo |
| --- | --- | --- |
| `welcome=1` | Welcome | A short greeting and introduction. |
| `promo=<code>` | Promo | The supplied code and clearly mocked promotion information. |
| `invite=<friendId>` | Invite | The supplied inviter identifier and a generic invitation message. |
| `signup=1` | Registration | A neutral placeholder titled "Registration"; the task does not specify its purpose. |

- Recognize `welcome` and `signup` only when the value is `1`. Recognize `promo` and `invite` only when their values are nonempty.
- Treat query keys as case-sensitive and use `URLSearchParams` rather than manual string concatenation.
- Process recognized modal parameters in their existing URL order. Attribution and unrelated parameters do not affect modal ordering.
- Show one modal at a time. When the visible modal closes, remove its key and immediately show the next eligible remaining modal.
- Closing includes the close control, Escape, and backdrop click.
- Remove only the closed modal's query key. Preserve all other modal keys, campaign keys, unrelated keys, and the hash.
- Opening from a URL does not change that URL: the instruction is already present.
- Navigating to a URL that removes or changes a trigger removes or updates that modal (see provider section); stale contents never remain visible.
- Duplicate keys: one modal per recognized key, using its first occurrence. Closing removes all occurrences of that key, not other modal keys.
- Modal ordering is controlled by link authors. No developer-defined priority overrides the URL order.

### Modal provider and stack behavior

- A React Context provider exposes `openModal({ type, params })` and `closeModal(type)` to any descendant. Types are the four task modals, modeled as a discriminated union.
- Query parameters are the only way modals open; the task defines no other trigger. One root URL-sync component is the only in-app caller of `openModal`. No launch buttons or other programmatic opening.
- Data flows one way, URL → provider. On every location change the sync component calls `openModal` for each recognized parameter in URL order, and `closeModal` for entries whose parameter is gone (back/forward, navigation).
- `openModal` is idempotent per type: an existing entry of that type has its params updated instead of being duplicated. Re-renders, StrictMode double effects, and repeated syncs are therefore harmless without extra de-duplication logic.
- `closeModal(type)` removes the entry and, if its key is in the URL, deletes only that key with route replacement.
- Entries keep URL order and the root renderer shows only the first, so there is one Dialog, one backdrop, and one focus trap. Closing it reveals the next. "Stack" is the task's name; presentation is first-in-first-out by link order.
- Enforce authentication at the root renderer regardless of query parameters. Unauthenticated triggers redirect to `/register` with `from` (see routes); there is no separate unauthenticated queue. The remembered return location (see routes) carries modal intent across detours.
- Logout clears all entries and keeps the query. Modal triggers still in the URL send the now signed-out visitor to `/register` and reopen only after signing up again.

### Registration modal interpretation

- The task maps `signup=1` to a Registration modal but restricts all modals to authenticated users, who already have an account. It also requires a real registration form at `/register`. It does not say what the modal registers for.
- It could mean a newsletter, campaign, event, or something else. Do not guess.
- Treat `signup=1` exactly like the other triggers: logged-out visitors are redirected to register; logged-in visitors see a modal titled "Registration" with a short neutral placeholder line and a Close action. No other controls or claims.
- No special cases: `signup` is not removed after registration, so a visitor who registers from a `signup=1` link returns to that URL and sees the placeholder.
- Document the open question in the README: "The task maps `signup=1` to a Registration modal but shows modals only to authenticated users; its purpose is not specified, so it is a placeholder handled like the other modals. Would confirm with the team." Real content drops into this one modal once clarified.
- Do not invent an enrollment API or allow the Registration modal to create a second account.
- The Invite modal's target is similarly unspecified. Display the inviter data without claiming that a particular game, room, or event has been joined.

### Attribution and anonymous identity

- Capture all query keys beginning with `utm_`, plus exactly `ref`, `gclid`, and `fbclid`.
- Capture by prefix rather than maintaining a hardcoded list of UTM fields.
- Provider click IDs are opaque strings: preserve their values rather than decoding them.
- `ref` is app-defined referral metadata; it differs from the `invite` modal parameter and from the browser's HTTP referrer.
- Exclude `welcome`, `promo`, `invite`, and `signup` from attribution.
- Persist one first-touch record: `{ params, capturedAt }` (captured parameter map and original timestamp).
- Persist the anonymous UUID separately so clearing submitted attribution does not clear the journey identity. Logout also preserves it.
- Generate the UUID once with `crypto.randomUUID()`. Reuse it across navigation, refresh, and attribution replacement.
- The UUID labels a browser profile, not a verified person. It does not provide cross-device identity, authentication, or proof that a campaign click occurred.
- Persist nonempty attribution values as decoded strings without modifying opaque IDs. For repeated attribution keys, use the first occurrence.
- The window is 30 elapsed days from `capturedAt`. A record is expired when its age is greater than or equal to 30 days.
- Capture rule, applied while unauthenticated at application entry and on route changes, before any redirect:
  - Fresh record exists → keep it; ignore incoming parameters. Never merge or move its timestamp.
  - No fresh record (missing, expired, or invalid) and the visit carries tracked parameters → save a new record with `capturedAt = now`, replacing any old record entirely.
  - Otherwise → do nothing.
- An expired record is treated as absent: it is never submitted.
- While authenticated, do not capture. The demo uses session state for this gate; it does not keep an account registry after logout.
- Snapshot the fresh record (or `null`) for each registration request. Failed submissions leave it intact; successful submissions clear it.

### Untagged visits and 30-day scenarios

- A visit without tracked parameters stores nothing and does not start a window. Do not invent values such as `utm_source=direct`.
- Rationale: a direct first visit must not block credit for a paid campaign click that follows.

| Scenario | Expected first-touch state |
| --- | --- |
| First visit from Google on day 0 | Google parameters, captured on day 0. |
| Instagram visit on day 10 | Original Google parameters and day-0 timestamp. |
| Untagged visit on day 20 | Original Google parameters and day-0 timestamp. |
| Instagram visit at or after day 30 | Instagram parameters and a new timestamp. |
| Untagged visit at or after day 30 | Expired record ignored; nothing new stored; registration sends `attribution: null`. |
| Untagged first visit, campaign visit the next day | Campaign parameters, captured on the campaign visit. |
| Registration with no record | Request body contains `attribution: null`. |
| Successful registration | Pending browser attribution is cleared. |
| Failed registration | Original pending attribution remains available for retry. |
| Explicit logout | Session and modal state are cleared; attribution and anonymous UUID are preserved. Ordinary capture rules apply after logout. |

### Storage choice and limitations

- Persist attribution and the anonymous UUID in first-party cookies, the standard mechanism for click-ID and visitor-ID persistence (for example Google Ads `_gcl_aw`, Google Analytics `_ga`, Meta `_fbc`/`_fbp`).
- One cookie per record: `realplay_attribution` holds the URI-encoded JSON record `{ params, capturedAt }`; `realplay_anonymous_visitor_id` holds the UUID.
- Every app cookie (session, attribution, UUID) shares one attribute set: `Path=/`, `SameSite=Lax`, `Secure` on HTTPS, host-only (no `Domain`). Define it once.
- Lifetimes use `Max-Age`, never `Expires`, so expiry does not depend on converting the app's clock into a date: attribution 30 days from capture, UUID 400 days (the longest cookie lifetime Chrome honors).
- Whenever capture runs (application entry and route changes while unauthenticated), re-write each valid cookie with the same value and its remaining lifetime (attribution: 30 days minus its age; UUID: a fresh 400 days). The registration snapshot also renews the UUID. Browsers that cap JavaScript-written cookie lifetime (Safari) then keep the cookies while the visitor keeps returning within that cap. Re-writing never changes `capturedAt`.
- `capturedAt` stays authoritative: enforce the 30-day rule from it on every read. Cookie expiry is cleanup only; the cookie is client-editable, and test clocks do not move the browser's cookie clock.
- These cookies are written by JavaScript, so they cannot be HttpOnly. The registration request reads them and places the values in its JSON body. The browser also sends them in the `Cookie` header of same-origin requests; the body remains the contract and the mock reads only the body.
- Do not mirror attribution or the UUID into localStorage, sessionStorage, or IndexedDB. Earlier localStorage keys are not migrated (demo).
- Handle missing cookies, undecodable values, malformed JSON, invalid timestamps, invalid UUIDs, and blocked cookies without crashing.
- Verify each write by reading it back. A write that does not read back (cookies disabled, or a value over the roughly 4 KB per-cookie limit) keeps that value in memory for the current page session. A probe cookie checked once at load decides whether to disclose that reload persistence is unavailable; an individually oversized record falls back silently.
- Recovery: treat an invalid attribution record as absent (the capture rule then applies); replace an invalid UUID with a new one.
- A 30-day window is an application rule, not guaranteed retention. Browser privacy policies (Safari caps JavaScript-written cookies at 7 days, and at 24 hours after some navigations from known trackers with decorated links), private browsing, and user deletion can remove data earlier.
- Production path (out of scope: there is no backend): the server sets these cookies with `Set-Cookie` and reads attribution from the request at registration. Server-set cookies escape Safari's cap on script-written cookies, can be HttpOnly, can use `Domain` to share attribution across subdomains, and reach the server from the first request.
- Restrict cleanup to this application's cookies. Clearing attribution expires `realplay_attribution` with `Max-Age=0` and the same attributes.

### Registration form, validation, and request contract

- Minimal form: required email and password inputs only. No confirmation field, strength meter, or visibility toggle.
- Use `type="email"`, `autocomplete="email"` / `autocomplete="new-password"`, MUI labels, and associated error text.
- Validate email syntax (format only, not ownership). Password: at least 8 characters; never trim or alter it.
- Show a field's error when it loses focus; typing in it clears the error until the next blur. Submit validates both fields and focuses the first invalid one.
- The MSW handler re-checks the same rules as the trust-boundary demonstration.
- Disable repeat submission while pending, show progress, and keep errors understandable and retryable.
- Use a React Query mutation that calls `fetch('/register', { method: 'POST' })` with a JSON body.
- Mock with MSW (Mock Service Worker):
  - A browser service worker answers the real request, so it and its payload are visible in DevTools → Network, and tests can inspect the same request.
  - Generate `public/mockServiceWorker.js` with `npx msw init public --save`.
  - Start the worker before the first render in every mode — dev, build, and preview — since there is no backend. Use `onUnhandledRequest: 'bypass'`.
  - The handler matches only `POST /register`; `GET /register` still serves the SPA page.
- Request body: `{ email, password, anonymousVisitorId, attribution: { params, capturedAt } | null }`.
- Use ordinary JSON string fields; no Base64 encoding, custom encryption, or frontend password hash.
- Production transmission uses HTTPS/TLS. Credentials never belong in query parameters, logs, analytics events, persisted browser storage, or token claims.
- Deterministic failure: email `fail@example.com` returns HTTP 500 with a safe message. No random failures.
- Success returns a mock user identity and a mock session token. Error responses provide a suitable status and safe message.
- Never retain raw credentials in the mock response, stored user record, diagnostics, or a request-history display.
- If showing submitted attribution on the account page, show only non-credential fields.

### Mock authentication, avatar, and logout

- Model mock authentication using a token cookie plus user state in a React Context.
- The mocked endpoint may return a JWT-shaped token containing mock user identity. It must not contain the password or claim real cryptographic authentication.
- No signing secret is embedded in the browser. Client-side token decoding is demonstration behavior.
- The frontend writes the demo cookie on success: Path `/`, SameSite Lax, and Secure on HTTPS. A browser-session cookie is sufficient for reload persistence.
- No token expiry, session-expiry timers, or refresh behavior.
- This JavaScript-written cookie cannot be HttpOnly. A production backend would validate a real session and set an HttpOnly cookie; that is out of scope.
- Initialize session state from a well-formed cookie synchronously, before the first route decision. Reject malformed tokens.
- Cookie existence alone is not genuine authentication. All protected-route checks here are mock frontend behavior.
- Header for authenticated users shows the email's first letter in an accessible avatar control and a logout control. Clicking the avatar navigates to `/account`.
- Account page displays the mock user's email and identity.
- Logout deletes the session cookie, clears session and modal state and application-owned cached user data, and navigates to `/` keeping the query. It must not remove attribution or the anonymous UUID. Prevent pending registration completions from restoring a session after logout.
- There is no login. After logout, the visitor can only register a new mock account; ordinary capture rules apply using the same UUID.

### Error handling and accessibility

- Keep attribution until the registration API actually succeeds. Validation and request errors do not clear it.
- Do not show a success toast or authenticate the user on a failed request.
- Storage/cookie failures must not leave an invisible error or create a redirect loop. If session persistence fails after success, say so rather than pretending a reload will retain the session.
- Use native/MUI accessibility features for labelled fields, focus trapping and restoration, keyboard dismissal, accessible avatar controls, and loading/error announcements.
- Only the visible modal renders, so only it owns focus.
- A basic app-level error fallback is reasonable for unexpected rendering errors. Expected registration or storage errors use normal UI recovery.
- Treat URL and submitted attribution as untrusted input. Validate names, types, and reasonable sizes; render values as text, never raw HTML.
- Campaign parameters and client-generated UUIDs cannot authorize bonuses, rewards, account access, or other privileged actions.
- Do not add custom state frameworks, generalized storage adapters, modal plugin systems, or production authentication infrastructure.

## Testing Decisions

### Proposed testing boundary

- Unit/component tests (Vitest + React Testing Library, jsdom) in a `__tests__` folder next to the code they cover. Render through the real providers and router (`src/test/renderWithProviders.tsx`); the MSW node server serves the same handlers as the browser worker.
- End-to-end tests (Playwright) in `e2e/`, split by area, drive the real app in a real browser (real history, cookies, and the MSW worker). Control time with Playwright's clock API for the 30-day rule; no time-travel controls in the product UI. The clock moves page time, not the browser's cookie expiry, so the 30-day tests exercise `capturedAt`.
- Seed and inspect attribution and UUID cookies through the browser context's cookie APIs; prior art is the existing attribution e2e suite and the session-cookie helper.
- Test behavior through public interfaces (roles, labels, URLs, the outbound `POST /register` body), not provider internals. Assert attribution and identity fields without logging credentials.
- A few focused, meaningful checks per file. No tests that restate implementation details.

### Behaviors to verify

1. A campaign/modal URL captures attribution before redirecting an unauthenticated visitor to registration, including all `utm_` keys and the three explicitly named tracking keys.
2. Successful registration sends the original attribution and anonymous UUID in the body, establishes the mock session, clears pending attribution, returns to the originally requested location with its modal intent, and displays a toast that survives navigation.
3. A later campaign and an untagged revisit within the window cannot overwrite first touch or extend its timestamp.
4. At the 30-day boundary a tagged visit replaces the whole record and resets time; an untagged visit stores nothing and registration sends `attribution: null`. An untagged first visit does not block a later campaign.
5. A failed registration (`fail@example.com`) preserves attribution and allows a successful retry; invalid email, too-short password, and repeat submissions are handled predictably.
6. Cold load, refresh, back/forward, and in-app navigation (e.g. `/` ↔ `/account`) synchronize modal contents and avoid duplicates.
7. Multiple URL modal parameters display one at a time in link order. Closing the visible one removes only its key, preserves unrelated query/hash state, and immediately displays the next.
8. `openModal`/`closeModal` are reachable through context, opening leaves the URL unchanged, and no modal renders before authentication regardless of its trigger.
9. Authenticated `signup=1` shows the placeholder Registration modal and creates no account; an unauthenticated signup link redirects to the registration page like any other trigger.
10. Session reload restoration and protected-route handling work; malformed cookies do not grant protected access. There is no automatic session expiry.
11. Logout clears session, cached user, and modal state while preserving any pending attribution and the UUID. Subsequent unauthenticated capture follows the same first-touch rules without resetting a retained timestamp or regenerating the UUID. Capture pauses after logout until the next full page load.
12. Corrupt, undecodable, or refused cookies do not crash the app; when the browser refuses cookies, attribution is kept for the page session with a notice; an oversized record falls back silently; keyboard navigation and modal focus/dismissal remain usable.
13. Attribution and UUID cookies carry `Path=/`, `SameSite=Lax`, and the specified lifetimes; each visit re-writes them without moving `capturedAt`; successful registration expires only the attribution cookie.
14. A visitor who leaves `/register` (e.g. via Home) and registers later returns to the original link with its modals; the remembered location is then forgotten. Every navigation and redirect keeps the query string; while signed out with a pop-up pending, the header offers no way home.

## Out of Scope

- Cross-device attribution, identity matching before authentication, fingerprinting, or a shared-ID link service.
- Real analytics collection, dashboards, campaign reporting, or conversion uploads to Google, Meta, or other providers.
- Provider click IDs beyond `gclid` and `fbclid`, except arbitrary `utm_` keys covered by the prefix rule.
- A "direct/unknown" classification for untagged visits.
- Production backend, user database, secure JWT issuance/validation, refresh tokens, real server sessions, MFA, login, or password recovery.
- Server-set, HttpOnly, or cross-subdomain (`Domain`) attribution cookies; these need a backend.
- Password confirmation, strength feedback, visibility toggle, email verification, password blocklists, breached-password screening, and session expiry.
- Real bonus redemption, payments, rewards, friend-invite acceptance, game registration, room/event enrollment, or gameplay.
- Guessing the Registration modal's purpose (newsletter, campaign, event, or another product).
- Opening modals other than from URL parameters (launch buttons, programmatic calls), persistent modal stacks, or inserting URL parameters when `openModal()` is called.
- Fixed modal priority; link order decides.
- Removing other modal parameters when closing one URL-driven modal.
- React 19, Redux Toolkit, Zustand, IndexedDB, or a separate toast library.
- Hosting or deployment; delivery is the git repository, run locally.

## Further Notes

### Accepted assumptions to document with the delivered app

- Same user means the same browser profile. The anonymous UUID is not a cross-device identity.
- Attribution and the UUID live in JavaScript-written first-party cookies; browser privacy policies (notably Safari) can shorten their lifetime below 30 days.
- Only visits with tracked parameters start the 30-day window; untagged visits record nothing.
- Registration success returns to the originally requested location and establishes the mock session automatically.
- The Registration modal is a placeholder; its purpose is an open question for the team (see Registration modal interpretation).
- Promo and Invite are demonstrative modal contents.
- Link order determines the modal sequence. Closing one immediately presents the next.
- Registration success clears attribution; logout preserves attribution and the anonymous UUID.
- No login: after logout the visitor can only register a new mock account. Use a fresh browser profile or clear this app's site data for a completely new anonymous journey.

### Resolved implementation choices

- Test harness: Playwright against the real app.
- Password rule: email format + password of at least 8 characters.
- Mock: MSW; `fail@example.com` returns HTTP 500.
- Resolve any conflict between these defaults and later interviewer clarification without silently reinterpreting the assignment as a different product.

### Security and storage references reviewed during discussion

- [Google Conversion Linker](https://support.google.com/tagmanager/answer/7549390?hl=en): established ad-click persistence uses first-party cookies and browser local storage; neither is the only acceptable mechanism.
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): browser-scoped persistence with no built-in expiry; the earlier choice, replaced by cookies to match industry practice.
- [MDN cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies): request transmission, expiry, cookie scope, and JavaScript versus HttpOnly access.
- [WebKit tracking prevention](https://webkit.org/tracking-prevention/): browser policies can delete JavaScript-writable storage before the application's requested retention period, including the 7-day and 24-hour caps on JavaScript-written cookies.
- [Chrome cookie lifetime cap](https://developer.chrome.com/blog/cookie-max-age-expires): `Max-Age`/`Expires` beyond 400 days is reduced to 400 days.
- [Google server-side tagging](https://developers.google.com/tag-platform/tag-manager/server-side): the production direction for first-party, server-set measurement cookies.
- [Google User-ID](https://support.google.com/analytics/answer/9213390?hl=en): cross-device behavior requires a shared identity, not just independent browser storage.
- [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): password policy and TLS transport considerations.
- [NIST password requirements](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver): protected password transport and salted password hashing requirements.
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): production password storage uses suitable salted password hashing, with Argon2id as OWASP's preferred general choice.
- [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html): HTTPS protects ordinary request fields in transit; readable JSON in DevTools is not evidence of unencrypted network transport.
- [OWASP input validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html): backend validation applies to client-provided attribution and credentials.

The mock receives the password for registration validation and discards it. It does not persist plaintext, place credentials in a token, or implement custom frontend cryptography. A real backend would use a suitable salted password hash and prevent credential disclosure through logs.
