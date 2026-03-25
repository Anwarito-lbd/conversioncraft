'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OAuthCallbackContent() {
  const params = useSearchParams();

  const code = useMemo(() => params.get('code') || '', [params]);
  const state = useMemo(() => params.get('state') || '', [params]);
  const error = useMemo(() => params.get('error') || '', [params]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-bold">OAuth Callback</h1>
        <p className="mt-2 text-sm text-slate-300">
          Copy these values into ConversionCraft Growth OS to complete account connection.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            OAuth error: {error}
          </div>
        ) : null}

        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
            <p className="text-slate-400">Code</p>
            <p className="mt-1 break-all font-mono text-cyan-200">{code || 'Not present'}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
            <p className="text-slate-400">State</p>
            <p className="mt-1 break-all font-mono text-cyan-200">{state || 'Not present'}</p>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/os" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Back To Growth OS
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10" />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
