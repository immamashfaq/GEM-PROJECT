'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Gem, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@gem/validators';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [watchedPassword, setWatchedPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const fullNameA11y = errors.fullName
    ? {
      'aria-invalid': 'true' as const,
      'aria-describedby': 'fullName-error',
    }
    : {};

  const usernameA11y = errors.username
    ? {
      'aria-invalid': 'true' as const,
      'aria-describedby': 'username-error',
    }
    : {};

  const emailA11y = errors.email
    ? {
      'aria-invalid': 'true' as const,
      'aria-describedby': 'reg-email-error',
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

  // Watch password for strength indicator
  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        fullName: data.fullName,
      });
      toast.success('Account created! Please log in.');
      router.push('/auth/login');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ?? 'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 group w-fit">
          <Gem size={24} className="text-gold-500" aria-hidden="true" />
          <span className="text-xl font-bold">
            <span className="text-white">Gem</span>
            <span className="text-gradient-gold"> Project</span>
          </span>
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400 mb-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gold-500 hover:text-gold-400 font-medium transition-colors">
            Log in
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Register form"
          className="space-y-5"
        >
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1.5">
              Full name <span className="text-gray-600">(optional)</span>
            </label>
            <input
              {...register('fullName')}
              {...fullNameA11y}
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Kamal Silva"
              className={cn('input-gem', errors.fullName && 'border-red-500')}
            />
            {errors.fullName && (
              <p id="fullName-error" className="mt-1.5 text-xs text-red-400" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              {...register('username')}
              {...usernameA11y}
              id="username"
              type="text"
              autoComplete="username"
              placeholder="ratnapuragems"
              className={cn('input-gem', errors.username && 'border-red-500')}
            />
            {errors.username ? (
              <p id="username-error" className="mt-1.5 text-xs text-red-400" role="alert">
                {errors.username.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-600">Letters, numbers, underscores, and dashes only</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              {...register('email')}
              {...emailA11y}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn('input-gem', errors.email && 'border-red-500')}
            />
            {errors.email && (
              <p id="reg-email-error" className="mt-1.5 text-xs text-red-400" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                {...register('password')}
                {...passwordA11y}
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                className={cn('input-gem pr-11', errors.password && 'border-red-500')}
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

            {/* Password strength */}
            {passwordValue && (
              <div className="mt-2 space-y-1" role="list" aria-label="Password requirements">
                {passwordRules.map((rule) => {
                  const passes = rule.test(passwordValue);
                  return (
                    <div
                      key={rule.label}
                      className={cn(
                        'flex items-center gap-2 text-xs transition-colors',
                        passes ? 'text-emerald-400' : 'text-gray-600',
                      )}
                      role="listitem"
                      aria-label={`${rule.label}: ${passes ? 'passed' : 'not met'}`}
                    >
                      <CheckCircle2
                        size={12}
                        className={passes ? 'text-emerald-400' : 'text-gray-700'}
                        aria-hidden="true"
                      />
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terms agreement */}
          <p className="text-xs text-gray-500">
            By creating an account you agree to our{' '}
            <Link href="/legal/terms" className="text-gold-500/80 hover:text-gold-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-gold-500/80 hover:text-gold-500">
              Privacy Policy
            </Link>
            .
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold w-full justify-center py-3"
            {...submitA11y}
          >
            {isLoading ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin"
                  aria-hidden="true"
                />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={18} aria-hidden="true" />
                Create account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
