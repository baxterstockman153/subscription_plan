'use client';
import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useActionHistory } from '../hooks/useActionHistory';
import { CreateProjectForm } from '../components/CreateProjectForm';
import { ProjectList } from '../components/ProjectList';
import { RunActionForm } from '../components/RunActionForm';
import { ActionHistory } from '../components/ActionHistory';
import type { Project } from '../types';

export function RunAiActionsPage() {
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects();

  const {
    events,
    loading: eventsLoading,
    refetch: refetchEvents,
  } = useActionHistory();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectCreated = (project: Project) => {
    refetchProjects();
    setSelectedProject(project);
  };

  const handleActionRun = () => {
    refetchEvents();
    refetchProjects();
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Projects
          </p>
          <CreateProjectForm onCreated={handleProjectCreated} />
        </div>
        <div className="flex-1 p-3">
          <ProjectList
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            selectedProject={selectedProject}
            onSelect={setSelectedProject}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-2xl">
          <RunActionForm
            selectedProject={selectedProject}
            onActionRun={handleActionRun}
          />
          <ActionHistory events={events} loading={eventsLoading} />
        </div>
      </div>
    </div>
  );
}
