'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/');
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 z-10">
      <div className="w-full max-w-md glass-dark rounded-3xl p-8 border border-white/20 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-white mb-2 font-space-grotesk">Sign In</h1>
        <p className="text-white/70 mb-6">Welcome back. Continue your learning journey.</p>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-white/90 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-purple-600 text-white font-semibold hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-yellow-200 hover:text-yellow-100">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-cyan-200 hover:text-cyan-100">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
