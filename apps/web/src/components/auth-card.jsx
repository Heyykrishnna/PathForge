'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { OtpInput } from './ui/otp-input';

const Dither = dynamic(() => import('./ui/dither').then((mod) => mod.Dither), {
  ssr: false
});

export function AuthCard({ initialMode = 'signup' }) {
  const router = useRouter();
  const { login, register, verifyOtp, resendOtp } = useAuth();

  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleFormSubmit = async (e) => {
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
        setStep('otp');
        setResendCooldown(60);
      } else {
        await login({
          email: formData.email,
          password: formData.password
        });
        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          router.push('/profile');
        }, 800);
      }
    } catch (err) {
      setError(
        err.message || 'Authentication failed. Please check your details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otp;
    if (!code || code.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await verifyOtp({
        email: formData.email,
        otp: code
      });
      setSuccessMessage(
        'Email verified successfully! Setting up your profile...'
      );
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await resendOtp({ email: formData.email });
      setResendCooldown(60);
      setSuccessMessage('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-black p-2 font-sans text-white sm:p-4 lg:p-6">
      <div className="grid min-h-[calc(100svh-1rem)] w-full grid-cols-1 overflow-hidden rounded-[28px] border border-zinc-900 bg-black shadow-2xl sm:min-h-[calc(100svh-2rem)] lg:min-h-[calc(100svh-3rem)] lg:grid-cols-2 lg:rounded-[36px]">
        <div className="relative m-2 grid min-h-[560px] min-w-0 grid-rows-[1fr_auto_1fr] gap-8 overflow-hidden rounded-[24px] border border-zinc-800/60 bg-[#080512] p-6 sm:m-3 sm:p-8 lg:m-4 lg:min-h-0 lg:rounded-[30px] lg:p-12">
          <Dither
            className="pointer-events-none absolute inset-0 opacity-90"
            color1="#9d4edd"
            color2="#3a0ca3"
            color3="#0a0319"
            timeSpeed={0.2}
            warpStrength={1.2}
            noiseScale={2.5}
            grainAmount={0.08}
            contrast={1.4}
            zoom={0.85}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

          <div className="relative z-10 flex items-center gap-2.5 self-start">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight text-white">
              PathForge
            </span>
          </div>

          <div className="relative z-10 flex w-full max-w-sm flex-col items-center justify-self-center text-center">
            <h2 className="mb-3 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {step === 'otp'
                ? 'Verify Email'
                : mode === 'signup'
                  ? 'Get Started with Us'
                  : 'Welcome Back'}
            </h2>
            <p className="mb-8 max-w-sm font-sans text-sm text-zinc-300 sm:mb-10">
              {step === 'otp'
                ? 'Enter the 6-digit code sent to your email address to continue.'
                : mode === 'signup'
                  ? 'Complete these easy steps to register your account.'
                  : 'Sign into your account to access your personalized career roadmaps.'}
            </p>

            <div className="w-full max-w-sm space-y-3 text-left">
              <div
                className={`flex items-center gap-3.5 rounded-2xl p-3.5 backdrop-blur-md transition-all sm:p-4 ${
                  step === 'form'
                    ? 'border border-white bg-white font-semibold text-black shadow-lg shadow-white/5'
                    : 'border border-zinc-800/80 bg-zinc-900/80 text-zinc-200'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step === 'form'
                      ? 'bg-black text-white'
                      : step === 'otp'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {step === 'otp' ? '✓' : '1'}
                </div>
                <span className="text-sm font-medium">
                  {mode === 'signup'
                    ? 'Sign up your account'
                    : 'Sign into your account'}
                </span>
              </div>

              <div
                className={`flex items-center gap-3.5 rounded-2xl border p-3.5 backdrop-blur-md transition-all sm:p-4 ${
                  step === 'otp'
                    ? 'border-white bg-white font-semibold text-black shadow-lg shadow-white/5'
                    : 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step === 'otp'
                      ? 'bg-black text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium">
                  {step === 'otp' ? 'Verify your email' : 'Set up your profile'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 text-zinc-400 backdrop-blur-md sm:p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                  3
                </div>
                <span className="text-sm font-medium">
                  Discover internships & roadmaps
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 self-end text-center text-xs leading-relaxed text-zinc-400">
            Career intelligence & evidence-based internship matching
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center bg-black p-6 sm:p-10 lg:p-16">
          <div className="mx-auto w-full max-w-md">
            {step === 'otp' ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to edit details
                </button>

                <div className="mb-8 text-center">
                  <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Enter Verification Code
                  </h1>
                  <p className="text-xs text-zinc-400 sm:text-sm">
                    We sent a 6-digit numeric code to{' '}
                    <span className="font-medium text-white">
                      {formData.email}
                    </span>
                    .
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="my-8 flex justify-center">
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (error) setError(null);
                    }}
                    onComplete={(code) => handleVerifyOtp(code)}
                    disabled={isLoading}
                    status={error ? 'error' : isLoading ? 'loading' : 'idle'}
                    size="md"
                  />
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isLoading || otp.length < 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-md transition-all hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                    )}
                    Verify & Continue
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
                    <span>Didn&apos;t receive the email?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isLoading}
                      className="inline-flex items-center gap-1 font-medium text-white hover:underline disabled:opacity-40 disabled:hover:no-underline"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
                      />
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : 'Resend code'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8 text-center">
                  <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {mode === 'signup'
                      ? 'Sign Up Account'
                      : 'Log In to Account'}
                  </h1>
                  <p className="text-xs text-zinc-400 sm:text-sm">
                    {mode === 'signup'
                      ? 'Enter your personal data to create your account.'
                      : 'Enter your credentials to access your account.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="auth-first-name" className="mb-1.5 block text-xs font-medium text-zinc-300">
                          First Name
                        </label>
                        <input
                          id="auth-first-name"
                          type="text"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="eg. John"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-0"
                        />
                      </div>

                      <div>
                        <label htmlFor="auth-last-name" className="mb-1.5 block text-xs font-medium text-zinc-300">
                          Last Name
                        </label>
                        <input
                          id="auth-last-name"
                          type="text"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="eg. Francisco"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-zinc-300">
                      Email
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="eg. johnfrans@gmail.com"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              'Password reset link sent to your registered email.'
                            )
                          }
                          className="text-xs text-zinc-400 transition-colors hover:text-white"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p className="mt-1.5 text-xs text-zinc-500">
                        Must be at least 8 characters.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-md transition-all hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                    )}
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
                        className="ml-1 font-medium text-white hover:underline"
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
                        className="ml-1 font-medium text-white hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
