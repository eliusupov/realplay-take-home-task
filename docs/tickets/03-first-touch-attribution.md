# 03: Preserve first-touch attribution through registration and logout

**What to build:** A visitor arrives through a campaign, navigates or returns later, then registers with the correct original attribution and anonymous UUID. A failed request retains the record; a successful request clears it. Logout preserves attribution and the UUID.

**Effort level:** High.

**Blocked by:** [02: Registration and session](02-registration-and-session.md) — needs a real registration request path, auth state, redirects, and logout action to integrate and verify.

**Status:** done

## Read only these spec sections

- [Code organization and coding standards](../SPEC.md#code-organization-and-coding-standards) — explicit domain names, persistence validation, and state ownership.
- [Attribution and anonymous identity](../SPEC.md#attribution-and-anonymous-identity) — exact captured keys, UUID, capture rule, and submission snapshot.
- [Untagged visits and 30-day scenarios](../SPEC.md#untagged-visits-and-30-day-scenarios) — untagged visits record nothing; expiry examples.
- [Storage choice and limitations](../SPEC.md#storage-choice-and-limitations) — persistence, recovery, and limitations.
- [Registration form, validation, and request contract](../SPEC.md#registration-form-validation-and-request-contract) — attribution/UUID body fields and success/error handling only; reuse the completed form.
- [Mock authentication, avatar, and logout](../SPEC.md#mock-authentication-avatar-and-logout) — attribution cleanup on registration and preservation on logout.
- [Behaviors to verify](../SPEC.md#behaviors-to-verify) — items 1–5 and 11–12, limited to attribution and logout integration.

Read those headings only. Inspect the existing registration and logout boundaries rather than reloading ticket 02's implementation history or the complete spec.

## Acceptance criteria

- [x] Capture all nonempty `utm_*` values plus `ref`, `gclid`, and `fbclid` before auth redirects. Preserve opaque strings, use `URLSearchParams`, and exclude modal/unrelated parameters. First occurrence wins for duplicate keys.
- [x] Persist one record `{ params, capturedAt }` in first-party cookies (originally localStorage; moved by [ticket 05](05-attribution-cookies.md)). Persist a separate `crypto.randomUUID()` anonymous ID, stable across reloads, navigation, and attribution replacement.
- [x] Capture rule while unauthenticated: a fresh record (< 30 days) is kept untouched — no merging, no timestamp move. With no fresh record (missing, expired, or invalid), a visit carrying tracked parameters saves a new record with `capturedAt = now`, replacing the old one entirely. A visit without tracked parameters does nothing.
- [x] Treat a record aged ≥ 30 days as absent: it is never submitted. Never synthesize values such as `utm_source=direct`.
- [x] Extend the registration body with `anonymousVisitorId` and `attribution: { params, capturedAt } | null` (fresh record snapshot). Failure preserves attribution for retry; success clears only the attribution record, never the UUID.
- [x] Do not capture while authenticated. Preserve the existing cookie/session, form, toast, return-to-origin redirect, and validation behavior.
- [x] Logout must not delete attribution or the UUID. Once unauthenticated, the ordinary capture rule applies. Reuse the UUID; no reset suppression, fresh-visit detection, or account-history tracking.
- [x] Validate stored data and timestamps; treat corrupt records as absent. When cookies cannot be saved, keep the record in memory for the page session and communicate the reload limitation without crashing.
- [x] Keep capture, expiry, snapshot, and cleanup rules in the attribution feature behind a small interface. Use descriptive timestamps/units and one shared duration constant; no generic storage frameworks or duplicate editable state.
- [x] Extend the Playwright harness (time controlled with its clock API) for capture-before-redirect, payload contents, retention within 30 days, the exact expiry boundary, tagged replacement after expiry, untagged-after-expiry sending `attribution: null`, untagged-first-then-campaign, failed retry, successful cleanup, storage failures, and logout preserving the UUID and any fresh attribution. Keep existing checks; pass type-check, lint, and build.
- [x] Update the README (browser-only identity, storage limits, untagged-visit rule, cleanup on registration not logout) and commit the ticket.

## Scope and handoff

This completes attribution through the actual registration flow, not just a standalone storage helper. Modal rendering remains ticket 04; it reuses capture-before-redirect and the return-to-origin redirect.

Do not add an analytics provider, cross-device identification, fingerprinting, a direct/unknown classification, a second copy of attribution in another store (localStorage, IndexedDB).
