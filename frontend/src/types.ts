export interface Project {
  id: string;
  name: string;
  engine: string;
  creditsUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
  actionCount: number;
}

export interface UsageEvent {
  id: string;
  feature: string;
  creditsConsumed: number;
  occurredAt: string;
  projectId: string | null;
  project: { id: string; name: string; engine: string } | null;
}

export interface UsageSummary {
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  resetAt: string | null;
}

export interface DashboardData {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  subscription: {
    plan: 'FREE' | 'PRO' | 'BUSINESS';
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: UsageSummary & {
    last7Days: Array<{ date: string; credits: number }>;
    last30Days: Array<{ date: string; credits: number }>;
  };
  projects: Project[];
}
