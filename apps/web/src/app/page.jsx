'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  Terminal,
  ShieldCheck,
  User,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient.getHealth()
  });

  const healthData = data?.data;
  const isHealthy = healthData?.status === 'healthy';
  const dbConnected = healthData?.services?.database === 'connected';

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <header className="mb-10 text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-zinc-200 pb-8">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-black flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <div className="h-4 w-4 rounded-full border-2 border-purple-400 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">PathForge</h1>
          </div>
          <p className="text-base text-zinc-600">
            Internship Decision & Career Intelligence Platform
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/internships"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Briefcase className="h-3.5 w-3.5" />
            Internships
          </Link>

          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white text-zinc-800 text-xs font-semibold shadow-sm transition-colors"
          >
            Roadmaps
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/applications"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white text-zinc-800 text-xs font-semibold shadow-sm transition-colors"
              >
                Applications
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white text-zinc-800 text-xs font-semibold shadow-sm transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white text-zinc-800 text-xs font-semibold shadow-sm transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Sign Up
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
            Phase 6: Applications & Dashboard
          </span>
        </div>
      </header>

      <section className="mb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-zinc-700" />
              <h2 className="text-lg font-semibold text-zinc-900">System Readiness & Health Probe</h2>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-zinc-400" />
                <p className="text-sm font-medium">Probing API health endpoint...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 text-rose-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">API Communication Error</h3>
                    <p className="text-xs text-rose-700 mt-1">
                      {error.message || 'Unable to establish connection to the backend service.'}
                    </p>
                    <p className="text-xs text-rose-600 mt-2 font-mono">
                      Target: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/health
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500">API Service</span>
                    <Server className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-zinc-900 text-sm capitalize">
                      {healthData?.status || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Version: {data?.meta?.version}</p>
                </div>

                <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500">PostgreSQL Database</span>
                    <Database className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="font-bold text-zinc-900 text-sm capitalize">
                      {healthData?.services?.database || 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Drizzle ORM client</p>
                </div>

                <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500">Process Uptime</span>
                    <Activity className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="font-bold text-zinc-900 text-sm">
                    {healthData?.uptime ? `${healthData.uptime}s` : 'N/A'}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Node.js Express runtime</p>
                </div>

                <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500">Environment</span>
                    <ShieldCheck className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="font-bold text-zinc-900 text-sm capitalize">
                    {data?.meta?.environment || 'development'}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">API prefix: /api/v1</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            Phase 2 Scope & Capabilities
          </h2>
          <ul className="space-y-3 text-sm text-zinc-600">
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">✓</span>
              <span>Argon2id password hashing & generic authentication error safeguards</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">✓</span>
              <span>Rotating refresh sessions with HttpOnly, Secure, SameSite cookies</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">✓</span>
              <span>Single-use email verification and expiring password reset tokens</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">✓</span>
              <span>Structured student profile, education history CRUD & canonical skills sync</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">✓</span>
              <span>Multi-tenant data isolation and strict server-side ownership enforcement</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-zinc-700" />
            Authentication & Navigation
          </h2>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># Sign Up Page (Sleek dark theme UI)</p>
              <Link href="/register" className="text-purple-400 hover:underline">/register</Link>
            </div>
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># Log In Page (With rotating sessions)</p>
              <Link href="/login" className="text-purple-400 hover:underline">/login</Link>
            </div>
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># Student Profile & Education Dashboard</p>
              <Link href="/profile" className="text-purple-400 hover:underline">/profile</Link>
            </div>
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># Internship Intelligence & Hybrid Matching</p>
              <Link href="/internships" className="text-purple-400 hover:underline">/internships</Link>
            </div>
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># 7-Day Readiness Roadmaps & Bridge Projects</p>
              <Link href="/roadmaps" className="text-purple-400 hover:underline">/roadmaps</Link>
            </div>
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># Application Pipeline Tracker</p>
              <Link href="/applications" className="text-purple-400 hover:underline">/applications</Link>
            </div>
            <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl">
              <p className="text-zinc-400 mb-1"># Career Readiness Overview Dashboard</p>
              <Link href="/dashboard" className="text-purple-400 hover:underline">/dashboard</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
