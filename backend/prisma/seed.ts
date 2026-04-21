import { PrismaClient, Plan } from "@prisma/client";

const prisma = new PrismaClient();

const FEATURES = [
  "mesh_generation",
  "texture_synthesis",
  "physics_sim",
  "animation_rig",
  "collision_bake",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function endOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

async function main() {
  console.log("Seeding database...");

  // Clean up existing seed data
  await prisma.usageEvent.deleteMany({ where: { userId: "user_seed_001" } });
  await prisma.project.deleteMany({ where: { userId: "user_seed_001" } });
  await prisma.usageSummary.deleteMany({ where: { userId: "user_seed_001" } });
  await prisma.subscription.deleteMany({ where: { userId: "user_seed_001" } });
  await prisma.user.deleteMany({ where: { id: "user_seed_001" } });

  // Create user
  const user = await prisma.user.create({
    data: {
      id: "user_seed_001",
      email: "demo@bezi.com",
      name: "Alex Rivera",
      avatarUrl: null,
    },
  });

  console.log("Created user:", user.email);

  // Create PRO subscription
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: Plan.PRO,
      status: "active",
      stripeCustomerId: "cus_mock_001",
      stripeSubscriptionId: "sub_mock_001",
      currentPeriodStart: periodStart,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });

  console.log("Created PRO subscription");

  // Create usage summary
  await prisma.usageSummary.create({
    data: {
      userId: user.id,
      creditsUsed: 347,
      creditsLimit: 1000,
      resetAt: endOfMonth(),
    },
  });

  console.log("Created usage summary");

  // Create 3 projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        userId: user.id,
        name: "Mech Warrior VR",
        engine: "Unity",
        creditsUsed: 120,
        lastActiveAt: daysAgo(1),
      },
    }),
    prisma.project.create({
      data: {
        userId: user.id,
        name: "Puzzle Planet",
        engine: "Unity",
        creditsUsed: 145,
        lastActiveAt: daysAgo(3),
      },
    }),
    prisma.project.create({
      data: {
        userId: user.id,
        name: "Dungeon Crawler Alpha",
        engine: "Unity",
        creditsUsed: 82,
        lastActiveAt: daysAgo(7),
      },
    }),
  ]);

  console.log("Created 3 projects");

  // Create ~40 usage events spread across last 30 days
  const usageEventsData = [];
  for (let i = 0; i < 40; i++) {
    const project = projects[i % projects.length];
    const daysBack = randomInt(0, 29);
    const occurredAt = daysAgo(daysBack);
    // Vary time within the day
    occurredAt.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));

    usageEventsData.push({
      userId: user.id,
      projectId: project.id,
      feature: FEATURES[randomInt(0, FEATURES.length - 1)],
      creditsConsumed: randomInt(3, 20),
      occurredAt,
    });
  }

  await prisma.usageEvent.createMany({ data: usageEventsData });

  console.log("Created 40 usage events");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
