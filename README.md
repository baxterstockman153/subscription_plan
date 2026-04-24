# Bezi AI Account Dashboard

A full-stack subscription and AI usage dashboard built for the Bezi Software Engineer (Accounts) take-home assignment. Users can view their subscription plan, monitor AI credit usage with 7-day and 30-day charts, switch between Free/Pro/Advanced plans via Stripe Checkout, manage connected Unity projects, and run simulated AI actions that consume credits.

## Live Demo

* [Demo Video](https://youtu.be/lJMlt001ZQM)
* [Live Demo](https://subscription-plan-1.onrender.com) 

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | **Next.js 14** (App Router) | File-based routing, SSR-ready, built-in API proxying via rewrites |
| UI | **React 18**, **Tailwind CSS** | Component model + utility-first styling for rapid, consistent UI |
| Icons | **Lucide React** | Lightweight, tree-shakeable icon set |
| Payments | **Stripe.js** + `@stripe/react-stripe-js` | Embedded Checkout for PCI-compliant payment collection |
| Backend | **Express.js** + **TypeScript** | Minimal, well-understood REST framework |
| ORM | **Prisma** | Type-safe database access with migration support |
| Database | **PostgreSQL** | Relational model fits subscription/usage data well |
| Payments (server) | **Stripe Node SDK** | Checkout Session creation, webhook handling, subscription management |
| Deployment | **Render** | One-click deploy with `render.yaml` (web service + managed Postgres) |

## Architecture

```
subscription_plan/
  backend/          Express REST API (port 3000)
    prisma/         Schema + seed script
    src/
      routes/       dashboard, subscription, usageEvents, projects, stripe
      lib/          Prisma client, currentUser mock, Stripe service
      middleware/   Global error handler
  frontend/         Next.js app (port 3001)
    app/            App Router pages (layout, usage, ai-actions, checkout/return)
    src/
      pages/        Page-level components (UsagePage, RunAiActionsPage)
      components/   Reusable UI (AppShell, CheckoutModal, ProjectList, etc.)
      hooks/        Data-fetching hooks (useDashboard, useProjects, useActionHistory)
      api/          Typed fetch client
```

**Data flow:** The frontend proxies all `/api/*` requests to the Express backend via Next.js rewrites (`next.config.js`). The backend queries PostgreSQL through Prisma and returns JSON. Custom React hooks (`useDashboard`, `useProjects`, `useActionHistory`) encapsulate fetch logic and expose `data`, `loading`, `error`, and `refetch`.

**Data model (Prisma):** Five models -- `User`, `Subscription` (1:1 with User), `UsageSummary` (1:1, tracks credits used/limit), `Project` (1:N), and `UsageEvent` (1:N, optionally linked to a Project). The `Plan` enum defines `FREE`, `PRO`, and `BUSINESS` tiers.

## Key Design Decisions

### Stripe Integration
Stripe is **fully integrated** (not mocked) using the real Stripe API in test mode. Paid plan upgrades (Pro/Advanced) open an **Embedded Checkout** modal that creates a Stripe Checkout Session with `ui_mode: "embedded_page"`. On completion, a webhook (`checkout.session.completed`) updates the subscription and credit limit server-side. Downgrading to Free uses a direct API call since no payment is required. The backend also handles `customer.subscription.updated` and `customer.subscription.deleted` webhook events, plus cancel/resume endpoints that set `cancel_at_period_end` on the Stripe subscription.

### Authentication
Auth is **mocked** via `backend/src/lib/currentUser.ts`, which returns a hardcoded user ID (`user_seed_001`). This is documented and acceptable per the assignment instructions, which state "Authentication does not have to be explicitly implemented." In production, this would be replaced with session validation via Stytch or a similar provider.

### Usage & Credits System
Each plan has a monthly credit limit (Free: 100, Pro: 1,000, Business: 10,000). The `UsageSummary` model tracks `creditsUsed` and `creditsLimit` per user. When an AI action is run, a `UsageEvent` is created and both the user's summary and the associated project's `creditsUsed` are atomically incremented. The dashboard endpoint aggregates usage events into daily buckets for the 7-day and 30-day bar charts server-side.

### Project Management
Users can create Unity projects and run AI actions (Generate Script, Analyze Scene, Debug Code, etc.) against them. Each project tracks its own credit consumption and last-active timestamp, enabling per-project usage breakdowns on the Usage page.

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally or a connection string to a remote instance)
- Stripe account (test mode) for `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`

### Backend

```bash
cd backend
npm install
cp .env.example .env        # Edit with your DATABASE_URL and Stripe keys
npx prisma migrate dev      # Create tables
npm run prisma:seed          # Seed demo user, subscription, projects, usage events
npm run dev                  # Starts on http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local with:
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
npm run dev                  # Starts on http://localhost:3001
```

The frontend proxies `/api/*` to `localhost:3000` automatically.

## Trade-offs & Limitations

- **Mocked auth** -- No real session management. Acceptable for a prototype; production would use Stytch with session tokens.
- **No test suite** -- Prioritized feature completeness within the time constraint. Would add Jest + React Testing Library.
- **No real-time updates** -- Data refreshes via manual refetch after mutations. WebSockets or polling would improve UX.
- **Seed data** -- Usage events are randomly generated. Gives a realistic feel but isn't deterministic.
- **No rate limiting or input sanitization middleware** -- Would be required for production.
- **Stripe webhook verification** -- Implemented but requires `stripe listen --forward-to` for local development.

## Deployment

The project includes a `render.yaml` that provisions a Node.js web service and a managed PostgreSQL database on Render. The build step runs `npm install`, compiles TypeScript, and applies Prisma migrations.

## Possible Improvements

1. **Real authentication** with Stytch (session tokens, protected routes, multi-user support)
2. **Stripe webhook hardening** -- idempotency keys, retry handling, event deduplication
3. **Test coverage** -- unit tests for API routes, integration tests for Stripe flows, component tests
4. **CI/CD pipeline** -- GitHub Actions for lint, test, and deploy on merge
5. **Real-time usage updates** -- WebSocket or Server-Sent Events to push credit changes to the dashboard
