# AI Smart Trader Frontend

<p align="center">
  <img src="public/brand/ai-smart-trader-logo.svg" alt="AI Smart Trader Logo" width="520" />
</p>

React + Vite web application for simulating crypto investments in paper trading mode, with real market prices and advanced strategy UI.

## Objective

- 100% simulated funds (no live orders)
- Reference scenario: 300 EUR injected monthly
- Real market data (via backend API)
- Advanced strategy wizard, dashboards, and insights

## Stack

- Frontend: React + Vite (TypeScript)
- Auth: Google SSO (via backend)
- API: REST (NestJS backend)
- Target deployment: Railway

## Prerequisites

- Node.js 20+
- Yarn or npm

## Setup

```bash
npm install
npm run dev
```

## Quality

- Format: Prettier
- Lint: ESLint
- Tests: Vitest + React Testing Library
- 100% coverage required

## Contributing

See AGENTS.md for contribution rules and quality workflow.
