'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from '../hooks/useDashboard';

const PLAN_LABELS: Record<string, string> = { FREE: 'Trial', PRO: 'Pro', ADVANCED: 'Advanced' };
const TABS = [
  { href: '/usage', label: 'Usage' },
  { href: '/ai-actions', label: 'Run AI Actions' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useDashboard();
  const planLabel = data?.subscription
    ? (PLAN_LABELS[data.subscription.plan] ?? data.subscription.plan)
    : null;

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden font-sans">
      <header className="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="font-semibold text-slate-100 text-[15px] tracking-tight">Bezi</span>
          </div>
          <nav className="flex gap-1">
            {TABS.map(({ href, label }) => (
              <Link key={href} href={href} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === href ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}>{label}</Link>
            ))}
          </nav>
        </div>
        {data?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{data.user.name}</span>
            {planLabel && (
              <span className="text-xs bg-violet-950/60 text-violet-300 border border-violet-800/40 px-2.5 py-0.5 rounded-full font-medium">{planLabel}</span>
            )}
          </div>
        )}
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
