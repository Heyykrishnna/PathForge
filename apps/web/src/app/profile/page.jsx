'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import {
  User,
  GraduationCap,
  Sparkles,
  Plus,
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

  const [activeTab, setActiveTab] = useState('personal');
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
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);

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

        const [resumesRes, githubRes, evidenceRes] = await Promise.allSettled([
          apiClient.resumes.list(),
          apiClient.github.getAccount(),
          apiClient.evidence.list()
        ]);

        if (resumesRes.status === 'fulfilled') setResumesList(resumesRes.value.data || []);
        if (githubRes.status === 'fulfilled') setGithubData(githubRes.value.data || null);
        if (evidenceRes.status === 'fulfilled') setEvidenceData(evidenceRes.value.data || null);
      } catch {
        setFeedback({ type: 'error', message: 'Failed to load initial data.' });
      }
    }
    loadData();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: null, message: null });

    try {
      await apiClient.profile.update(formData);
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
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
      setEducations(prev => [res.data, ...prev]);
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
      setFeedback({ type: 'success', message: 'Education added successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add education.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      await apiClient.profile.deleteEducation(id);
      setEducations(prev => prev.filter(item => item.id !== id));
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Education deleted.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete education.' });
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    const updatedSkills = [
      ...skills.map(s => ({ name: s.name, category: s.category, proficiencyLevel: s.proficiencyLevel })),
      { name: newSkill.name.trim(), category: newSkill.category, proficiencyLevel: newSkill.proficiencyLevel }
    ];

    try {
      const res = await apiClient.profile.syncSkills(updatedSkills);
      setSkills(res.data);
      setNewSkill({ name: '', category: 'engineering', proficiencyLevel: 'intermediate' });
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Skills synced successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to sync skill.' });
    }
  };

  const handleDeleteSkill = async (skillName) => {
    const updatedSkills = skills
      .filter(s => s.name !== skillName)
      .map(s => ({ name: s.name, category: s.category, proficiencyLevel: s.proficiencyLevel }));

    try {
      const res = await apiClient.profile.syncSkills(updatedSkills);
      setSkills(res.data);
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Skill removed.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update skills.' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFeedback({ type: 'error', message: 'Only PDF documents are supported.' });
      return;
    }

    setIsUploadingResume(true);
    setFeedback({ type: null, message: null });

    const body = new FormData();
    body.append('resume', file);

    try {
      const res = await apiClient.resumes.upload(body);
      setResumesList(prev => [res.data, ...prev]);
      setFeedback({ type: 'success', message: 'Resume uploaded successfully! Ready for analysis.' });
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
      setResumesList(prev => prev.map(r => (r.id === id ? res.data : r)));
      const evRes = await apiClient.evidence.list();
      setEvidenceData(evRes.data);
      setFeedback({ type: 'success', message: 'Resume parsed and skills extracted into candidate evidence!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Analysis failed.' });
    } finally {
      setAnalyzingResumeId(null);
    }
  };

  const handleConfirmSkillsFromResume = async (resume) => {
    const extractedSkills = resume.extractedData?.skills?.map(s => s.name) || [];
    if (extractedSkills.length === 0) return;

    try {
      await apiClient.resumes.confirm(resume.id, { confirmedSkills: extractedSkills });
      await refreshProfile();
      const pRes = await apiClient.profile.get();
      setSkills(pRes.data.skills || []);
      const evRes = await apiClient.evidence.list();
      setEvidenceData(evRes.data);
      setFeedback({ type: 'success', message: 'Extracted skills confirmed into student profile!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Confirmation failed.' });
    }
  };

  const handleConnectGithub = async () => {
    try {
      const res = await apiClient.github.connect();
      const mockCode = 'mock_code_' + Date.now();
      const url = new URL(res.data.url);
      const state = url.searchParams.get('state');

      await apiClient.request(`/github/callback?code=${mockCode}&state=${state}`);
      const acc = await apiClient.github.getAccount();
      setGithubData(acc.data);
      setFeedback({ type: 'success', message: 'GitHub connected successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to connect GitHub.' });
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
      setFeedback({ type: 'success', message: 'Repositories and language evidence synced!' });
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
      setFeedback({ type: 'error', message: err.message || 'Failed to disconnect.' });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-400">
        Loading profile...
      </div>
    );
  }

  const completion = profile?.completionPercentage || 20;

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-purple-600 selection:text-white">
      <header className="border-b border-zinc-800/80 bg-black/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full border border-purple-500/50 bg-purple-950/40 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">Student Intelligence Profile</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              Applications
            </Link>
            <Link
              href="/internships"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Internships
            </Link>
            <Link
              href="/roadmaps"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              Roadmaps
            </Link>
            <span className="text-xs text-zinc-400 hidden sm:inline-block font-mono">
              {user.email}
            </span>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-2xl bg-zinc-950 border border-zinc-800/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {formData.firstName || 'Student'} {formData.lastName || ''}
                </h2>
                {user.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {formData.location || 'Location not specified'} • {formData.bio || 'Add a bio to complete your profile'}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-xs text-zinc-400 mb-1">Profile Strength</div>
              <div className="flex items-center gap-3">
                <div className="w-36 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-purple-400">{completion}%</span>
              </div>
            </div>
          </div>
        </section>

        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-zinc-800/80 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'personal'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="h-4 w-4" />
            Personal Details
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'education'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Education ({educations.length})
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'skills'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Skills ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('resumes')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'resumes'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Resume Intelligence ({resumesList.length})
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'github'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            GitHub ({githubData?.account ? 'Connected' : 'Not Connected'})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'evidence'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            Candidate Evidence ({evidenceData?.evidence?.length || 0})
          </button>
        </div>

        {activeTab === 'personal' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Bio / Summary</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Aspiring software engineer interested in systems, web development, and cloud computing."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="San Francisco, CA"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Portfolio / Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://mysite.dev"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">GitHub URL</label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Personal Details
            </button>
          </form>
        )}

        {activeTab === 'education' && (
          <div className="space-y-8 max-w-3xl">
            <form onSubmit={handleAddEducation} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-purple-400" />
                Add Education
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Institution</label>
                  <input
                    type="text"
                    required
                    value={newEducation.institution}
                    onChange={e => setNewEducation({ ...newEducation, institution: e.target.value })}
                    placeholder="University of California, Berkeley"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Degree</label>
                  <input
                    type="text"
                    required
                    value={newEducation.degree}
                    onChange={e => setNewEducation({ ...newEducation, degree: e.target.value })}
                    placeholder="Bachelor of Science"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Field of Study</label>
                  <input
                    type="text"
                    required
                    value={newEducation.fieldOfStudy}
                    onChange={e => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newEducation.startDate}
                    onChange={e => setNewEducation({ ...newEducation, startDate: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Graduation Date</label>
                  <input
                    type="date"
                    value={newEducation.endDate}
                    onChange={e => setNewEducation({ ...newEducation, endDate: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={newEducation.isCurrent}
                    onChange={e => setNewEducation({ ...newEducation, isCurrent: e.target.checked })}
                    className="rounded bg-black border-zinc-800 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isCurrent" className="text-xs text-zinc-400">Currently enrolled</label>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                >
                  Save Education
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {educations.map(edu => (
                <div
                  key={edu.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start justify-between gap-4"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-white">{edu.institution}</h4>
                    <p className="text-xs text-purple-400 mt-0.5">
                      {edu.degree} in {edu.fieldOfStudy}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(edu.startDate).getFullYear()} - {edu.isCurrent ? 'Present' : (edu.endDate ? new Date(edu.endDate).getFullYear() : 'N/A')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1.5 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-8 max-w-3xl">
            <form onSubmit={handleAddSkill} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-purple-400" />
                Add Skill to Catalogue
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Skill Name</label>
                  <input
                    type="text"
                    required
                    value={newSkill.name}
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="TypeScript, Docker, Python..."
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Proficiency</label>
                  <select
                    value={newSkill.proficiencyLevel}
                    onChange={e => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                >
                  Add Skill
                </button>
              </div>
            </form>

            <div>
              <h4 className="text-xs font-medium text-zinc-400 mb-3">Linked Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span
                    key={s.id || s.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-200"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-800/40">
                      {s.proficiencyLevel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(s.name)}
                      className="ml-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resumes' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-950/60 flex flex-col items-center justify-center text-center">
              <Upload className="h-10 w-10 text-purple-400 mb-3" />
              <h3 className="font-bold text-sm text-white mb-1">Upload Private Resume (PDF)</h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                Upload your resume in PDF format (max 5MB). Files are private, encrypted on disk, and analyzed locally without third-party leaks.
              </p>
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors inline-flex items-center gap-2">
                {isUploadingResume && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Select PDF File
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploadingResume}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Uploaded Resumes</h4>
              {resumesList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center text-xs text-zinc-500">
                  No resumes uploaded yet.
                </div>
              ) : (
                resumesList.map(resume => (
                  <div
                    key={resume.id}
                    className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-purple-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-sm text-white">{resume.fileName}</div>
                          <div className="text-xs text-zinc-500">
                            {(resume.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize border ${
                            resume.status === 'completed'
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                              : resume.status === 'processing'
                              ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {resume.status}
                        </span>

                        {resume.status !== 'completed' ? (
                          <button
                            onClick={() => handleAnalyzeResume(resume.id)}
                            disabled={analyzingResumeId === resume.id}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                            onClick={() => handleConfirmSkillsFromResume(resume)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm Skills to Profile
                          </button>
                        )}
                      </div>
                    </div>

                    {resume.extractedData && (
                      <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                        <div className="text-xs font-medium text-zinc-300">Extracted Evidence:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {resume.extractedData.skills?.map(s => (
                            <span
                              key={s.name}
                              className="px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-800/40 text-purple-300 text-xs flex items-center gap-1"
                            >
                              <span>{s.name}</span>
                              <span className="text-[10px] text-purple-400">({Math.round(s.confidence * 100)}%)</span>
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
        )}

        {activeTab === 'github' && (
          <div className="space-y-6 max-w-4xl">
            {githubData?.account ? (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center font-bold text-white text-base shrink-0">
                      {githubData.account.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{githubData.account.username}</h3>
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
                        Status: <span className="capitalize text-emerald-400">{githubData.account.syncStatus}</span> • Last synced: {githubData.account.lastSyncedAt ? new Date(githubData.account.lastSyncedAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncGithub}
                      disabled={isSyncingGithub}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncingGithub ? 'animate-spin' : ''}`} />
                      Sync Repositories
                    </button>
                    <button
                      onClick={handleDisconnectGithub}
                      className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 text-zinc-300 font-semibold text-xs transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Synced Repositories ({githubData.repositories?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {githubData.repositories?.map(repo => (
                      <div key={repo.id} className="p-4 rounded-xl bg-black border border-zinc-800/80">
                        <div className="font-semibold text-sm text-white mb-1">{repo.name}</div>
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{repo.description || 'No description provided'}</p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                          {repo.primaryLanguage && (
                            <span className="px-2 py-0.5 rounded bg-zinc-900 text-purple-300 border border-zinc-800">
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
              <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center max-w-xl mx-auto space-y-4">
                <GitBranch className="h-12 w-12 text-purple-400 mx-auto" />
                <h3 className="font-bold text-base text-white">Connect Your GitHub Account</h3>
                <p className="text-xs text-zinc-400">
                  Connect your GitHub profile to extract evidence from your public repositories, contributions, and primary programming languages.
                </p>
                <button
                  onClick={handleConnectGithub}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connect GitHub Profile
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-500">Total Evidence</span>
                <div className="text-lg font-bold text-white mt-1">{evidenceData?.summary?.totalEvidenceItems || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-500">Confirmed by You</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">{evidenceData?.summary?.confirmedItems || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-500">Resume Evidence</span>
                <div className="text-lg font-bold text-purple-400 mt-1">{evidenceData?.summary?.resumeEvidenceCount || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-500">GitHub Evidence</span>
                <div className="text-lg font-bold text-sky-400 mt-1">{evidenceData?.summary?.githubEvidenceCount || 0}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Source-Linked Evidence Records</h4>
              {(!evidenceData?.evidence || evidenceData.evidence.length === 0) ? (
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500">
                  No candidate evidence recorded yet. Upload a resume or connect your GitHub account.
                </div>
              ) : (
                evidenceData.evidence.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white">{item.skillName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {item.sourceType}
                        </span>
                        {item.isConfirmedByUser && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" />
                            Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{item.evidenceContext || 'Verified via platform analysis'}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Confidence: {Math.round(item.confidenceScore * 100)}% • Last updated: {new Date(item.updatedAt).toLocaleDateString()}</p>
                    </div>

                    {!item.isConfirmedByUser && (
                      <button
                        onClick={async () => {
                          await apiClient.evidence.confirm(item.id, { isConfirmed: true });
                          const ev = await apiClient.evidence.list();
                          setEvidenceData(ev.data);
                          await refreshProfile();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 border border-zinc-800 flex items-center gap-1 shrink-0"
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
        )}
      </main>
    </div>
  );
}
