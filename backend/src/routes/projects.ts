import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/currentUser";

export const projectsRouter = Router();

// GET /api/projects
projectsRouter.get("/projects", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId();
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: { select: { usageEvents: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      success: true,
      data: {
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          engine: p.engine,
          creditsUsed: p.creditsUsed,
          lastActiveAt: p.lastActiveAt,
          createdAt: p.createdAt,
          actionCount: p._count.usageEvents,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
projectsRouter.post("/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId();
    const { name, engine } = req.body as { name: string; engine?: string };

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ success: false, error: "name must be a non-empty string" });
      return;
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name: name.trim(),
        engine: engine?.trim() || "Unity",
      },
    });

    res.status(201).json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          engine: project.engine,
          creditsUsed: project.creditsUsed,
          lastActiveAt: project.lastActiveAt,
          createdAt: project.createdAt,
          actionCount: 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
