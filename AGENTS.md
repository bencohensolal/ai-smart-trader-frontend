# AGENTS.md

## Project Objective

Build a React TypeScript SPA to help invest intelligently in cryptocurrencies with a progressive, testable and secure approach.

## Language Policy

- All code (source, comments, variable names, etc.), documentation, commit messages, and any project communication MUST be written in English only. No French or other languages are allowed in any part of the repository.
- Exception: translation files in `src/i18n/` (e.g., `en.ts`, `fr.ts`) may contain non-English content for localization purposes only.

## General Guidelines

- Maintain modular React architecture (`src/components`, `src/pages`, `src/i18n`, etc.)
- Favor small, composable components; avoid monolithic files
- Keep files short and focused (Single Responsibility Principle)
- Prioritize maintainability: readable, decoupled, consistent, and simple to evolve code
- All new code must be strictly typed (no `any` without explicit justification)
- Centralize configuration and design tokens
- All business data is fetched via backend API (no direct DB or market API access)
- Never commit secrets (API keys, tokens); use environment variables for config
- Any feature evolution requested on this project must be replicated in the mobile project `../ai-smart-trader-apk/` to maintain feature parity
- With each backend/frontend change (API, business rules, parameters, filters, screens), analyze and implement the impact on the APK in the same work cycle
- Maintain a coherent contract between web and APK: endpoints, payloads, validation rules, business labels and key behaviors must remain aligned
- If a feature cannot be ported immediately to the APK, explicitly document the gap and catching-up plan before task closure

## Frontend Standards

- Treat frontend code as a senior-level product: clear architecture, reusable components, strict separation of concerns
- Never include backend logic in frontend files
- Avoid monolithic inline templates; favor modular structure (components, styles, business/UI logic separated)
- Centralize design tokens (colors, typography, spacing, shadows, breakpoints)
- Guarantee accessibility (keyboard navigation, contrast, labels, visible focus, correct HTML semantics)
- Guarantee responsive quality mobile/desktop
- Favor explicit state patterns (no fragile implicit logic)
- Add frontend tests suited to criticality level (unit, integration, e2e)
- Any refactoring must improve readability, testability and evolvability

## Quality and Testing

- Add at minimum:
  - unit tests for critical components
  - e2e tests for main flows
- Test coverage must remain at 100% (branches, functions, lines, statements)
- Automatic quality checks are mandatory before merge: format, lint, unit tests with coverage, e2e tests (`npm run quality:check`)

## Contribution Workflow

- Small and targeted commits with clear message
- One commit should correspond to single main intention (feat, refactor, test, docs)
- Separate as much as possible functional code, refactoring, tests and documentation into distinct commits
- Avoid "mixed" commits combining multiple unrelated subjects
- Commit regularly locally (no mandatory push) as soon as coherent batch is finished
- Keep each commit in valid state: green build + local quality OK
- Mandatory commit message format (Commitizen): `type(name): summary` then empty line then description
- Before validating a change: `npm run quality:check`
- Mandatory `pre-commit` hook via Husky: must execute `npm run quality:check` and block commit on failure
- **Mandatory AGENTS awareness proof before each commit**:
  - Reload this `AGENTS.md` file in memory
  - Run `npm run agents:ack` to generate a local acknowledgement token bound to the current `AGENTS.md` hash and timestamp
  - The `pre-commit` hook validates this acknowledgement and blocks the commit if missing, stale, or inconsistent with current `AGENTS.md` content
  - If blocked, re-read `AGENTS.md`, run `npm run agents:ack`, then retry commit
- **Commit corrections (fixes to immediately-prior commit)**: If changes are purely corrections of errors in the previous commit (e.g., build errors, missing imports, typos introduced just before), use `git commit --amend --no-edit` to squash into the previous commit rather than creating a separate commit. This prevents "fix" commits and keeps history clean.
- When changing public API, update associated documentation.

## File Maintenance

This file is the source of truth for project general guidelines.
For each new cross-cutting constraint (architecture, security, quality, conventions), update `AGENTS.md` in the same change as the code involved.
