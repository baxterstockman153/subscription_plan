# Subscription Plan Backend

## Overview

REST API backend for the AI Account Dashboard take-home assignment. Provides user profile data, subscription state, and AI usage statistics for a React frontend. Users can view their current plan, switch plans, and track per-project AI credit consumption.

## Architecture

- **Express** — HTTP server and routing
- **Prisma ORM** — type-safe database access with auto-generated client
- **PostgreSQL** — relational database (hosted on Render.com free tier)
- **TypeScript** — full type safety across models, routes, and middleware
- **Render.com** — cloud deployment with `render.yaml` for infrastructure-as-code provisioning

## Design Decisions & Trade-offs

### Authentication mocked via `getCurrentUser()`
`src/lib/currentUser.ts` always returns `"user_seed_001"`. In production this would decode a Stytch JWT from the `Authorization` header and look up the user. The mock keeps the prototype simple without requiring a Stytch account.

### Stripe integration mocked
Plan changes generate a mock `stripeSubscriptionId` locally (`sub_mock_<timestamp>`). In production, `POST /api/subscription/change-plan` would call `stripe.subscriptions.update()` and handle webhooks for status changes.

### PostgreSQL over SQLite
Render.com's free web tier uses an ephemeral filesystem — any SQLite file would be lost on redeploy. Render's managed PostgreSQL persists independently of the web service.

### Single-user seed
The prototype is scoped to one demo user. A multi-tenant production system would pass `userId` from the validated session token rather than a hardcoded constant.

### Usage aggregation in TypeScript (not SQL)
Daily credit totals are computed by grouping `UsageEvent` rows in-process after a single Prisma query. This is fast enough for the small dataset here and avoids dialect-specific `DATE_TRUNC` SQL. A high-traffic production API would push this aggregation to the database.

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Seed demo data
npm run prisma:seed

# 5. Start dev server
npm run dev
```

The server starts on `http://localhost:3000` by default.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — returns `{ "success": true }` |
| `GET` | `/api/dashboard` | Full dashboard payload: user, subscription, usage summary, projects, daily/monthly credit charts |
| `POST` | `/api/subscription/change-plan` | Switch plan. Body: `{ "planCode": "FREE" \| "PRO" \| "BUSINESS" }` |
| `POST` | `/api/usage-events` | Record an AI usage event. Body: `{ "feature": string, "creditsConsumed": number, "projectId"?: string }` |

### Example responses

**GET /api/dashboard**
```json
{
  "success": true,
  "data": {
    "user": { "id": "user_seed_001", "email": "demo@bezi.com", "name": "Alex Rivera", "avatarUrl": null },
    "subscription": { "plan": "PRO", "status": "active", "currentPeriodEnd": "...", "stripeCustomerId": "cus_mock_001" },
    "usage": {
      "creditsUsed": 347,
      "creditsLimit": 1000,
      "creditsRemaining": 653,
      "resetAt": "...",
      "last7Days": [{ "date": "2025-01-01", "credits": 12 }],
      "last30Days": [{ "date": "2024-12-03", "credits": 5 }]
    },
    "projects": [{ "id": "...", "name": "Mech Warrior VR", "creditsUsed": 120 }]
  }
}
```

## Deployment (Render.com)

1. Push this repo to GitHub
2. In the Render dashboard, click **New → Blueprint** and connect the repo
3. `render.yaml` auto-provisions:
   - A Node.js web service (`subscription-plan-backend`)
   - A managed PostgreSQL database (`subscription-plan-db`)
4. Render sets `DATABASE_URL` automatically via the `fromDatabase` reference
5. After first deploy, run the seed via Render Shell: `npm run prisma:seed`

## Limitations

- **No real authentication** — all requests are treated as the seeded demo user
- **No Stripe webhooks** — plan changes don't trigger real billing events; subscription IDs are mocked locally
- **Single-user prototype** — not designed for multi-tenant use
- **No rate limiting** — production APIs should throttle `/api/usage-events`
