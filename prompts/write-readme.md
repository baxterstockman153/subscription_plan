# Prompt: Write a README for the Bezi Accounts Take-Home Project

You are writing a README.md for a take-home assignment submission. The project is for the **Bezi Software Engineer (Accounts)** role. The README will be evaluated alongside the codebase, so it must be professional, concise, and demonstrate strong engineering judgment.

---

## Step 1: Read the assignment instructions

Read the following file to understand the project requirements and evaluation criteria:

- `docs/instructions.md`

The assignment asks for an AI Account Dashboard webapp with:
1. User dashboard with basic user data
2. Current subscription state display
3. All available subscription plans (Free, Pro, Business) with the ability to switch
4. AI usage data: credits used, credits remaining, usage charts (7-day and 30-day), connected Unity projects with per-project AI usage stats
5. Stripe API integration (can be mocked)
6. SQL or DynamoDB database
7. Authentication can be mocked but must be documented

The deliverables require a README covering: **architectural choices, technologies used, trade-offs made, setup instructions, key design decisions, and any special considerations or limitations.**

---

## Step 2: Read the codebase

Read all of the following files to understand the implementation before writing the README.

### Backend

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.env.example`
- `backend/render.yaml`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/index.ts`
- `backend/src/lib/prisma.ts`
- `backend/src/lib/currentUser.ts`
- `backend/src/lib/stripeService.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/routes/dashboard.ts`
- `backend/src/routes/subscription.ts`
- `backend/src/routes/usageEvents.ts`
- `backend/src/routes/projects.ts`
- `backend/src/routes/stripe.ts`

### Frontend

- `frontend/package.json`
- `frontend/next.config.mjs`
- `frontend/tailwind.config.ts`
- `frontend/src/types.ts`
- `frontend/src/api/client.ts`
- `frontend/src/lib/stripe.ts`
- `frontend/src/hooks/useDashboard.ts`
- `frontend/src/hooks/useProjects.ts`
- `frontend/src/hooks/useActionHistory.ts`
- `frontend/src/components/AppShell.tsx`
- `frontend/src/components/CheckoutModal.tsx`
- `frontend/src/components/ProjectList.tsx`
- `frontend/src/components/CreateProjectForm.tsx`
- `frontend/src/components/RunActionForm.tsx`
- `frontend/src/components/ActionHistory.tsx`
- `frontend/src/pages/UsagePage.tsx`
- `frontend/src/pages/RunAiActionsPage.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/app/usage/page.tsx`
- `frontend/app/ai-actions/page.tsx`
- `frontend/app/checkout/return/page.tsx`

### Other

- `.gitignore`

---

## Step 3: Write the README

Write a `README.md` file at the project root. It must include the following sections. Use clear markdown formatting with headers, bullet points, and code blocks where appropriate.

### Required sections

1. **Project Overview**
   - One-paragraph summary of what the app does and which assignment it fulfills.

2. **Tech Stack**
   - List all major technologies and frameworks used (e.g., Next.js, Express, Prisma, PostgreSQL, Stripe, Tailwind CSS, TypeScript, etc.).
   - Briefly note why each was chosen, in one sentence per technology.

3. **Architecture**
   - Describe the high-level architecture (frontend/backend split, API layer, database).
   - Mention the data model design (reference the Prisma schema) -- describe the key entities and their relationships.
   - Explain how the frontend communicates with the backend (REST API, fetch client, custom hooks).

4. **Key Design Decisions**
   - Stripe integration approach: explain whether Stripe is fully integrated or mocked, how Checkout Sessions work, and how subscription state is managed.
   - Authentication: explain the mocked auth approach (e.g., `currentUser.ts` returning a hardcoded user) and why this was acceptable per the assignment instructions.
   - Usage/credits system: explain how AI credits are tracked, how usage events are recorded, and how the remaining balance is calculated.
   - Project management: explain the Unity project connection feature and per-project usage tracking.

5. **Trade-offs and Limitations**
   - Be honest about shortcuts taken and what would be different in production.
   - Examples: mocked auth, seed data approach, lack of real-time updates, no rate limiting, simplified error handling, no test coverage, etc.
   - For each trade-off, briefly explain why it was acceptable for a take-home scope.

6. **Setup Instructions**
   - Prerequisites (Node.js version, PostgreSQL, etc.)
   - Step-by-step instructions to run the project locally:
     1. Clone the repo
     2. Backend setup: install deps, configure `.env` from `.env.example`, run Prisma migrations, seed the database, start the server
     3. Frontend setup: install deps, configure environment variables, start the dev server
   - Include the actual commands (e.g., `npm install`, `npx prisma migrate dev`, `npm run dev`).
   - Note the default ports for backend and frontend.

7. **Deployment**
   - If there is a `render.yaml` or any deployment config, describe the deployment strategy.
   - If the app is deployed, include the live URL.

8. **Possible Improvements**
   - List 3-5 things you would add or change given more time (e.g., real auth with Stytch, webhook handling for Stripe events, test suite, CI/CD, real-time usage updates via WebSockets).

---

## Style constraints

- **Tone:** Professional and concise. This is a job application -- be confident but not boastful.
- **Length:** Aim for roughly 400-700 words total. Long enough to be thorough, short enough to respect the reader's time.
- **Formatting:** Use GitHub-flavored markdown. Use headers (`##`), bullet points, and inline code formatting for file names, commands, and technology names.
- **No filler:** Do not include generic statements like "This was a great learning experience." Stick to concrete, technical content.
- **No emojis** unless they add clarity (e.g., a warning icon for a caveat).

---

## Output

Write the final README.md content only. Do not include any preamble, explanation, or commentary outside the README itself. The output should be ready to save directly as `README.md` at the project root.
