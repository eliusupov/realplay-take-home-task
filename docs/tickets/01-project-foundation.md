# 01: Set up a clean, runnable application foundation

**What to build:** A reviewer can clone the git repository, install dependencies, run a styled home page, and build the application using a consistent toolchain. Later features have clear ownership and a shared verification setup.

**Effort level:** Medium.

**Blocked by:** None (can start immediately).

**Status:** done. Re-implemented from scratch after the earlier version was deleted, then redesigned from the bespoke routing-tag look to plain, tuned MUI.

## Read only these spec sections

- [Stack and application responsibilities](../SPEC.md#stack-and-application-responsibilities) — exact stack and root composition.
- [Code organization and coding standards](../SPEC.md#code-organization-and-coding-standards) — required structure, naming, types, boundaries, checks, and git/README delivery.
- [Routes and redirect flow](../SPEC.md#routes-and-redirect-flow) — route map only; implement the public home in this ticket.
- [Proposed testing boundary](../SPEC.md#proposed-testing-boundary) — one small Playwright harness for the following tickets.

Start with this ticket and those headings, stopping at the next heading of equal or higher level. Do not load the full spec, conversation, or external reference list. Inspect existing workspace changes before creating files.

## Acceptance criteria

- [x] Initialize git in the project root with a `.gitignore` (node_modules, build output, test artifacts).
- [x] Initialize React 18, TypeScript, Vite, MUI, React Router, and React Query with compatible versions, one package manager, and its lockfile. No Zustand or other state library.
- [x] Enable strict TypeScript and consistent linting/formatting. Provide working development, type-check, lint, test, build, and preview scripts.
- [x] Create `README.md` with required runtime, commands, folder structure, and dependency direction. Later tickets extend it.
- [x] Establish clear separation between root application composition, route pages, feature-owned behavior, and genuinely shared primitives.
- [x] Introduce feature folders as their implementations arrive. Do not create empty service/repository layers, placeholder providers, generic factories, or a speculative utility framework.
- [x] Compose the router, query client, and MUI theme at the app boundary. Render a usable, responsive public home with semantic structure and a reusable shell (header) for later auth controls and `/` ↔ `/account` navigation.
- [x] Set up Playwright (`tests/app.spec.ts`) with one meaningful smoke check that the home route renders. Later tickets extend this harness rather than introducing competing runners.
- [x] Use descriptive names, explicit component/contract types, small focused functions, and the shared coding standards. Remove template examples and unused scaffold assets.
- [x] Verify clean installation, home-page rendering, production build/preview, type checking, linting, and the smoke check. No disabled checks or unexplained type/lint suppressions remain.
- [x] Commit the ticket as one descriptive commit.

## Scope and handoff

Its demo is a running home page with passing tooling. Registration, protected account behavior, attribution, and modals arrive in subsequent tickets; do not implement them or display fake completed flows here.

Record the chosen commands, folder ownership, and testing entry point in the README so ticket 02 can start from the working app. No real backend, deployment pipeline, hosting, or production authentication service.

## Notes from the deleted implementation

- Worked with Node 24.12.0 and npm 11. Playwright against the real browser and router was the chosen harness.
- Desktop (1440x900) and mobile (390x844) screenshots of that version remain in `.impeccable/qa/` for visual reference.
