import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/currentUser";

export const dashboardRouter = Router();

dashboardRouter.get("/dashboard", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        subscription: true,
        usageSummary: true,
        projects: true,
        usageEvents: {
          where: { occurredAt: { gte: thirtyDaysAgo } },
          orderBy: { occurredAt: "asc" },
        },
      },
    });

    // Build daily aggregation helpers
    const aggregateByDay = (cutoffDays: number) => {
      const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
      const buckets: Record<string, number> = {};

      // Pre-fill every date in range with 0
      for (let i = cutoffDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }

      user.usageEvents
        .filter((e) => e.occurredAt >= cutoff)
        .forEach((e) => {
          const key = e.occurredAt.toISOString().slice(0, 10);
          buckets[key] = (buckets[key] ?? 0) + e.creditsConsumed;
        });

      return Object.entries(buckets).map(([date, credits]) => ({ date, credits }));
    };

    const last7Days = aggregateByDay(7);
    const last30Days = aggregateByDay(30);

    const creditsRemaining = user.usageSummary
      ? user.usageSummary.creditsLimit - user.usageSummary.creditsUsed
      : 0;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        subscription: user.subscription
          ? {
              plan: user.subscription.plan,
              status: user.subscription.status,
              currentPeriodStart: user.subscription.currentPeriodStart,
              currentPeriodEnd: user.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
              stripeCustomerId: user.subscription.stripeCustomerId,
              stripeSubscriptionId: user.subscription.stripeSubscriptionId,
            }
          : null,
        usage: {
          creditsUsed: user.usageSummary?.creditsUsed ?? 0,
          creditsLimit: user.usageSummary?.creditsLimit ?? 0,
          creditsRemaining,
          resetAt: user.usageSummary?.resetAt ?? null,
          last7Days,
          last30Days,
        },
        projects: user.projects.map((p) => ({
          id: p.id,
          name: p.name,
          engine: p.engine,
          creditsUsed: p.creditsUsed,
          lastActiveAt: p.lastActiveAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
