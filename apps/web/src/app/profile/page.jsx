'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import { ProfileSection } from '../../components/profile-section';
import {
  User,
  X,
  GraduationCap,
  Sparkles,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowLeft,
  FileText,
  Upload,
  RefreshCw,
  GitBranch,
  ExternalLink,
  ShieldAlert,
  Layers,
  Check,
  Loader2,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading, logout, refreshProfile } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: null });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    githubUrl: '',
    linkedinUrl: ''
  });

  const [educations, setEducations] = useState([]);
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    gpa: ''
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'engineering',
    proficiencyLevel: 'intermediate'
  });

  const [resumesList, setResumesList] = useState([]);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [analyzingResumeId, setAnalyzingResumeId] = useState(null);

  const [githubData, setGithubData] = useState(null);
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const githubCallback = useRef(null);

  const [evidenceData, setEvidenceData] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const res = await apiClient.profile.get();
        if (res.data) {
          const p = res.data.profile;
          setFormData({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            phone: p.phone || '',
            bio: p.bio || '',
            location: p.location || '',
            website: p.website || '',
            githubUrl: p.githubUrl || '',
            linkedinUrl: p.linkedinUrl || ''
          });
          setEducations(res.data.educations || []);
          setSkills(res.data.skills || []);
        }

        const params = new URLSearchParams(window.location.hash.slice(1));
        const result = params.get('github');
        if (result) {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
          const code = params.get('code');
          const state = params.get('state');
          if (result === 'complete' && code && state) {
            setIsConnectingGithub(true);
            githubCallback.current = apiClient.github
              .completeConnection({ code, state })
              .then(
                () =>
                  setFeedback({
                    type: 'success',
                    message: 'GitHub connected successfully!'
                  }),
                (error) =>
                  setFeedback({
                    type: 'error',
                    message: error.message || 'Failed to connect GitHub.'
                  })
              )
              .finally(() => setIsConnectingGithub(false));
          } else {
            setFeedback({
              type: 'error',
              message: 'GitHub authorization was not completed.'
            });
          }
        }

        const [resumesRes, githubRes, evidenceRes] = await Promise.allSettled([
          apiClient.resumes.list(),
          Promise.resolve(githubCallback.current).then(() =>
            apiClient.github.getAccount()
          ),
          apiClient.evidence.list()
        ]);

        if (resumesRes.status === 'fulfilled')
          setResumesList(resumesRes.value.data || []);
        if (githubRes.status === 'fulfilled')
          setGithubData(githubRes.value.data || null);
        if (evidenceRes.status === 'fulfilled')
          setEvidenceData(evidenceRes.value.data || null);
      } catch {
        setFeedback({ type: 'error', message: 'Failed to load initial data.' });
      }
    }
    void loadData();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: null, message: null });

    try {
      await apiClient.profile.update(formData);
      await refreshProfile();
      setFeedback({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: null, message: null });

    try {
      const res = await apiClient.profile.addEducation(newEducation);
      setEducations((prev) => [res.data, ...prev]);
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        gpa: ''
      });
      await refreshProfile();
      setFeedback({
        type: 'success',
        message: 'Education added successfully!'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to add education.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      await apiClient.profile.deleteEducation(id);
      setEducations((prev) => prev.filter((item) => item.id !== id));
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Education deleted.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete education.'
      });
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    const updatedSkills = [
      ...skills.map((s) => ({
        name: s.name,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel
      })),
      {
        name: newSkill.name.trim(),
        category: newSkill.category,
        proficiencyLevel: newSkill.proficiencyLevel
      }
    ];

    try {
      const res = await apiClient.profile.syncSkills(updatedSkills);
      setSkills(res.data);
      setNewSkill({
        name: '',
        category: 'engineering',
        proficiencyLevel: 'intermediate'
      });
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Skills synced successfully!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to sync skill.'
      });
    }
  };

  const handleDeleteSkill = async (skillName) => {
    const updatedSkills = skills
      .filter((s) => s.name !== skillName)
      .map((s) => ({
        name: s.name,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel
      }));

    try {
      const res = await apiClient.profile.syncSkills(updatedSkills);
      setSkills(res.data);
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Skill removed.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update skills.'
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFeedback({
        type: 'error',
        message: 'Only PDF documents are supported.'
      });
      return;
    }

    setIsUploadingResume(true);
    setFeedback({ type: null, message: null });

    const body = new FormData();
    body.append('resume', file);

    try {
      const res = await apiClient.resumes.upload(body);
      setResumesList((prev) => [res.data, ...prev]);
      setFeedback({
        type: 'success',
        message: 'Resume uploaded successfully! Ready for analysis.'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Upload failed.' });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAnalyzeResume = async (id) => {
    setAnalyzingResumeId(id);
    setFeedback({ type: null, message: null });

    try {
      const res = await apiClient.resumes.analyze(id);
      setResumesList((prev) => prev.map((r) => (r.id === id ? res.data : r)));
      const evRes = await apiClient.evidence.list();
      setEvidenceData(evRes.data);
      setFeedback({
        type: 'success',
        message: 'Resume parsed and skills extracted into candidate evidence!'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Analysis failed.'
      });
    } finally {
      setAnalyzingResumeId(null);
    }
  };

  const handleConfirmSkillsFromResume = async (resume) => {
    const extractedSkills =
      resume.extractedData?.skills?.map((s) => s.name) || [];
    if (extractedSkills.length === 0) return;

    try {
      await apiClient.resumes.confirm(resume.id, {
        confirmedSkills: extractedSkills
      });
      await refreshProfile();
      const pRes = await apiClient.profile.get();
      setSkills(pRes.data.skills || []);
      const evRes = await apiClient.evidence.list();
      setEvidenceData(evRes.data);
      setFeedback({
        type: 'success',
        message: 'Extracted skills confirmed into student profile!'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Confirmation failed.'
      });
    }
  };

  const handleConnectGithub = async () => {
    setIsConnectingGithub(true);
    setFeedback({ type: null, message: null });
    try {
      const res = await apiClient.github.connect();
      window.location.assign(res.data.url);
    } catch (err) {
      setIsConnectingGithub(false);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to connect GitHub.'
      });
    }
  };

  const handleSyncGithub = async () => {
    setIsSyncingGithub(true);
    try {
      await apiClient.github.sync();
      const acc = await apiClient.github.getAccount();
      setGithubData(acc.data);
      const evRes = await apiClient.evidence.list();
      setEvidenceData(evRes.data);
      setFeedback({
        type: 'success',
        message: 'Repositories and language evidence synced!'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Sync failed.' });
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      await apiClient.github.disconnect();
      setGithubData(null);
      setFeedback({ type: 'success', message: 'GitHub account disconnected.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to disconnect.'
      });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-zinc-400">
        Loading profile...
      </div>
    );
  }

  const completion = Math.min(
    100,
    Math.max(0, profile?.completionPercentage ?? 0)
  );

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-purple-600 selection:text-white">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-purple-500/50 bg-purple-950/40">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">
                Student Profile
              </h1>
            </div>
          </div>

          <nav
            aria-label="Main navigation"
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              Dashboard
            </Link>
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              Applications
            </Link>
            <Link
              href="/internships"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Internships
            </Link>
            <Link
              href="/roadmaps"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              Roadmaps
            </Link>
            <span className="hidden max-w-56 truncate text-xs text-zinc-500 2xl:inline-block">
              {user.email}
            </span>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {formData.firstName || 'Student'} {formData.lastName || ''}
                </h2>
                {user.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-950 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {formData.location || 'Location not specified'} •{' '}
                {formData.bio || 'Add a bio to complete your profile'}
              </p>
            </div>

            <div className="w-full shrink-0 sm:w-56">
              <div className="mb-1 text-xs text-zinc-400">Profile Strength</div>
              <div className="flex items-center gap-3">
                <progress
                  aria-label="Profile strength"
                  max={100}
                  value={completion}
                  className="h-2 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-purple-500 [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-purple-500"
                >
                  {completion}%
                </progress>
                <span className="text-sm font-bold text-purple-400">
                  {completion}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {feedback.message && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`fixed inset-x-4 bottom-4 z-30 flex items-center gap-2.5 rounded-xl border p-4 text-sm shadow-2xl sm:left-auto sm:right-8 sm:max-w-md ${
              feedback.type === 'success'
                ? 'border border-emerald-800 bg-emerald-950/60 text-emerald-300'
                : 'border border-rose-800 bg-rose-950/60 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setFeedback({ type: null, message: null })}
              className="shrink-0 rounded-md p-1 text-current opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          <div className="min-w-0 space-y-6 xl:col-span-7">
            <ProfileSection
              id="personal"
              title="Personal details"
              description="Your contact information and professional introduction."
              icon={User}
            >
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-firstName"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      First Name
                    </label>
                    <input
                      id="profile-firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-lastName"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      Last Name
                    </label>
                    <input
                      id="profile-lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-bio"
                    className="mb-1.5 block text-xs font-medium text-zinc-300"
                  >
                    Bio / Summary
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Aspiring software engineer interested in systems, web development, and cloud computing."
                    className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-location"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      Location
                    </label>
                    <input
                      id="profile-location"
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="San Francisco, CA"
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <div>
                    <label
                      htmlFor="profile-website"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      Portfolio / Website
                    </label>
                    <input
                      id="profile-website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://mysite.dev"
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-githubUrl"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      GitHub URL
                    </label>
                    <input
                      id="profile-githubUrl"
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, githubUrl: e.target.value })
                      }
                      placeholder="https://github.com/username"
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-linkedinUrl"
                      className="mb-1.5 block text-xs font-medium text-zinc-300"
                    >
                      LinkedIn URL
                    </label>
                    <input
                      id="profile-linkedinUrl"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          linkedinUrl: e.target.value
                        })
                      }
                      placeholder="https://linkedin.com/in/username"
                      className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Personal Details
                </button>
              </form>
            </ProfileSection>

            <ProfileSection
              id="education"
              title="Education"
              description="Your academic background and graduation timeline."
              icon={GraduationCap}
              status={educations.length}
            >
              <div className="space-y-5">
                <form onSubmit={handleAddEducation} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="education-institution"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Institution
                      </label>
                      <input
                        id="education-institution"
                        type="text"
                        required
                        value={newEducation.institution}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            institution: e.target.value
                          })
                        }
                        placeholder="University of California, Berkeley"
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="education-degree"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Degree
                      </label>
                      <input
                        id="education-degree"
                        type="text"
                        required
                        value={newEducation.degree}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            degree: e.target.value
                          })
                        }
                        placeholder="Bachelor of Science"
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    <div>
                      <label
                        htmlFor="education-fieldOfStudy"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Field of Study
                      </label>
                      <input
                        id="education-fieldOfStudy"
                        type="text"
                        required
                        value={newEducation.fieldOfStudy}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            fieldOfStudy: e.target.value
                          })
                        }
                        placeholder="Computer Science"
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="education-startDate"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Start Date
                      </label>
                      <input
                        id="education-startDate"
                        type="date"
                        required
                        value={newEducation.startDate}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            startDate: e.target.value
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="education-endDate"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Graduation Date
                      </label>
                      <input
                        id="education-endDate"
                        type="date"
                        value={newEducation.endDate}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            endDate: e.target.value
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isCurrent"
                        checked={newEducation.isCurrent}
                        onChange={(e) =>
                          setNewEducation({
                            ...newEducation,
                            isCurrent: e.target.checked
                          })
                        }
                        className="rounded border-zinc-800 bg-black text-zinc-300 focus:ring-zinc-700"
                      />
                      <label
                        htmlFor="isCurrent"
                        className="text-xs text-zinc-400"
                      >
                        Currently enrolled
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                    >
                      Save Education
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {educations.length === 0 && (
                    <p className="text-xs text-zinc-500">
                      No education added yet.
                    </p>
                  )}
                  {educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950 p-4"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {edu.institution}
                        </h4>
                        <p className="mt-0.5 text-xs text-purple-400">
                          {edu.degree} in {edu.fieldOfStudy}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(edu.startDate).getFullYear()} -{' '}
                          {edu.isCurrent
                            ? 'Present'
                            : edu.endDate
                              ? new Date(edu.endDate).getFullYear()
                              : 'N/A'}
                        </p>
                      </div>
                      <button
                        aria-label={`Remove education at ${edu.institution}`}
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="p-1.5 text-zinc-500 transition-colors hover:text-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </ProfileSection>

            <ProfileSection
              id="skills"
              title="Skills"
              description="Show your strengths and how well you know each skill."
              icon={Sparkles}
              status={skills.length}
            >
              <div className="space-y-5">
                <form onSubmit={handleAddSkill} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    <div>
                      <label
                        htmlFor="skill-name"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Skill Name
                      </label>
                      <input
                        id="skill-name"
                        type="text"
                        required
                        value={newSkill.name}
                        onChange={(e) =>
                          setNewSkill({ ...newSkill, name: e.target.value })
                        }
                        placeholder="TypeScript, Docker, Python..."
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="skill-category"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Category
                      </label>
                      <select
                        id="skill-category"
                        value={newSkill.category}
                        onChange={(e) =>
                          setNewSkill({ ...newSkill, category: e.target.value })
                        }
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="engineering">Engineering</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="database">Database</option>
                        <option value="cloud">Cloud / DevOps</option>
                        <option value="data">Data / AI</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="skill-proficiencyLevel"
                        className="mb-1 block text-xs font-medium text-zinc-300"
                      >
                        Proficiency
                      </label>
                      <select
                        id="skill-proficiencyLevel"
                        value={newSkill.proficiencyLevel}
                        onChange={(e) =>
                          setNewSkill({
                            ...newSkill,
                            proficiencyLevel: e.target.value
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                    >
                      Add Skill
                    </button>
                  </div>
                </form>

                <div>
                  <h4 className="mb-3 text-xs font-medium text-zinc-400">
                    Linked Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 && (
                      <p className="text-xs text-zinc-500">
                        No skills added yet. Add one above or confirm skills
                        from your resume.
                      </p>
                    )}
                    {skills.map((s) => (
                      <span
                        key={s.id || s.name}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-200"
                      >
                        <span>{s.name}</span>
                        <span className="rounded-md border border-purple-800/40 bg-purple-950/60 px-1.5 py-0.5 text-[10px] text-purple-400">
                          {s.proficiencyLevel}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${s.name}`}
                          onClick={() => handleDeleteSkill(s.name)}
                          className="ml-1 text-zinc-500 transition-colors hover:text-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ProfileSection>
          </div>
          <div className="min-w-0 space-y-6 xl:col-span-5">
            <ProfileSection
              id="resumes"
              title="Resume intelligence"
              description="Upload your resume to turn experience into evidence."
              icon={FileText}
              status={resumesList.length}
            >
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-5 py-6 text-center">
                  <Upload className="mb-3 h-10 w-10 text-purple-400" />
                  <h3 className="mb-1 text-sm font-bold text-white">
                    Upload your resume
                  </h3>
                  <p className="mb-4 max-w-sm text-xs text-zinc-400">
                    Add a PDF up to 5 MB to extract your skills and experience.
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition-colors focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 hover:bg-zinc-200">
                    {isUploadingResume && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Select PDF File
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploadingResume}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Uploaded Resumes
                  </h4>
                  {resumesList.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 text-center text-xs text-zinc-500">
                      No resumes uploaded yet.
                    </div>
                  ) : (
                    resumesList.map((resume) => (
                      <div key={resume.id} className="space-y-4">
                        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 shrink-0 text-purple-400" />
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {resume.fileName}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {(resume.fileSize / 1024).toFixed(1)} KB •
                                Uploaded{' '}
                                {new Date(
                                  resume.createdAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${
                                resume.status === 'completed'
                                  ? 'border-emerald-800 bg-emerald-950/80 text-emerald-400'
                                  : resume.status === 'processing'
                                    ? 'border-amber-800 bg-amber-950/80 text-amber-400'
                                    : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              {resume.status}
                            </span>

                            {resume.status !== 'completed' ? (
                              <button
                                onClick={() => handleAnalyzeResume(resume.id)}
                                disabled={analyzingResumeId === resume.id}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-50"
                              >
                                {analyzingResumeId === resume.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5" />
                                )}
                                Analyze Resume
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleConfirmSkillsFromResume(resume)
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Confirm Skills to Profile
                              </button>
                            )}
                          </div>
                        </div>

                        {resume.extractedData && (
                          <div className="space-y-3 border-t border-zinc-800/80 pt-3">
                            <div className="text-xs font-medium text-zinc-300">
                              Extracted Evidence:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {resume.extractedData.skills?.map((s) => (
                                <span
                                  key={s.name}
                                  className="flex items-center gap-1 rounded-lg border border-purple-800/40 bg-purple-950/50 px-2.5 py-1 text-xs text-purple-300"
                                >
                                  <span>{s.name}</span>
                                  <span className="text-[10px] text-purple-400">
                                    ({Math.round(s.confidence * 100)}%)
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ProfileSection>

            <ProfileSection
              id="github"
              title="GitHub"
              description="Connect your repositories to support your profile."
              icon={GitBranch}
              status={githubData?.account ? 'Connected' : 'Not connected'}
            >
              <div className="space-y-5">
                {githubData?.account ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-base font-bold text-white">
                          {githubData.account.username
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-white">
                              {githubData.account.username}
                            </h3>
                            <a
                              href={githubData.account.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-white"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Status:{' '}
                            <span className="capitalize text-emerald-400">
                              {githubData.account.syncStatus}
                            </span>{' '}
                            • Last synced:{' '}
                            {githubData.account.lastSyncedAt
                              ? new Date(
                                  githubData.account.lastSyncedAt
                                ).toLocaleString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleSyncGithub}
                          disabled={isSyncingGithub}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isSyncingGithub ? 'animate-spin' : ''}`}
                          />
                          Sync Repositories
                        </button>
                        <button
                          onClick={handleDisconnectGithub}
                          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-rose-950/40 hover:text-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Synced Repositories (
                        {githubData.repositories?.length || 0})
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {githubData.repositories?.map((repo) => (
                          <div
                            key={repo.id}
                            className="rounded-xl border border-zinc-800/80 bg-black p-4"
                          >
                            <div className="mb-1 break-words text-sm font-semibold text-white">
                              {repo.name}
                            </div>
                            <p className="mb-2 line-clamp-2 text-xs text-zinc-400">
                              {repo.description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                              {repo.primaryLanguage && (
                                <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-purple-300">
                                  {repo.primaryLanguage}
                                </span>
                              )}
                              <span>★ {repo.stargazersCount}</span>
                              <span>Forks: {repo.forksCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start space-y-3">
                    <h3 className="text-base font-bold text-white">
                      Connect your GitHub account
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Connect your GitHub profile to extract evidence from your
                      public repositories, contributions, and primary
                      programming languages.
                    </p>
                    <button
                      onClick={handleConnectGithub}
                      disabled={isConnectingGithub}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                    >
                      <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      {isConnectingGithub ? 'Connecting…' : 'Connect GitHub'}
                    </button>
                  </div>
                )}
              </div>
            </ProfileSection>

            <ProfileSection
              id="evidence"
              title="Candidate evidence"
              description="Review the skills and experience behind your matches."
              icon={Layers}
              status={evidenceData?.evidence?.length || 0}
            >
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <span className="text-xs text-zinc-500">
                      Total Evidence
                    </span>
                    <div className="mt-1 text-lg font-bold text-white">
                      {evidenceData?.summary?.totalEvidenceItems || 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <span className="text-xs text-zinc-500">
                      Confirmed by You
                    </span>
                    <div className="mt-1 text-lg font-bold text-emerald-400">
                      {evidenceData?.summary?.confirmedItems || 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <span className="text-xs text-zinc-500">
                      Resume Evidence
                    </span>
                    <div className="mt-1 text-lg font-bold text-purple-400">
                      {evidenceData?.summary?.resumeEvidenceCount || 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <span className="text-xs text-zinc-500">
                      GitHub Evidence
                    </span>
                    <div className="mt-1 text-lg font-bold text-sky-400">
                      {evidenceData?.summary?.githubEvidenceCount || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Source-Linked Evidence Records
                  </h4>
                  {!evidenceData?.evidence ||
                  evidenceData.evidence.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-xs text-zinc-500">
                      No candidate evidence recorded yet. Upload a resume or
                      connect your GitHub account.
                    </div>
                  ) : (
                    evidenceData.evidence.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 2xl:flex-row 2xl:items-center 2xl:justify-between"
                      >
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {item.skillName}
                            </span>
                            <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                              {item.sourceType}
                            </span>
                            {item.isConfirmedByUser && (
                              <span className="flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                <Check className="h-2.5 w-2.5" />
                                Confirmed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {item.evidenceContext ||
                              'Verified via platform analysis'}
                          </p>
                          <p className="mt-1 text-[10px] text-zinc-600">
                            Confidence: {Math.round(item.confidenceScore * 100)}
                            % • Last updated:{' '}
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {!item.isConfirmedByUser && (
                          <button
                            onClick={async () => {
                              await apiClient.evidence.confirm(item.id, {
                                isConfirmed: true
                              });
                              const ev = await apiClient.evidence.list();
                              setEvidenceData(ev.data);
                              await refreshProfile();
                            }}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm Evidence
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ProfileSection>
          </div>
        </div>
      </main>
    </div>
  );
}
