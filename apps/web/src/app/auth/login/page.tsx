'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Gem, LogIn, AlertCircle } from 'lucide-react';
import { loginSchema, type LoginInput } from '@gem/validators';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const emailA11y = errors.email
    ? {
      'aria-invalid': 'true' as const,
      'aria-describedby': 'email-error',
    }
    : {};

  const passwordA11y = errors.password
    ? {
      'aria-invalid': 'true' as const,
      'aria-describedby': 'password-error',
    }
    : {};

  const submitA11y = isLoading
    ? {
      'aria-busy': 'true' as const,
    }
    : {};

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push(redirect);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ?? 'Login failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0c1325] to-[#060a14] items-center justify-center"
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-5 bg-grid-pattern" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="text-center relative z-10 max-w-xs">
          <div className="text-8xl mb-6 animate-float">💎</div>
          <h2 className="text-3xl font-display font-bold text-white mb-3">
            Sri Lanka's Finest
          </h2>
          <p className="text-gray-400 text-lg">
            Over 2,400 certified gemstones from verified sellers
          </p>
          <div className="flex justify-center gap-6 mt-8">
            {['🔵 Sapphires', '🔴 Rubies', '💎 Alexandrite'].map((gem) => (
              <div key={gem} className="text-sm text-gray-500">{gem}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 group w-fit">
            <Gem size={24} className="text-gold-500" aria-hidden="true" />
            <span className="text-xl font-bold">
              <span className="text-white">Gem</span>
              <span className="text-gradient-gold"> Project</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400 mb-8">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-gold-500 hover:text-gold-400 font-medium transition-colors">
              Create one free
            </Link>
          </p>

          {/* Error alert */}
          {serverError && (
            <div
              className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Login form"
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                {...emailA11y}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  'input-gem',
                  errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                )}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-gold-500 hover:text-gold-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  {...passwordA11y}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={cn(
                    'input-gem pr-11',
                    errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full justify-center py-3 mt-2"
              {...submitA11y}
            >
              {isLoading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={18} aria-hidden="true" />
                  Log in
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e2d4e]" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-600 bg-gem-bg px-3">
              OR CONTINUE AS
            </div>
          </div>

          <Link
            href="/marketplace"
            className="btn-outline w-full justify-center py-3 text-sm"
          >
            Browse as Guest
          </Link>

          <p className="text-center text-xs text-gray-600 mt-6">
            By continuing, you agree to our{' '}
            <Link href="/legal/terms" className="text-gold-500/80 hover:text-gold-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-gold-500/80 hover:text-gold-500">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gem-bg">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
