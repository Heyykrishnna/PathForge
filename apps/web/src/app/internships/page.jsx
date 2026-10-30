'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import {
  Briefcase,
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Compass,
  FileCode,
  GraduationCap,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function InternshipsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [workMode, setWorkMode] = useState('all');
  const [page, setPage] = useState(1);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);

  const [activeDiagnostic, setActiveDiagnostic] = useState(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const { data: internshipsData, isLoading, isFetching } = useQuery({
    queryKey: ['internships', search, workMode, page, viewSavedOnly],
    queryFn: async () => {
      if (viewSavedOnly) {
        if (!user) return { internships: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        const saved = await apiClient.internships.listSaved();
        return {
          internships: saved.data,
          pagination: { total: saved.data.length, page: 1, limit: 50, totalPages: 1 }
        };
      }
      const res = await apiClient.internships.list({
        search,
        workMode: workMode === 'all' ? undefined : workMode,
        page,
        limit: 8
      });
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, isSaved }) =>
      isSaved ? apiClient.internships.unsave(id) : apiClient.internships.save(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internships'] });
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: (internshipId) => apiClient.matching.analyze(internshipId),
    onSuccess: (res) => {
      setActiveDiagnostic(res.data);
      setIsDiagnosticOpen(true);
      queryClient.invalidateQueries({ queryKey: ['matching-history'] });
    }
  });

  const generateRoadmapMutation = useMutation({
    mutationFn: (data) => apiClient.roadmaps.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      router.push('/roadmaps');
    }
  });

  const trackAppMutation = useMutation({
    mutationFn: (internshipId) => apiClient.applications.create({ internshipId, status: 'saved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      router.push('/applications');
    }
  });

  const handleToggleSave = (id, isSaved) => {
    if (!user) return;
    saveMutation.mutate({ id, isSaved });
  };

  const handleRunAnalysis = (internshipId) => {
    if (!user) return;
    analyzeMutation.mutate(internshipId);
  };

  const internshipsList = internshipsData?.internships || [];
  const pagination = internshipsData?.pagination || { total: 0, page: 1, totalPages: 1 };

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
              Matching Engine v1.0.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
                >
                  Dashboard
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
                  Candidate Profile
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                Sign In to Match
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Internship Intelligence & Matching
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Evaluate your verified portfolio against curated, fresh internship requirements. Scores are explainable, evidence-backed, and keep hard eligibility warnings distinct.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by role, company, or technology (e.g. React, Stripe, Systems)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'remote', 'hybrid', 'in-person'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setWorkMode(mode);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition-colors shrink-0 ${
                    workMode === mode
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}

              {user && (
                <button
                  onClick={() => {
                    setViewSavedOnly(!viewSavedOnly);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                    viewSavedOnly
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved Only
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-purple-400" />
            <p className="text-sm font-medium">Loading verified internships...</p>
          </div>
        ) : internshipsList.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <Briefcase className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No internships match your filter</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your search keywords, clearing work mode filters, or exploring all available roles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {internshipsList.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                        {item.company}
                      </span>
                      <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user && (
                        <button
                          onClick={() => handleToggleSave(item.id, item.isSaved)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition-colors"
                          title={item.isSaved ? 'Unsave' : 'Save'}
                        >
                          {item.isSaved ? (
                            <BookmarkCheck className="h-5 w-5 text-purple-400" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="View Source"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50 capitalize">
                      {item.workMode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-800">
                      {item.location}
                    </span>
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {item.freshness?.daysSinceVerified === 0
                        ? 'Verified today'
                        : `Verified ${item.freshness?.daysSinceVerified}d ago`}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-5">
                    {item.requiredSkills?.length > 0 && (
                      <div>
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                          Required Skills:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.requiredSkills.map((s) => (
                            <span
                              key={s.skillId || s.name}
                              className="px-2 py-0.5 rounded-md bg-purple-950/70 text-purple-200 border border-purple-800/60 text-xs font-medium"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.preferredSkills?.length > 0 && (
                      <div>
                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">
                          Preferred Skills:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.preferredSkills.map((s) => (
                            <span
                              key={s.skillId || s.name}
                              className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/40 text-xs"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-500">
                    {item.minGpa ? `Min GPA: ${item.minGpa} • ` : ''}
                    {item.eligibleGraduationYears?.length > 0
                      ? `Grad: ${item.eligibleGraduationYears.join(', ')}`
                      : 'All graduation years'}
                  </div>

                  {user ? (
                    <button
                      onClick={() => handleRunAnalysis(item.id)}
                      disabled={analyzeMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {analyzeMutation.isPending && analyzeMutation.variables === item.id
                        ? 'Analyzing...'
                        : 'Match Analysis'}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      Sign In to Match
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && !viewSavedOnly && (
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-400 font-medium">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {isDiagnosticOpen && activeDiagnostic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsDiagnosticOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {activeDiagnostic.internship?.company}
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                {activeDiagnostic.internship?.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-zinc-400">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                  {activeDiagnostic.engineVersion}
                </span>
                <span>• Evaluated {new Date(activeDiagnostic.createdAt || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>

            {activeDiagnostic.eligibilityWarnings?.length > 0 && (
              <div className="mb-6 rounded-2xl bg-amber-950/40 border border-amber-800/70 p-4 text-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-300">Eligibility Notice</h4>
                    <p className="text-xs text-amber-200/90 mt-1">
                      {activeDiagnostic.eligibilityWarnings[0]}
                    </p>
                    <p className="text-[11px] text-amber-400/80 mt-1">
                      Note: High compatibility percentages do not override hard recruiter eligibility filters.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Overall Score
                </span>
                <div className="text-4xl font-extrabold text-purple-400">
                  {activeDiagnostic.overallScore}%
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">
                  {activeDiagnostic.overallScore >= 75
                    ? 'Strong match profile'
                    : activeDiagnostic.overallScore >= 50
                    ? 'Moderate match'
                    : 'Bridge development recommended'}
                </span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-400">Deterministic</span>
                  <span className="text-xs font-bold text-zinc-200">70% Weight</span>
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {activeDiagnostic.deterministicScore}%
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Normalized skill requirement validation
                </span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-400">Semantic Relevance</span>
                  <span className="text-xs font-bold text-zinc-200">30% Weight</span>
                </div>
                <div className="text-2xl font-bold text-zinc-100">
                  {activeDiagnostic.semanticScore}%
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Portfolio context & project overlap
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Five-Factor Component Breakdown
              </h3>
              <div className="space-y-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                {[
                  { label: 'Technical Skills (35%)', value: activeDiagnostic.scoreBreakdown?.technicalSkills },
                  { label: 'Relevant Projects (25%)', value: activeDiagnostic.scoreBreakdown?.relevantProjects },
                  { label: 'Experience & Background (15%)', value: activeDiagnostic.scoreBreakdown?.experience },
                  { label: 'Role & Location Fit (15%)', value: activeDiagnostic.scoreBreakdown?.roleSpecific },
                  { label: 'Education & Field of Study (10%)', value: activeDiagnostic.scoreBreakdown?.education }
                ].map((factor) => (
                  <div key={factor.label}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-zinc-300">{factor.label}</span>
                      <span className="text-zinc-400 font-bold">{factor.value || 0}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, factor.value || 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Requirement Evidence Citations
              </h3>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-850 overflow-hidden">
                {activeDiagnostic.matchEvidence?.map((ev, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{ev.skillName}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            ev.isRequired
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {ev.isRequired ? 'Required' : 'Preferred'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {ev.evidenceSnippet || (ev.matchStatus === 'matched' ? 'Self-reported skill' : 'No verified portfolio evidence found')}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {ev.matchStatus === 'matched' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Matched ({Math.round((ev.confidenceScore || 0.75) * 100)}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                          <AlertCircle className="h-3.5 w-3.5 text-zinc-500" />
                          Missing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activeDiagnostic.skillGaps?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Skill Gaps & Recommended Bridge Actions
                </h3>
                <div className="space-y-3">
                  {activeDiagnostic.skillGaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          gap.importance === 'critical'
                            ? 'bg-rose-950/50 text-rose-400 border border-rose-800/60'
                            : 'bg-blue-950/50 text-blue-400 border border-blue-800/60'
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{gap.skillName}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              gap.importance === 'critical'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {gap.importance} Gap
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">{gap.recommendedAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-purple-950/20 border border-purple-900/40 rounded-2xl p-4 mb-6">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
                Diagnostic Summary
              </h4>
              <p className="text-xs text-purple-100/90 leading-relaxed">
                {activeDiagnostic.summaryExplanation}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setIsDiagnosticOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Close Diagnostic
              </button>
              <button
                onClick={() => trackAppMutation.mutate(activeDiagnostic.internshipId)}
                disabled={trackAppMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-600 bg-zinc-800/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors disabled:opacity-50"
              >
                <Briefcase className="h-4 w-4" />
                {trackAppMutation.isPending ? 'Tracking...' : 'Track in Pipeline'}
              </button>
              <button
                onClick={() =>
                  generateRoadmapMutation.mutate({ matchResultId: activeDiagnostic.id })
                }
                disabled={generateRoadmapMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                <Calendar className="h-4 w-4" />
                {generateRoadmapMutation.isPending
                  ? 'Generating Roadmap...'
                  : 'Generate 7-Day Readiness Roadmap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

