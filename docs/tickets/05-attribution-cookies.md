# 05: Persist attribution and the anonymous UUID in first-party cookies

**What to build:** Move the first-touch record and the anonymous UUID from localStorage to first-party cookies, the industry-standard mechanism. Capture, expiry, payload, cleanup, and logout behavior stay exactly as ticket 03 delivered them; only the persistence mechanism and its lifetime handling change.

**Effort level:** Medium.

**Blocked by:** [03: First-touch attribution](03-first-touch-attribution.md) — replaces its localStorage persistence; cookies become the only store.

**Status:** done

## Read only these spec sections

- [Attribution and anonymous identity](../SPEC.md#attribution-and-anonymous-identity) — unchanged rules the new persistence must keep.
- [Storage choice and limitations](../SPEC.md#storage-choice-and-limitations) — cookie names, attributes, lifetimes, re-write on each capture, fallback, limitations.
- [Mock authentication, avatar, and logout](../SPEC.md#mock-authentication-avatar-and-logout) — the existing session cookie whose attributes are shared.
- [Proposed testing boundary](../SPEC.md#proposed-testing-boundary) — cookie APIs in Playwright; the clock does not move cookie expiry.
- [Behaviors to verify](../SPEC.md#behaviors-to-verify) — items 1–5 and 11–13.

## Acceptance criteria

- [x] `realplay_attribution` holds the URI-encoded JSON record `{ params, capturedAt }`; `realplay_anonymous_visitor_id` holds the UUID. The attribution feature no longer touches localStorage.
- [x] One shared attribute set for every app cookie (`Path=/`, `SameSite=Lax`, `Secure` on HTTPS, host-only), reused by the session cookie.
- [x] `Max-Age` lifetimes: attribution 30 days from capture, UUID 400 days. No `Expires`.
- [x] Whenever capture runs, re-write each valid cookie with its remaining lifetime (UUID: fresh 400 days; the registration snapshot also renews it). `capturedAt` never moves.
- [x] `capturedAt` stays authoritative for the 30-day rule on every read.
- [x] Every write is verified by reading it back; a refused write keeps the value in memory for the page session. A load-time probe cookie decides the existing reload notice.
- [x] Undecodable, malformed, or invalid values are treated as absent; an invalid UUID is replaced.
- [x] Registration body unchanged. Success expires only the attribution cookie (`Max-Age=0`, same attributes); logout keeps both.
- [x] Unit tests and Playwright tests seed/inspect cookies instead of localStorage; cover attributes and lifetimes, re-write on each visit, undecodable values, and a refused cookie write. Keep the 30-day clock tests. Type-check, lint, unit tests, e2e, and build pass.
- [x] README storage line updated.

## Scope and handoff

No backend, server-set or HttpOnly cookies, `Domain` attribute, localStorage mirror, or migration of earlier localStorage keys.
