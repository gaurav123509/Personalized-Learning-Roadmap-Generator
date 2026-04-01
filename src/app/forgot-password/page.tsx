'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword, startPasswordReset } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const requestCode = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const result = startPasswordReset(email);
    if (!result.ok || !('code' in result)) {
      setError(result.message);
      return;
    }

    setDemoCode(result.code ?? '');
    setInfo('Reset code generated. Enter code and set new password.');
    setStep(2);
  };

  const submitReset = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = resetPassword(email, code, newPassword);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setInfo('Password reset successful. Redirecting to login...');
    setTimeout(() => router.push('/login'), 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 z-10">
      <div className="w-full max-w-md glass-dark rounded-3xl p-8 border border-white/20 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-white mb-2 font-space-grotesk">Forgot Password</h1>
        <p className="text-white/70 mb-6">Recover your account in 2 quick steps.</p>

        {step === 1 && (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm mb-2">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
              />
            </div>

            {error && <p className="text-red-300 text-sm">{error}</p>}
            {info && <p className="text-green-300 text-sm">{info}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-purple-600 text-white font-semibold"
            >
              Send Reset Code
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitReset} className="space-y-4">
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-100 text-sm">
              Demo reset code: <span className="font-bold tracking-widest">{demoCode}</span>
            </div>

            <div>
              <label className="block text-white/90 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm mb-2">Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
              />
            </div>

            {error && <p className="text-red-300 text-sm">{error}</p>}
            {info && <p className="text-green-300 text-sm">{info}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-purple-600 text-white font-semibold"
            >
              Reset Password
            </button>
          </form>
        )}

        <div className="mt-5 text-sm text-white/70 flex items-center justify-between">
          <Link href="/login" className="text-cyan-200 hover:text-cyan-100">
            Back to login
          </Link>
          <Link href="/signup" className="text-yellow-200 hover:text-yellow-100">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
