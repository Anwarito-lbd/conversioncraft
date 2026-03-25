'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginWithPassword, registerWithPassword, getStoredAuth } from '@/services/authClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const current = getStoredAuth();
    if (current?.token) {
      router.replace('/os');
    }
  }, [router]);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithPassword({ email, password, name, orgName });
      } else {
        await loginWithPassword({ email, password });
      }
      router.replace('/os');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020612] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold">Conversion Craft</h1>
          <p className="mt-1 text-sm text-slate-300">Sign in to your workspace.</p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-700 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg px-3 py-2 text-sm ${mode === 'login' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-lg px-3 py-2 text-sm ${mode === 'register' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300'}`}
            >
              Register
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {mode === 'register' && (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organization name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </>
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2"
            />
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button
              type="button"
              disabled={loading || !email || !password}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-cyan-400 px-3 py-2 font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? 'Working...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            After sign-in, all API calls use your session token and org role for RBAC checks.
          </p>
          <Link href="/" className="mt-2 inline-block text-xs text-cyan-300 hover:underline">Back home</Link>
        </div>
      </div>
    </main>
  );
}
