import { Router, Request, Response, NextFunction } from "express";
import { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/currentUser";

export const subscriptionRouter = Router();

const PLAN_CREDIT_LIMITS: Record<Plan, number> = {
  FREE: 100,
  PRO: 1000,
  BUSINESS: 10000,
};

// POST /api/subscription/change-plan
// Only used for FREE plan (no payment required).
// PRO/BUSINESS plans are updated via checkout.session.completed webhook.
subscriptionRouter.post(
  "/subscription/change-plan",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planCode } = req.body as { planCode: string };

      if (!planCode || !(planCode in Plan)) {
        res.status(400).json({
          success: false,
          error: `Invalid planCode. Must be one of: ${Object.values(Plan).join(", ")}`,
        });
        return;
      }

      if (planCode !== "FREE") {
        res.status(400).json({
          success: false,
          error: "Only FREE plan switching is allowed via this endpoint. Paid plans are updated via Stripe webhook.",
        });
        return;
      }

      const plan = planCode as Plan;
      const userId = getCurrentUserId();

      const updatedSubscription = await prisma.subscription.update({
        where: { userId },
        data: { plan, status: "active" },
      });

      await prisma.usageSummary.update({
        where: { userId },
        data: { creditsLimit: PLAN_CREDIT_LIMITS[plan] },
      });

      res.json({ success: true, data: { subscription: updatedSubscription } });
    } catch (err) {
      next(err);
    }
  }
);
