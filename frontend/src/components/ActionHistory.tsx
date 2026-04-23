import type { UsageEvent } from '../types';

const ACTION_LABELS: Record<string, string> = {
  generate_script: 'Generate Script',
  analyze_scene: 'Analyze Scene',
  debug_code: 'Debug Code',
  optimize_assets: 'Optimize Assets',
  generate_prefab: 'Generate Prefab',
  refactor_script: 'Refactor Script',
};

function getActionLabel(feature: string): string {
  return (
    ACTION_LABELS[feature] ??
    feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

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

interface Props {
  events: UsageEvent[];
  loading: boolean;
}

export function ActionHistory({ events, loading }: Props) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-100">Recent Activity</h2>
        </div>
        {!loading && events.length > 0 && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {events.length} {events.length === 1 ? 'action' : 'actions'}
          </span>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-0 divide-y divide-slate-800/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5 py-0.5">
                <div className="h-3 bg-slate-800 rounded animate-pulse w-2/3" />
                <div className="h-2.5 bg-slate-800/60 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">No actions yet</p>
          <p className="text-xs text-slate-600 mt-1 max-w-[200px] mx-auto">
            Select a project and run an AI action to see activity here
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/50">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/20 transition-colors"
            >
              {/* Icon */}
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {getActionLabel(event.feature)}
                  </span>
                  <span className="text-xs text-slate-500 flex-shrink-0 tabular-nums">
                    {formatRelativeTime(event.occurredAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {event.project ? (
                    <span className="text-xs text-slate-400 truncate">{event.project.name}</span>
                  ) : (
                    <span className="text-xs text-slate-600 italic">No project</span>
                  )}
                  <span className="text-slate-700 text-xs">·</span>
                  <span className="text-xs font-medium text-violet-400/80">
                    {event.creditsConsumed} {event.creditsConsumed === 1 ? 'credit' : 'credits'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
