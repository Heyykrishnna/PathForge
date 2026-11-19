'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Layers,
  BookOpen,
  Compass,
  ArrowLeft,
  Check,
  Save,
  FileCheck2,
  FolderGit2
} from 'lucide-react';
import Link from 'next/link';

export default function RoadmapsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRoadmapId, setSelectedRoadmapId] = useState(null);
  const [activeNotesTaskId, setActiveNotesTaskId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const { data: roadmapsData, isLoading: isLoadingRoadmaps } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiClient.roadmaps.list();
      return res.data || [];
    },
    enabled: Boolean(user)
  });

  const roadmapsList = roadmapsData || [];
  const activeRoadmapId = selectedRoadmapId || roadmapsList[0]?.id || null;

  const { data: activeRoadmapData, isLoading: isLoadingActiveRoadmap } = useQuery({
    queryKey: ['roadmap', activeRoadmapId],
    queryFn: async () => {
      if (!activeRoadmapId) return null;
      const res = await apiClient.roadmaps.get(activeRoadmapId);
      return res.data;
    },
    enabled: Boolean(activeRoadmapId)
  });

  const { data: bridgeProjectsData } = useQuery({
    queryKey: ['bridge-projects'],
    queryFn: async () => {
      const res = await apiClient.roadmaps.listBridgeProjects();
      return res.data || [];
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ roadmapId, taskId, isCompleted }) =>
      apiClient.roadmaps.updateTask(roadmapId, taskId, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', activeRoadmapId] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    }
  });

  const saveNoteMutation = useMutation({
    mutationFn: ({ roadmapId, taskId, userNotes }) =>
      apiClient.roadmaps.updateTask(roadmapId, taskId, { userNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', activeRoadmapId] });
      setActiveNotesTaskId(null);
      setNoteText('');
    }
  });

  const handleToggleTask = (task) => {
    if (!activeRoadmapId) return;
    toggleTaskMutation.mutate({
      roadmapId: activeRoadmapId,
      taskId: task.id,
      isCompleted: !task.isCompleted
    });
  };

  const handleSaveNote = (taskId) => {
    if (!activeRoadmapId) return;
    setIsSavingNote(true);
    saveNoteMutation.mutate(
      {
        roadmapId: activeRoadmapId,
        taskId,
        userNotes: noteText
      },
      {
        onSettled: () => setIsSavingNote(false)
      }
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to View Roadmaps</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Preparation roadmaps are customized to your candidate gaps and saved for continuous tracking.
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
              Readiness Roadmaps v1.0.0
            </span>
          </div>

          <div className="flex items-center gap-3">
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
              href="/internships"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Internships
            </Link>
            <Link
              href="/profile"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Candidate Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Skill Gaps & Preparation Roadmaps
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Convert candidate match diagnostics into actionable 7-day bridge sprints. Complete tasks to strengthen verified evidence before submitting applications.
          </p>
        </div>

        {isLoadingRoadmaps ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-purple-400" />
            <p className="text-sm font-medium">Loading preparation roadmaps...</p>
          </div>
        ) : roadmapsList.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-purple-950/50 border border-purple-800/50 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <Calendar className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No Active Roadmaps Yet</h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Run a match analysis on any internship in our catalogue to generate a custom 7-day preparation roadmap tailored to your specific skill gaps.
            </p>
            <Link
              href="/internships"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Explore Internships & Match
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Your Roadmaps ({roadmapsList.length})
              </h2>

              <div className="space-y-2">
                {roadmapsList.map((rm) => (
                  <button
                    key={rm.id}
                    onClick={() => setSelectedRoadmapId(rm.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      activeRoadmapId === rm.id
                        ? 'bg-purple-950/30 border-purple-600/70 shadow-md shadow-purple-900/20'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase text-purple-400 block mb-0.5">
                      {rm.targetCompany}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">
                      {rm.targetRole}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                      <span>Progress</span>
                      <span className="font-bold text-zinc-200">{rm.progressPercentage}%</span>
                    </div>

                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${rm.progressPercentage}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {bridgeProjectsData && bridgeProjectsData.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1 mb-3">
                    Curated Bridge Projects
                  </h3>
                  <div className="space-y-3">
                    {bridgeProjectsData.slice(0, 3).map((bp) => (
                      <div
                        key={bp.id}
                        className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl"
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span className="text-purple-300 font-semibold">{bp.targetSkill}</span>
                          <span>{bp.estimatedHours} hrs</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white mb-1">{bp.title}</h4>
                        <p className="text-[11px] text-zinc-500 line-clamp-2">{bp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              {isLoadingActiveRoadmap ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
                  <RefreshCw className="h-8 w-8 animate-spin mb-3 text-purple-400" />
                  <p className="text-sm font-medium">Loading schedule...</p>
                </div>
              ) : !activeRoadmapData ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
                  <p className="text-sm text-zinc-400">Select a roadmap to inspect your schedule.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
                          {activeRoadmapData.targetCompany}
                        </span>
                        <h2 className="text-2xl font-extrabold text-white">
                          {activeRoadmapData.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                            {activeRoadmapData.version}
                          </span>
                          <span>• Created {new Date(activeRoadmapData.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
                        <div className="text-center">
                          <div className="text-2xl font-black text-purple-400">
                            {activeRoadmapData.progressPercentage}%
                          </div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                            Done
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-zinc-300 mb-1">
                            {activeRoadmapData.tasks?.filter((t) => t.isCompleted).length || 0} of{' '}
                            {activeRoadmapData.tasks?.length || 7} Tasks Completed
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${activeRoadmapData.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40 text-xs text-purple-200/90 leading-relaxed">
                      This 7-day preparation plan bridges identified candidate gaps for{' '}
                      <span className="font-semibold text-white">{activeRoadmapData.targetRole}</span> at{' '}
                      <span className="font-semibold text-white">{activeRoadmapData.targetCompany}</span>.
                      Completing tasks produces measurable artifacts that enhance your portfolio standing.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 px-1">
                      7-Day Task Breakdown
                    </h3>

                    <div className="space-y-4">
                      {activeRoadmapData.tasks?.map((task) => (
                        <div
                          key={task.id}
                          className={`bg-zinc-900/50 border rounded-2xl p-5 sm:p-6 transition-all ${
                            task.isCompleted
                              ? 'border-emerald-900/50 bg-emerald-950/10'
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                              <button
                                onClick={() => handleToggleTask(task)}
                                className={`mt-0.5 p-1 rounded-lg transition-colors ${
                                  task.isCompleted
                                    ? 'text-emerald-400 hover:text-emerald-300'
                                    : 'text-zinc-500 hover:text-purple-400'
                                }`}
                                title={task.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                              >
                                {task.isCompleted ? (
                                  <CheckCircle2 className="h-6 w-6" />
                                ) : (
                                  <Circle className="h-6 w-6" />
                                )}
                              </button>

                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 text-xs font-bold">
                                    Day {task.dayNumber}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                                    <Clock className="h-3 w-3" />
                                    {task.estimatedHours} hrs
                                  </span>
                                  {task.skillGap && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 text-xs font-medium">
                                      {task.skillGap}
                                    </span>
                                  )}
                                  {task.isCompleted && (
                                    <span className="text-[11px] font-semibold text-emerald-400">
                                      Completed {new Date(task.completedAt).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>

                                <h4
                                  className={`text-base font-bold text-white mb-2 ${
                                    task.isCompleted ? 'line-through text-zinc-400' : ''
                                  }`}
                                >
                                  {task.title}
                                </h4>

                                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                                  {task.description}
                                </p>

                                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5 mb-3">
                                  <FileCheck2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                                  <div className="text-xs">
                                    <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px] block">
                                      Measurable Output
                                    </span>
                                    <span className="text-zinc-300">{task.expectedOutput}</span>
                                  </div>
                                </div>

                                {task.userNotes && activeNotesTaskId !== task.id && (
                                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-2">
                                    <span className="font-semibold text-zinc-400 block mb-0.5">
                                      Your Notes & Artifact Links:
                                    </span>
                                    <p className="whitespace-pre-wrap">{task.userNotes}</p>
                                  </div>
                                )}

                                {activeNotesTaskId === task.id ? (
                                  <div className="mt-3 space-y-2">
                                    <textarea
                                      value={noteText}
                                      onChange={(e) => setNoteText(e.target.value)}
                                      placeholder="Add project links, PRs, key learnings, or verification evidence..."
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 h-20"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSaveNote(task.id)}
                                        disabled={isSavingNote}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                      >
                                        <Save className="h-3 w-3" />
                                        Save Note
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveNotesTaskId(null);
                                          setNoteText('');
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActiveNotesTaskId(task.id);
                                      setNoteText(task.userNotes || '');
                                    }}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                                  >
                                    {task.userNotes ? 'Edit Notes' : '+ Add Notes & Artifact Link'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

