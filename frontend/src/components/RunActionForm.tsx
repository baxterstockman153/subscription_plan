'use client';
import { useState } from 'react';
import { api } from '../api/client';
import type { Project } from '../types';

const ACTION_TYPES = [
  { value: 'generate_script', label: 'Generate Script', credits: 10, description: 'AI writes a new C# script based on your specs' },
  { value: 'analyze_scene', label: 'Analyze Scene', credits: 15, description: 'Inspect scene hierarchy and surface potential issues' },
  { value: 'debug_code', label: 'Debug Code', credits: 8, description: 'Find and explain bugs in your existing scripts' },
  { value: 'optimize_assets', label: 'Optimize Assets', credits: 20, description: 'Suggest performance and memory improvements' },
  { value: 'generate_prefab', label: 'Generate Prefab', credits: 12, description: 'Create a reusable prefab from a description' },
  { value: 'refactor_script', label: 'Refactor Script', credits: 10, description: 'Clean up and restructure existing code' },
] as const;

interface Props {
  selectedProject: Project | null;
  onActionRun: () => void;
}

export function RunActionForm({ selectedProject, onActionRun }: Props) {
  const [actionType, setActionType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRan, setJustRan] = useState(false);

  const selectedAction = ACTION_TYPES.find((a) => a.value === actionType);
  const canRun = !!selectedProject && !!actionType && !loading;

  const handleRun = async () => {
    if (!canRun || !selectedProject || !selectedAction) return;

    setLoading(true);
    setError(null);
    try {
      await api.createUsageEvent({
        feature: actionType,
        creditsConsumed: selectedAction.credits,
        projectId: selectedProject.id,
      });
      setActionType('');
      setJustRan(true);
      onActionRun();
      setTimeout(() => setJustRan(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-slate-100">Run AI Action</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Project display */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1.5">
            Project
          </label>
          <div
            className={`rounded-lg px-3 py-2.5 text-sm border ${
              selectedProject
                ? 'bg-slate-800 border-slate-700 text-slate-100'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-600'
            }`}
          >
            {selectedProject ? (
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedProject.name}</span>
                <span className="text-xs text-slate-500 ml-3">{selectedProject.engine}</span>
              </div>
            ) : (
              <span className="italic">Choose a project from the left panel</span>
            )}
          </div>
        </div>

        {/* Action type */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1.5">
            Action
          </label>
          <select
            value={actionType}
            onChange={(e) => { setActionType(e.target.value); setError(null); }}
            disabled={!selectedProject}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <option value="" className="text-slate-500 bg-slate-800">Choose an action…</option>
            {ACTION_TYPES.map((a) => (
              <option key={a.value} value={a.value} className="bg-slate-800">
                {a.label} — {a.credits} credits
              </option>
            ))}
          </select>
          {selectedAction && (
            <p className="text-xs text-slate-500 mt-1.5 pl-0.5">{selectedAction.description}</p>
          )}
        </div>

        {/* Credits pill */}
        {selectedAction && (
          <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/40 rounded-lg px-4 py-3">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Credits to be used</p>
              <p className="text-2xl font-bold text-violet-300 leading-none">
                {selectedAction.credits}
              </p>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed ml-auto text-right">
              credits deducted<br />from your plan
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleRun}
          disabled={!canRun}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            justRan
              ? 'bg-emerald-600 text-white'
              : 'bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running…
            </>
          ) : justRan ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Action complete!
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Run AI Action
            </>
          )}
        </button>

        {!selectedProject && (
          <p className="text-center text-xs text-slate-600">
            Select a project to enable AI actions
          </p>
        )}
      </div>
    </div>
  );
}
