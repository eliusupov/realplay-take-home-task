# 04: Open authenticated modals from query parameters

**What to build:** A visitor follows a modal link, registers with attribution intact when necessary, returns to the original page, and sees the intended modal. URL modals appear one at a time in link order; closing one removes only its parameter and immediately reveals the next. The modal-stack provider exposes `openModal`/`closeModal`; query parameters are the only way modals open.

**Effort level:** High.

**Blocked by:** [03: First-touch attribution](03-first-touch-attribution.md) — integrates with its completed capture → registration → session/logout flow, including the app and auth delivered by tickets 01–02.

**Status:** done

## Read only these spec sections

- [Code organization and coding standards](../SPEC.md#code-organization-and-coding-standards) — feature ownership, discriminated types, naming, and lifecycle cleanup.
- [Stack and application responsibilities](../SPEC.md#stack-and-application-responsibilities) — React Context modal provider and one authenticated root renderer; reuse the existing app composition.
- [URL-triggered modals](../SPEC.md#url-triggered-modals) — exact trigger mapping, link order, closing, history, and duplicate-key defaults.
- [Modal provider and stack behavior](../SPEC.md#modal-provider-and-stack-behavior) — `openModal`/`closeModal`, one-way URL sync, idempotency, and auth gating.
- [Registration modal interpretation](../SPEC.md#registration-modal-interpretation) — `signup=1` open question, neutral placeholder contents, and minimal Invite behavior.
- [Routes and redirect flow](../SPEC.md#routes-and-redirect-flow) — `from` router state, return-to-origin, and history behavior.
- [Error handling and accessibility](../SPEC.md#error-handling-and-accessibility) — modal focus, safe text values, and auth/redirect errors.
- [Behaviors to verify](../SPEC.md#behaviors-to-verify) — items 1–2, 6–9, and 11–12 for modal integration. Reuse the existing non-modal checks.

Read only the linked headings and inspect the existing session/capture/logout interfaces. The earlier tickets and full conversation are not required context.

## Acceptance criteria

- [x] A React Context modal-stack provider exposes `openModal({ type, params })` and `closeModal(type)` to descendants. One root MUI renderer; no modal content renders while unauthenticated.
- [x] Map Welcome, Promo, Invite, and Registration to the specified query parameters as a discriminated union. Display the promo code or inviter identifier as safe text with clearly demonstrative content, without invented business APIs.
- [x] One root URL-sync component is the only in-app caller of `openModal`. On each location change it calls `openModal` for each recognized parameter in URL order and `closeModal` for entries whose parameter disappeared. No launch buttons or other programmatic opening.
- [x] `openModal` is idempotent per type (updates params, never duplicates), so re-renders and StrictMode double effects are harmless. Opening never changes the URL.
- [x] `closeModal(type)` removes the entry and deletes only that key (all occurrences) from the URL with route replacement, preserving other modal/attribution/unrelated keys and the hash. The next entry shows immediately.
- [x] Render only the first entry: one Dialog, one backdrop, one focus trap. Close control, Escape, and backdrop click all close. Verify labels and focus restoration through the sequence.
- [x] `signup=1` is handled exactly like the other triggers, with no special cases. Authenticated: a modal titled "Registration" with a short neutral placeholder line and Close only — no account creation, no claims about its purpose. Unauthenticated: redirect to `/register` like any trigger.
- [x] Every valid unauthenticated modal link captures attribution before redirect, redirects to `/register` with `from`, and after registration returns to the original location where its modals open. No redirect loops or duplicate registration logic.
- [x] Cold load, refresh, back/forward, and in-app navigation (e.g. `/` ↔ `/account`) follow the current URL; changed or removed triggers update or remove their entries.
- [x] Logout clears all entries and uses the existing clean-home navigation, so nothing reopens. Preserve ticket 03's attribution and UUID behavior.
- [x] Keep typed modal variants and sync rules within the modal feature. Reuse existing auth, attribution, routing, and logout behavior; no competing stores or effects.
- [x] Extend the Playwright harness for link → attribution → registration → return → modal, URL order, parameter/hash preservation, history/refresh, in-app navigation, provider API via context, authenticated-only rendering, `signup=1` placeholder, focus, and logout. Run the combined checks, type-check, lint, and production build.
- [x] Commit the ticket.

## Completion and scope

Finish the README: link-order presentation, the `signup=1` open question (placeholder modal; would confirm with the team), illustrative Promo/Invite contents, mock authentication, no-login logout, verification commands, and example links combining multiple modal parameters with attribution (no real credentials). This is part of completing the feature, not a separate cleanup ticket.

Do not add bonus redemption, friend lookup, game/event registration, another signup endpoint, modal-launch buttons, persistent modal stacks, or URL mutation when opening a modal.
