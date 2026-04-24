import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dashboardRouter } from "./routes/dashboard";
import { subscriptionRouter } from "./routes/subscription";
import { usageEventsRouter } from "./routes/usageEvents";
import { projectsRouter } from "./routes/projects";
import { stripeRouter } from "./routes/stripe";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Webhook route must receive the raw body for Stripe signature verification
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ success: true }));

// API routes
app.use("/api", dashboardRouter);
app.use("/api", subscriptionRouter);
app.use("/api", usageEventsRouter);
app.use("/api", projectsRouter);
app.use("/api", stripeRouter);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
