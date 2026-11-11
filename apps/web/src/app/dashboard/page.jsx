'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import {
  Compass,
  CheckCircle2,
  Clock,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  User,
  Activity,
  Layers,
  ExternalLink,
  Target,
  FileCheck2
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: overviewData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiClient.dashboard.getOverview();
      return res.data;
    },
    enabled: Boolean(user)
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Compass className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Welcome to PathForge</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Sign in to access your personal career readiness dashboard and application tracking pipeline.
          </p>
          <Link
            href="/login"
            className="block w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const overview = overviewData;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-600/20">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">PathForge</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50">
              Overview Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/internships"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Internships
            </Link>
            <Link
              href="/applications"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Applications
            </Link>
            <Link
              href="/roadmaps"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Roadmaps
            </Link>
            <Link
              href="/profile"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-purple-400" />
            <p className="text-sm font-medium">Aggregating career intelligence metrics...</p>
          </div>
        ) : !overview ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Unable to load dashboard data</h3>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-zinc-900/40 border border-purple-900/40 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Welcome Back
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400">{overview.profileSummary.location}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white">
                    {overview.profileSummary.firstName} {overview.profileSummary.lastName}
                  </h1>
                  <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                    {overview.profileSummary.headline}
                  </p>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 min-w-[220px]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">Profile Readiness</span>
                    <span className="font-bold text-purple-300">
                      {overview.profileSummary.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${overview.profileSummary.completionPercentage}%` }}
                    />
                  </div>
                  <Link
                    href="/profile"
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                  >
                    Enhance Profile & Skills <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/applications"
                className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <span>Applications Pipeline</span>
                  <Briefcase className="h-4 w-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {overview.applicationsSummary.total}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                  <span>{overview.applicationsSummary.applied} Applied</span>
                  <span>•</span>
                  <span className="text-indigo-400">{overview.applicationsSummary.interviewing} Interviewing</span>
                </div>
              </Link>

              <Link
                href="/roadmaps"
                className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <span>Active Roadmaps</span>
                  <Calendar className="h-4 w-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {overview.roadmapsSummary.active}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                  <span>{overview.roadmapsSummary.averageProgress}% Avg Progress</span>
                  <span>•</span>
                  <span>{overview.roadmapsSummary.completed} Completed</span>
                </div>
              </Link>

              <Link
                href="/internships"
                className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <span>Saved Internships</span>
                  <Target className="h-4 w-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {overview.applicationsSummary.saved}
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  Ready for match evaluation
                </div>
              </Link>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <span>Upcoming Deadlines</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400">
                  {overview.upcomingDeadlines.length}
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  Next 14 days
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {overview.roadmapsSummary.nextPendingTask && (
                  <div className="bg-zinc-900/50 border border-purple-900/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          Next Preparation Step
                        </span>
                      </div>
                      <Link
                        href="/roadmaps"
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1"
                      >
                        View Full Roadmap <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">
                      Day {overview.roadmapsSummary.nextPendingTask.dayNumber}: {overview.roadmapsSummary.nextPendingTask.title}
                    </h3>
                    <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                      {overview.roadmapsSummary.nextPendingTask.description}
                    </p>

                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-zinc-400">
                        Deliverable: <span className="text-zinc-200">{overview.roadmapsSummary.nextPendingTask.expectedOutput}</span>
                      </span>
                      <span className="text-xs font-semibold text-purple-300 shrink-0 ml-3">
                        {overview.roadmapsSummary.nextPendingTask.estimatedHours} hrs
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      Upcoming Deadlines & Actions
                    </h2>
                    <Link href="/applications" className="text-xs text-purple-400 hover:underline">
                      Manage Pipeline
                    </Link>
                  </div>

                  {overview.upcomingDeadlines.length === 0 ? (
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-400">
                      No urgent deadlines scheduled. Discover fresh internships or plan an application.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overview.upcomingDeadlines.map((dl) => (
                        <div
                          key={dl.id}
                          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {dl.title}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {dl.targetRole} • Status: <span className="capitalize text-zinc-300">{dl.status}</span>
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-amber-300 block">
                              {new Date(dl.date).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              Due Date
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      Recent Match Evaluations
                    </h2>
                    <Link href="/internships" className="text-xs text-purple-400 hover:underline">
                      View All Internships
                    </Link>
                  </div>

                  {overview.recentMatches.length === 0 ? (
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-400">
                      You haven’t analyzed any internships yet. Run your first match analysis in the catalogue.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overview.recentMatches.map((m) => (
                        <div
                          key={m.id}
                          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4"
                        >
                          <div>
                            <span className="text-xs font-bold text-purple-400 block mb-0.5">
                              {m.internshipCompany}
                            </span>
                            <span className="text-sm font-bold text-white block">
                              {m.internshipTitle}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Evaluated {new Date(m.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-2xl font-black text-purple-400 block">
                              {m.overallScore}%
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                              Compatibility
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {overview.topSkillGaps && overview.topSkillGaps.length > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-purple-400" />
                      Priority Skill Gaps
                    </h3>
                    <div className="space-y-2.5">
                      {overview.topSkillGaps.map((gap, i) => (
                        <div key={i} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white">{gap.skillName}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                gap.importance === 'critical'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}
                            >
                              {gap.importance}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">{gap.recommendedAction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-zinc-400" />
                    Recent Activity Timeline
                  </h3>

                  {overview.recentActivity.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-3 text-center">
                      No recent events recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {overview.recentActivity.map((act) => (
                        <div key={act.id} className="text-xs pb-2 border-b border-zinc-850 last:border-b-0">
                          <span className="font-semibold text-zinc-200 block">
                            {act.title}
                          </span>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            {act.description}
                          </span>
                          <span className="text-[10px] text-zinc-500 block mt-1">
                            {new Date(act.createdAt).toLocaleDateString()} at{' '}
                            {new Date(act.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

