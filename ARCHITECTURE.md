# ARCHITECTURE.md

## 1. Technical Vision

AI Smart Trader Frontend is a React + Vite SPA for crypto investment simulation:

- React 19, TypeScript, Vite
- Modular component structure (src/components, src/pages)
- API communication via REST (backend NestJS)
- Google SSO authentication (handled by backend)
- Responsive, accessible, and internationalized UI

## 2. Architecture Principles

- Strict separation frontend/backend
- Reusable, composable UI components
- Centralized state and configuration
- Internationalization (i18n) support
- Accessibility (a11y) by design
- Mandatory quality: format, lint, tests, 100% coverage

## 3. Main Folders

- public/: static assets (logo, icons)
- src/: main source code
  - components/: reusable UI components
  - pages/: route-level pages
  - i18n/: translations
  - theme.ts: design tokens

## 4. Data Flow

- All data fetched via backend API
- No direct DB or market API access
- Auth/session managed by backend

## 5. Deployment

- Railway (static build)
- Docker image via GitHub Actions
