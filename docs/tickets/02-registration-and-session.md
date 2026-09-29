# 02: Register, restore a mock session, and access the account

**What to build:** A visitor submits a minimal email/password form, receives a mock session, returns to the page they originally requested with a success toast, and opens their protected account through an email-initial avatar. Failures can be retried and logout ends the session.

**Effort level:** High.

**Blocked by:** [01: Application foundation](01-project-foundation.md) — requires its running shell, stack, and test harness.

**Status:** done

## Read only these spec sections

- [Code organization and coding standards](../SPEC.md#code-organization-and-coding-standards) — apply throughout this slice.
- [Registration form, validation, and request contract](../SPEC.md#registration-form-validation-and-request-contract) — minimal form, validation, MSW mock, mutation, and safe responses; attribution fields are added in ticket 03.
- [Mock authentication, avatar, and logout](../SPEC.md#mock-authentication-avatar-and-logout) — cookie, React Context session, restore, account, and logout.
- [Routes and redirect flow](../SPEC.md#routes-and-redirect-flow) — `from` router state, return-to-origin, and authenticated `/register`; modal activation is ticket 04.
- [Error handling and accessibility](../SPEC.md#error-handling-and-accessibility) — form, request, session, and rendering errors only.
- [Behaviors to verify](../SPEC.md#behaviors-to-verify) — items 2, 5, and 10–12, limited to registration/session behavior currently implemented.

Read the named headings only. Reuse ticket 01's installed dependencies, structure, and harness; inspect the relevant implementation instead of loading the full spec or prior chat.

## Acceptance criteria

- [x] Implement inline `/register` with required email and password only: email-format validation, password of at least 8 characters, clear accessible errors. No confirmation field, strength meter, or visibility toggle. Never trim or alter the password.
- [x] Add MSW: generate `public/mockServiceWorker.js`, handle only `POST /register`, and start the worker before the first render in dev, build, and preview (`onUnhandledRequest: 'bypass'`). The handler re-validates inputs.
- [x] Submit through a React Query mutation using `fetch('/register', { method: 'POST' })`. Pending UI prevents duplicate requests. `fail@example.com` deterministically returns HTTP 500 with a safe message; retry works.
- [x] Return a mock user and mock token on success; write the demo cookie and update the React Context session. No automatic session expiry. Never persist, log, echo, or include passwords in token claims. The mock does not claim cryptographic authentication.
- [x] Initialize the session synchronously from a well-formed cookie before route guards run. Reject corrupt cookies, keep protected content inaccessible when unauthenticated, and handle cookie-write failure without a redirect loop or false persistence claim.
- [x] Protect `/account`: redirect (replace) unauthenticated visitors to `/register` with the original location (pathname, search, hash) as router state `from`.
- [x] Once authenticated on `/register` (registration success or an existing session), navigate (replace) to `from`; fallback `/` with `/register`'s own query and hash. Show a root-level MUI success toast that survives the navigation.
- [x] Show the email-initial avatar and logout for authenticated users. The avatar opens `/account`, which displays the mock user's email/identity without credentials.
- [x] Logout removes application-owned session/user/cache state and navigates to clean `/`. Disregard late mutation results so they cannot reauthenticate after logout. Do not clear attribution or anonymous identity; ticket 03 verifies their preservation and ticket 04 adds modal cleanup.
- [x] Keep request state in React Query and session state in React Context. Use the shared folder/naming/type standards, labelled inputs, responsive MUI components, safe text rendering, and expected-error recovery.
- [x] Extend the Playwright harness for invalid email, too-short password, pending duplicate prevention, `fail@example.com` + retry, success/toast/return-to-origin (e.g. `/account?x=1#h` → register → back to `/account?x=1#h`), session reload, protected access, invalid cookies, and logout. Pass type-check, lint, tests, and build.
- [x] Update the README (password rule, failure trigger, no-login note) and commit the ticket.

## Scope and handoff

Complete the registration/session journey without inventing attribution values or implementing modals. Ticket 03 extends this real request path with captured attribution and UUID; ticket 04 relies on the return-to-origin redirect to restore modal intent.

Keep the registration request boundary, session access, redirect behavior, and logout action easy to reuse.

Real login, secure token signing, user databases, email verification, and credential storage remain out of scope.
