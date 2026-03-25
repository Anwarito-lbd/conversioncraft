'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthSessionState } from '@/services/authClient';
import { logoutSession, switchOrgSession } from '@/services/authClient';

interface SessionControlsProps {
  auth: AuthSessionState | null;
  onSessionChanged?: (next: AuthSessionState) => void;
  compact?: boolean;
}

export default function SessionControls({ auth, onSessionChanged, compact = false }: SessionControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [switchError, setSwitchError] = useState('');
  if (!auth) return null;

  const orgs = Array.isArray(auth.orgs) ? auth.orgs : [];
  const currentOrgId = auth.session.org_id;

  const onOrgChange = async (nextOrgId: string) => {
    if (!nextOrgId || nextOrgId === currentOrgId) return;
    setBusy(true);
    setSwitchError('');
    try {
      const next = await switchOrgSession(nextOrgId);
      onSessionChanged?.(next);
      router.replace(pathname || '/os');
      router.refresh();
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : 'Org switch failed');
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await logoutSession();
    } finally {
      router.replace('/login');
      router.refresh();
      setBusy(false);
    }
  };

  return (
    <div className={`flex ${compact ? 'flex-row items-center gap-2' : 'flex-col items-end gap-2'}`}>
      <div className={`flex ${compact ? 'items-center gap-2' : 'flex-wrap items-center justify-end gap-2'}`}>
        <span className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-300">
          {auth.user.email}
        </span>
        {orgs.length > 1 ? (
          <select
            disabled={busy}
            value={currentOrgId}
            onChange={(e) => void onOrgChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-200"
          >
            {orgs.map((org) => (
              <option key={org.org_id} value={org.org_id}>
                {org.name} ({org.role})
              </option>
            ))}
          </select>
        ) : (
          <span className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-300">
            {auth.org.name} ({auth.org.role})
          </span>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onLogout()}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          {busy ? 'Working...' : 'Logout'}
        </button>
      </div>
      {switchError && <p className="text-[11px] text-rose-300">{switchError}</p>}
    </div>
  );
}
