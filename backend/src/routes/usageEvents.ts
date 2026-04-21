import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/currentUser";

export const usageEventsRouter = Router();

usageEventsRouter.post(
  "/usage-events",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, feature, creditsConsumed } = req.body as {
        projectId?: string;
        feature: string;
        creditsConsumed: number;
      };

      // Validate inputs
      if (!feature || typeof feature !== "string" || feature.trim() === "") {
        res.status(400).json({ success: false, error: "feature must be a non-empty string" });
        return;
      }
      if (
        typeof creditsConsumed !== "number" ||
        !Number.isInteger(creditsConsumed) ||
        creditsConsumed <= 0
      ) {
        res.status(400).json({ success: false, error: "creditsConsumed must be a positive integer" });
        return;
      }

      const userId = getCurrentUserId();

      // Create usage event
      const event = await prisma.usageEvent.create({
        data: {
          userId,
          projectId: projectId ?? null,
          feature: feature.trim(),
          creditsConsumed,
        },
      });

      // Increment project credits if projectId provided
      if (projectId) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            creditsUsed: { increment: creditsConsumed },
            lastActiveAt: new Date(),
          },
        });
      }

      // Increment usage summary credits
      const updatedSummary = await prisma.usageSummary.update({
        where: { userId },
        data: { creditsUsed: { increment: creditsConsumed } },
      });

      res.status(201).json({
        success: true,
        data: { event, usageSummary: updatedSummary },
      });
    } catch (err) {
      next(err);
    }
  }
);
