'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import {
  Briefcase,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Compass,
  CheckCircle2,
  ArrowRight,
  Filter,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  { value: 'preparing', label: 'Preparing', color: 'bg-blue-950/70 text-blue-300 border-blue-800' },
  { value: 'ready', label: 'Ready to Apply', color: 'bg-purple-950/70 text-purple-300 border-purple-800' },
  { value: 'applied', label: 'Applied', color: 'bg-amber-950/70 text-amber-300 border-amber-800' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-indigo-950/70 text-indigo-300 border-indigo-800' },
  { value: 'offered', label: 'Offer Received', color: 'bg-emerald-950/70 text-emerald-300 border-emerald-800' },
  { value: 'rejected', label: 'Archived / Rejected', color: 'bg-rose-950/70 text-rose-300 border-rose-800' }
];

export default function ApplicationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInternshipId, setSelectedInternshipId] = useState('');
  const [newStatus, setNewStatus] = useState('saved');
  const [newNotes, setNewNotes] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiClient.applications.list(statusFilter === 'all' ? undefined : statusFilter);
      return res.data || [];
    },
    enabled: Boolean(user)
  });

  const { data: internshipsData } = useQuery({
    queryKey: ['internships-for-modal'],
    queryFn: async () => {
      const res = await apiClient.internships.list({ limit: 50 });
      return res.data?.internships || [];
    },
    enabled: isAddModalOpen
  });

  const createAppMutation = useMutation({
    mutationFn: (data) => apiClient.applications.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setIsAddModalOpen(false);
      setSelectedInternshipId('');
      setNewNotes('');
      setNewDeadline('');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.applications.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }) => apiClient.applications.update(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setEditingNotesId(null);
    }
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id) => apiClient.applications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    }
  });

  const applicationsList = applicationsData || [];

  const counts = {
    total: applicationsList.length,
    active: applicationsList.filter((a) => ['preparing', 'ready', 'applied', 'interviewing'].includes(a.status)).length,
    interviewing: applicationsList.filter((a) => a.status === 'interviewing').length,
    offered: applicationsList.filter((a) => a.status === 'offered').length
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!selectedInternshipId) return;

    createAppMutation.mutate({
      internshipId: selectedInternshipId,
      status: newStatus,
      notes: newNotes || undefined,
      deadline: newDeadline || undefined
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to Track Applications</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Keep track of deadlines, interview rounds, recruiter notes, and action plans in one unified pipeline.
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
              Applications Tracker v1.0.0
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
              href="/internships"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Internships
            </Link>
            <Link
              href="/roadmaps"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            >
              Roadmaps
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Application Pipeline & Tracking
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
              Track and advance your internship applications through preparation, screening, interviewing, and offers with structured event logs.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Track New Application
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Total Tracked
            </span>
            <div className="text-2xl font-bold text-white">{counts.total}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Active Pipeline
            </span>
            <div className="text-2xl font-bold text-purple-400">{counts.active}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Interviewing
            </span>
            <div className="text-2xl font-bold text-indigo-400">{counts.interviewing}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Offers Received
            </span>
            <div className="text-2xl font-bold text-emerald-400">{counts.offered}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Applications
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                statusFilter === opt.value
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-purple-400" />
            <p className="text-sm font-medium">Loading applications pipeline...</p>
          </div>
        ) : applicationsList.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <Briefcase className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200">No applications found</h3>
            <p className="text-xs text-zinc-400 mt-1 mb-6 leading-relaxed">
              Track internships you discover to monitor deadlines, interview milestones, and application notes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                Track an Internship
              </button>
              <Link
                href="/internships"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Explore Catalogue
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applicationsList.map((app) => (
              <div
                key={app.id}
                className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      {app.internshipCompany}
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400 capitalize">{app.internshipWorkMode}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400">{app.internshipLocation}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{app.internshipTitle}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                    {app.appliedAt && (
                      <span className="inline-flex items-center gap-1.5 text-zinc-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    )}

                    {app.deadline && (
                      <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded-lg">
                        <Clock className="h-3.5 w-3.5" />
                        Deadline: {new Date(app.deadline).toLocaleDateString()}
                      </span>
                    )}

                    {app.nextAction && (
                      <span className="inline-flex items-center gap-1.5 text-purple-300 bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded-lg">
                        <ArrowRight className="h-3.5 w-3.5" />
                        Next: {app.nextAction}
                      </span>
                    )}
                  </div>

                  {editingNotesId === app.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Add recruiter details, interview rounds, or follow-up action items..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 h-20"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateNotesMutation.mutate({ id: app.id, notes: notesDraft })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          Save Note
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      {app.notes ? (
                        <p
                          onClick={() => {
                            setEditingNotesId(app.id);
                            setNotesDraft(app.notes);
                          }}
                          className="text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850 cursor-pointer hover:border-zinc-700 transition-colors"
                          title="Click to edit notes"
                        >
                          {app.notes}
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotesId(app.id);
                            setNotesDraft('');
                          }}
                          className="text-xs text-zinc-500 hover:text-zinc-300 font-medium"
                        >
                          + Add notes or action items
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <select
                    value={app.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: app.id, status: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {app.internshipSourceUrl && (
                    <a
                      href={app.internshipSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Open job posting"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <button
                    onClick={() => deleteAppMutation.mutate(app.id)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    title="Delete application"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Track Internship Application</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Select an internship from your curated catalogue to link to your application pipeline.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Role & Company
                </label>
                <select
                  value={selectedInternshipId}
                  onChange={(e) => setSelectedInternshipId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                >
                  <option value="">Select an internship...</option>
                  {internshipsData?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.company} — {item.title} ({item.workMode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Application Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Notes & Action Items (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="E.g. Connected with engineering manager at university hackathon..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedInternshipId || createAppMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all disabled:opacity-50"
                >
                  {createAppMutation.isPending ? 'Tracking...' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

