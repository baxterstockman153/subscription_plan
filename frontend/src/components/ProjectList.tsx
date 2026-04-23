import type { Project } from '../types';

interface Props {
  projects: Project[];
  loading: boolean;
  error: string | null;
  selectedProject: Project | null;
  onSelect: (project: Project) => void;
}

function formatLastActive(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Active just now';
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  return `Active ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function ProjectList({ projects, loading, error, selectedProject, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 py-3 text-red-400 text-xs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">No projects yet</p>
        <p className="text-xs text-slate-600 mt-1">Create one above to get started</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {projects.map((project) => {
        const isSelected = selectedProject?.id === project.id;

        return (
          <li key={project.id}>
            <button
              onClick={() => onSelect(project)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                isSelected
                  ? 'bg-violet-600/15 border border-violet-500/30'
                  : 'hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isSelected ? 'text-slate-100' : 'text-slate-200 group-hover:text-slate-100'
                  }`}>
                    {project.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500">{project.engine}</span>
                    {project.creditsUsed > 0 && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-500">
                          {project.creditsUsed.toLocaleString()} credits
                        </span>
                      </>
                    )}
                  </div>
                  {project.lastActiveAt && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {formatLastActive(project.lastActiveAt)}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
