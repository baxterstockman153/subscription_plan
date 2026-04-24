'use client';
import { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useDashboard } from '../hooks/useDashboard';
import { CheckoutModal } from '../components/CheckoutModal';

// ─── Plan constants ───────────────────────────────────────────────────────────
const PLANS = [
  {
    code: 'FREE' as const,
    label: 'Trial',
    price: 0,
    credits: 100,
    features: [
      '100 credits/mo',
      '1 workspace',
      'Up to 2 pages',
      'Limited model access',
      'No credit card required',
    ],
  },
  {
    code: 'PRO' as const,
    label: 'Pro',
    price: 20,
    credits: 800,
    features: [
      '800 credits/mo',
      'Up to 2 workspaces',
      'Unlimited pages',
      'All models',
      'On-demand usage at API pricing',
    ],
  },
  {
    code: 'BUSINESS' as const,
    label: 'Advanced',
    price: 60,
    credits: 2400,
    features: [
      '2,400 credits/mo',
      'Up to 3 workspaces',
      'Unlimited pages',
      'All models',
      'On-demand usage at API pricing',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatResetDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function barColor(pct: number): string {
  if (pct > 80) return 'from-red-500 to-red-400';
  if (pct > 60) return 'from-amber-500 to-amber-400';
  return 'from-violet-600 to-violet-400';
}

function statColor(pct: number): string {
  if (pct > 80) return 'text-red-400';
  if (pct > 60) return 'text-amber-400';
  return 'text-violet-400';
}

// ─── Main component ───────────────────────────────────────────────────────────
export function UsagePage() {
  const { data, loading, error, refetch } = useDashboard();
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'BUSINESS' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [cancelResumeError, setCancelResumeError] = useState<string | null>(null);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="h-4 bg-slate-800 rounded animate-pulse w-1/4" />
            <div className="h-8 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 bg-slate-800/60 rounded animate-pulse w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error ?? 'Failed to load usage data'}</span>
        </div>
      </div>
    );
  }

  const { usage, projects, subscription } = data;
  const currentPlan = subscription?.plan ?? 'FREE';
  const pct = usage.creditsLimit > 0 ? (usage.creditsUsed / usage.creditsLimit) * 100 : 0;

  // ── Confirm plan switch ──────────────────────────────────────────────────────
  async function confirmSwitch() {
    if (!selectedPlan) return;

    if (selectedPlan === 'FREE') {
      setSwitching(true);
      setSwitchError(null);
      try {
        await api.changePlan('FREE');
        setSelectedPlan(null);
        refetch();
      } catch (err) {
        setSwitchError(err instanceof Error ? err.message : 'Failed to switch plan');
      } finally {
        setSwitching(false);
      }
      return;
    }

    setCheckoutOpen(true);
  }

  function handleCheckoutClose() {
    setCheckoutOpen(false);
    setSelectedPlan(null);
    refetch();
  }

  async function handleCancel() {
    setCanceling(true);
    setCancelResumeError(null);
    try {
      await api.cancelSubscription();
      refetch();
    } catch (err) {
      setCancelResumeError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  }

  async function handleResume() {
    setResuming(true);
    setCancelResumeError(null);
    try {
      await api.resumeSubscription();
      refetch();
    } catch (err) {
      setCancelResumeError(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {checkoutOpen && selectedPlan && selectedPlan !== 'FREE' && (
        <CheckoutModal
          planCode={selectedPlan as 'PRO' | 'BUSINESS'}
          onClose={handleCheckoutClose}
        />
      )}

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold text-slate-100">Usage</h1>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── 1. Credit Overview ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Credit Usage
        </h2>

        {/* Progress bar */}
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${barColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mb-5">
          <span>0</span>
          <span>{usage.creditsLimit.toLocaleString()}</span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Used',      value: usage.creditsUsed.toLocaleString(),      accent: statColor(pct) },
            { label: 'Remaining', value: usage.creditsRemaining.toLocaleString(), accent: 'text-slate-100' },
            { label: 'Limit',     value: usage.creditsLimit.toLocaleString(),     accent: 'text-slate-100' },
            { label: 'Resets',    value: formatResetDate(usage.resetAt),          accent: 'text-slate-100' },
          ].map(({ label, value, accent }) => (
            <div key={label} className="bg-slate-800/40 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-sm font-semibold ${accent}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Usage History Charts ────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Usage History
          </h2>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {historyOpen && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Last 7 Days',  days: usage.last7Days },
                { label: 'Last 30 Days', days: usage.last30Days },
              ].map(({ label, days }) => {
                const maxCredits = Math.max(...days.map((d) => d.credits), 1);
                return (
                  <div key={label} className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-5">
                      {label}
                    </h2>
                    <div className="flex items-end gap-1 h-28">
                      {days.map((d) => {
                        const heightPct = (d.credits / maxCredits) * 100;
                        return (
                          <div
                            key={d.date}
                            className="group flex-1 flex flex-col items-center justify-end h-full gap-1"
                          >
                            {/* Tooltip on hover */}
                            <span className="text-[10px] text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                              {d.credits}
                            </span>
                            <div
                              className="w-full rounded-t bg-gradient-to-t from-violet-600 to-violet-400 min-h-[2px] transition-all"
                              style={{ height: `${Math.max(heightPct, d.credits > 0 ? 4 : 0)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* X-axis labels — show only first, middle, last to avoid clutter */}
                    <div className="flex justify-between mt-1">
                      {[days[0], days[Math.floor(days.length / 2)], days[days.length - 1]]
                        .filter(Boolean)
                        .map((d, i) => (
                          <span key={i} className="text-[10px] text-slate-600">
                            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Per-Project Breakdown ───────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <button
          onClick={() => setBreakdownOpen((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Project Breakdown
          </h2>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${breakdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {breakdownOpen && (
          <div className="mt-4">
            {projects.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">No projects yet</p>
                <p className="text-xs text-slate-600 mt-1">Create a project to see per-project usage</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {projects.map((project) => {
                  const projectPct = usage.creditsLimit > 0
                    ? (project.creditsUsed / usage.creditsLimit) * 100
                    : 0;
                  return (
                    <li key={project.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-slate-200 truncate">
                              {project.name}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0">
                              {project.engine}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
                            <span className="text-violet-400 font-medium">
                              {project.creditsUsed.toLocaleString()} credits
                            </span>
                            <span>{projectPct.toFixed(1)}%</span>
                            {project.lastActiveAt && (
                              <span>{formatRelativeTime(project.lastActiveAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                            style={{ width: `${Math.min(projectPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Plan Management ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Plan Management
        </h2>

        {/* Cancellation notice — shown when subscription will cancel at period end */}
        {subscription?.cancelAtPeriodEnd && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              Your subscription will cancel on{' '}
              <span className="font-semibold">
                {formatResetDate(subscription.currentPeriodEnd)}
              </span>
              . You'll keep access until then.
            </span>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.code === currentPlan;
            const isSelected = plan.code === selectedPlan;
            return (
              <button
                key={plan.code}
                onClick={() => {
                  if (isCurrent) {
                    setSelectedPlan(null);
                  } else {
                    setSelectedPlan(isSelected ? null : plan.code);
                  }
                }}
                className={`text-left p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-violet-500/60 bg-violet-500/10'
                    : isSelected
                    ? 'border-violet-400/40 bg-slate-800/60 cursor-pointer'
                    : 'border-slate-700 bg-slate-800/20 hover:border-slate-600 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-100">{plan.label}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-slate-100 mb-1">
                  {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                </p>
                <p className="text-xs text-slate-500">
                  {plan.credits.toLocaleString()} credits/mo
                </p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="text-violet-500 mt-px">·</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Preview panel */}
        {selectedPlan && (() => {
          const newPlan = PLANS.find((p) => p.code === selectedPlan)!;
          const currentPlanData = PLANS.find((p) => p.code === currentPlan) ?? PLANS[0];
          const newPct = newPlan.credits > 0
            ? (usage.creditsUsed / newPlan.credits) * 100
            : 0;
          const priceDelta = newPlan.price - currentPlanData.price;

          return (
            <div className="border border-slate-700 rounded-xl p-5 bg-slate-800/30 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-100">
                    Switch to {newPlan.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    New credit limit: {newPlan.credits.toLocaleString()} credits/mo
                  </p>
                </div>
                <span className={`text-sm font-semibold ${priceDelta > 0 ? 'text-amber-400' : priceDelta < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {priceDelta === 0 ? 'No cost change' : priceDelta > 0 ? `+$${priceDelta}/mo` : `-$${Math.abs(priceDelta)}/mo`}
                </span>
              </div>

              {/* Usage preview bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>
                    Your current usage ({usage.creditsUsed.toLocaleString()} credits) = {newPct.toFixed(1)}% of new limit
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${newPct > 80 ? 'from-red-500 to-red-400' : newPct > 60 ? 'from-amber-500 to-amber-400' : 'from-violet-600 to-violet-400'}`}
                    style={{ width: `${Math.min(newPct, 100)}%` }}
                  />
                </div>
              </div>

              {switchError && (
                <p className="text-xs text-red-400">{switchError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={confirmSwitch}
                  disabled={switching}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {switching ? 'Switching…' : 'Confirm Switch'}
                </button>
                <button
                  onClick={() => { setSelectedPlan(null); setSwitchError(null); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

        {/* Cancel / Resume subscription controls */}
        {currentPlan !== 'FREE' && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              {cancelResumeError && (
                <p className="text-xs text-red-400 mb-1">{cancelResumeError}</p>
              )}
              {subscription?.cancelAtPeriodEnd ? (
                <button
                  onClick={handleResume}
                  disabled={resuming}
                  className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 rounded-lg border border-slate-700 transition-colors"
                >
                  {resuming ? 'Resuming…' : 'Resume Subscription'}
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {canceling ? 'Canceling…' : 'Cancel Subscription'}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {subscription?.cancelAtPeriodEnd
                ? 'Your plan is scheduled to cancel'
                : 'Cancel anytime — access continues until period end'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
