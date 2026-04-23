import type { DashboardData, Project, UsageEvent, UsageSummary } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data as T;
}

export const api = {
  getDashboard: () =>
    request<DashboardData>('/dashboard'),

  getProjects: () =>
    request<{ projects: Project[] }>('/projects'),

  createProject: (name: string, engine = 'Unity') =>
    request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, engine }),
    }),

  getUsageEvents: () =>
    request<{ events: UsageEvent[] }>('/usage-events'),

  createUsageEvent: (data: {
    feature: string;
    creditsConsumed: number;
    projectId: string;
  }) =>
    request<{ event: UsageEvent; usageSummary: UsageSummary }>('/usage-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePlan: (planCode: 'FREE' | 'PRO' | 'BUSINESS') =>
    request<{ subscription: object }>('/subscription/change-plan', {
      method: 'POST',
      body: JSON.stringify({ planCode }),
    }),

  createCheckoutSession: (planCode: 'FREE' | 'PRO' | 'BUSINESS') =>
    request<{ sessionId: string; url: string }>('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ planCode }),
    }),

  cancelSubscription: () =>
    request<{ subscription: object }>('/stripe/cancel-subscription', {
      method: 'POST',
    }),

  resumeSubscription: () =>
    request<{ subscription: object }>('/stripe/resume-subscription', {
      method: 'POST',
    }),
};
