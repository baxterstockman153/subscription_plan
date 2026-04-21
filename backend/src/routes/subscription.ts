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

subscriptionRouter.post(
  "/subscription/change-plan",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planCode } = req.body as { planCode: string };

      // Validate planCode is a valid Plan enum value
      if (!planCode || !(planCode in Plan)) {
        res.status(400).json({
          success: false,
          error: `Invalid planCode. Must be one of: ${Object.values(Plan).join(", ")}`,
        });
        return;
      }

      const plan = planCode as Plan;
      const userId = getCurrentUserId();

      // Update subscription plan and simulate a new Stripe subscription ID
      const updatedSubscription = await prisma.subscription.update({
        where: { userId },
        data: {
          plan,
          stripeSubscriptionId: `sub_mock_${Date.now()}`,
        },
      });

      // Update usage summary credit limit to match the new plan
      await prisma.usageSummary.update({
        where: { userId },
        data: { creditsLimit: PLAN_CREDIT_LIMITS[plan] },
      });

      res.json({
        success: true,
        data: { subscription: updatedSubscription },
      });
    } catch (err) {
      next(err);
    }
  }
);
