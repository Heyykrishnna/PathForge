'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function AuthCard({ initialMode = 'signup' }) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        await login({
          email: formData.email,
          password: formData.password
        });
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/profile');
        }, 1200);
      } else {
        await login({
          email: formData.email,
          password: formData.password
        });
        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-6xl rounded-[32px] bg-black border border-zinc-900 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
        
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden rounded-[28px] m-3 border border-zinc-800/60 bg-[#0c0915]">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 15%, rgba(147, 51, 234, 0.45) 0%, rgba(107, 33, 168, 0.2) 40%, rgba(12, 9, 21, 0.95) 80%)'
            }}
          />

          <div className="relative z-10 flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">PathForge</span>
          </div>

          <div className="relative z-10 my-auto py-12 flex flex-col items-center text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              {mode === 'signup' ? 'Get Started with Us' : 'Welcome Back'}
            </h2>
            <p className="text-zinc-400 text-sm max-w-xs mb-10">
              {mode === 'signup'
                ? 'Complete these easy steps to register your account.'
                : 'Sign into your account to access your personalized career roadmaps.'}
            </p>

            <div className="w-full max-w-sm space-y-3 text-left">
              <div className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition-all ${
                mode === 'signup'
                  ? 'bg-white text-black shadow-lg shadow-white/5 font-semibold'
                  : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-300'
              }`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  mode === 'signup' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  1
                </div>
                <span className="text-sm">
                  {mode === 'signup' ? 'Sign up your account' : 'Sign into your account'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 text-zinc-400">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 shrink-0">
                  2
                </div>
                <span className="text-sm">Set up your profile</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 text-zinc-400">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 shrink-0">
                  3
                </div>
                <span className="text-sm">Discover internships & roadmaps</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-zinc-500 text-center sm:text-left">
            Career intelligence & evidence-based internship matching
          </div>
        </div>

        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-black">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {mode === 'signup' ? 'Sign Up Account' : 'Log In to Account'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                {mode === 'signup'
                  ? 'Enter your personal data to create your account.'
                  : 'Enter your credentials to access your account.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs font-medium text-zinc-200 transition-colors"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs font-medium text-zinc-200 transition-colors"
              >
                <svg className="h-4 w-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Github
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-black px-3 text-zinc-500 text-xs uppercase tracking-wider absolute">
                Or
              </span>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2.5">
                <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="eg. John"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="eg. Francisco"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="eg. johnfrans@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => alert('Password reset link sent to your registered email.')}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-zinc-500 text-xs mt-1.5">
                    Must be at least 8 characters.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-black" />}
                {mode === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-zinc-400">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-white font-medium hover:underline ml-1"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-white font-medium hover:underline ml-1"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

