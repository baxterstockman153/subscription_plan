import { Router, Request, Response, NextFunction } from "express";
import { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/currentUser";
import { stripe, webhookSecret } from "../lib/stripeService";

export const stripeRouter = Router();

const PLAN_CREDIT_LIMITS: Record<Plan, number> = {
  FREE: 100,
  PRO: 1000,
  BUSINESS: 10000,
};

const PLAN_PRICES: Record<Exclude<Plan, "FREE">, number> = {
  PRO: 2000,
  BUSINESS: 6000,
};

// POST /api/stripe/create-checkout-session
stripeRouter.post(
  "/stripe/create-checkout-session",
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

      const userId = getCurrentUserId();
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { subscription: true },
      });

      let customerId = user.subscription?.stripeCustomerId ?? null;
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch {
          customerId = null;
        }
      }
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name ?? user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        if (user.subscription) {
          await prisma.subscription.update({
            where: { userId },
            data: { stripeCustomerId: customerId },
          });
        }
      }

      const unitAmount = PLAN_PRICES[planCode as Exclude<Plan, "FREE">];

      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              unit_amount: unitAmount,
              product_data: {
                name: `${planCode} Plan`,
                description: `${PLAN_CREDIT_LIMITS[planCode as Plan].toLocaleString()} credits per month`,
              },
            },
          },
        ],
        metadata: { planCode, userId },
        return_url: `${process.env.FRONTEND_URL || "http://localhost:3001"}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      });

      res.json({
        success: true,
        data: { sessionId: session.id, clientSecret: session.client_secret },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/stripe/session-status
stripeRouter.get(
  "/stripe/session-status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { session_id } = req.query as { session_id: string };
      if (!session_id) {
        res.status(400).json({ success: false, error: "Missing session_id" });
        return;
      }
      const session = await stripe.checkout.sessions.retrieve(session_id);
      res.json({
        success: true,
        data: { status: session.status, paymentStatus: session.payment_status },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/stripe/webhook
stripeRouter.post(
  "/stripe/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["x-stripe-signature"] as string;
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      } catch {
        res.status(400).json({ error: "Webhook signature verification failed" });
        return;
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as {
            metadata?: { planCode?: string; userId?: string };
            payment_status: string;
            customer: string | null;
            subscription: string | null;
          };
          const planCode = session.metadata?.planCode;
          const eventUserId = session.metadata?.userId;
          if (planCode && planCode in Plan && eventUserId) {
            const plan = planCode as Plan;
            await prisma.subscription.update({
              where: { userId: eventUserId },
              data: {
                plan,
                status: "active",
                ...(session.customer && { stripeCustomerId: session.customer }),
                ...(session.subscription && { stripeSubscriptionId: session.subscription }),
              },
            });
            await prisma.usageSummary.update({
              where: { userId: eventUserId },
              data: { creditsLimit: PLAN_CREDIT_LIMITS[plan] },
            });
          }
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as {
            status?: string;
            cancel_at_period_end?: boolean;
            current_period_start?: number;
            current_period_end?: number;
            metadata?: { userId?: string };
          };
          const eventUserId = sub.metadata?.userId;
          if (eventUserId) {
            await prisma.subscription.update({
              where: { userId: eventUserId },
              data: {
                ...(sub.status && { status: sub.status }),
                ...(sub.cancel_at_period_end !== undefined && { cancelAtPeriodEnd: sub.cancel_at_period_end }),
                ...(sub.current_period_start && { currentPeriodStart: new Date(sub.current_period_start * 1000) }),
                ...(sub.current_period_end && { currentPeriodEnd: new Date(sub.current_period_end * 1000) }),
              },
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as { metadata?: { userId?: string } };
          const eventUserId = sub.metadata?.userId;
          if (eventUserId) {
            await prisma.subscription.update({
              where: { userId: eventUserId },
              data: { status: "canceled", cancelAtPeriodEnd: false },
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/stripe/cancel-subscription
stripeRouter.post(
  "/stripe/cancel-subscription",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getCurrentUserId();
      const subscription = await prisma.subscription.findUniqueOrThrow({ where: { userId } });

      if (!subscription.stripeSubscriptionId) {
        res.status(400).json({ success: false, error: "No active Stripe subscription found" });
        return;
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      const updated = await prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      });

      res.json({ success: true, data: { subscription: updated } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/stripe/resume-subscription
stripeRouter.post(
  "/stripe/resume-subscription",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getCurrentUserId();
      const subscription = await prisma.subscription.findUniqueOrThrow({ where: { userId } });

      if (!subscription.stripeSubscriptionId) {
        res.status(400).json({ success: false, error: "No active Stripe subscription found" });
        return;
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      const updated = await prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: false },
      });

      res.json({ success: true, data: { subscription: updated } });
    } catch (err) {
      next(err);
    }
  }
);
