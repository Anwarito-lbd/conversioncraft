export interface AuthUser {
  user_id: string;
  email: string;
  name?: string;
}

export interface AuthOrg {
  org_id: string;
  name: string;
  role: string;
}

export interface AuthSessionPayload {
  user_id: string;
  org_id: string;
  role: string;
  expires_at: string;
}

export interface AuthSessionState {
  token: string;
  session: AuthSessionPayload;
  user: AuthUser;
  org: AuthOrg;
  orgs?: Array<{ org_id: string; name: string; role: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SESSION_KEY = 'conversioncraft_auth_v1';

export const getStoredAuth = (): AuthSessionState | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSessionState;
  } catch {
    return null;
  }
};

export const saveStoredAuth = (value: AuthSessionState): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(value));
};

export const clearStoredAuth = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
};

export const getAuthToken = (): string => {
  const auth = getStoredAuth();
  return auth?.token || '';
};

export const registerWithPassword = async (params: {
  email: string;
  password: string;
  name?: string;
  orgName?: string;
}): Promise<AuthSessionState> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      name: params.name || '',
      org_name: params.orgName || '',
    }),
  });
  if (!response.ok) throw new Error(`Register failed: ${response.statusText}`);
  const data = (await response.json()) as AuthSessionState;
  saveStoredAuth(data);
  return data;
};

export const loginWithPassword = async (params: {
  email: string;
  password: string;
  orgId?: string;
}): Promise<AuthSessionState> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      org_id: params.orgId,
    }),
  });
  if (!response.ok) throw new Error(`Login failed: ${response.statusText}`);
  const data = (await response.json()) as AuthSessionState;
  saveStoredAuth(data);
  return data;
};

export const fetchAuthSession = async (): Promise<AuthSessionState> => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Session failed: ${response.statusText}`);
  const body = (await response.json()) as Omit<AuthSessionState, 'token'>;
  const merged: AuthSessionState = { ...body, token };
  saveStoredAuth(merged);
  return merged;
};

export const switchOrgSession = async (orgId: string): Promise<AuthSessionState> => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${API_BASE_URL}/api/auth/switch-org`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ org_id: orgId }),
  });
  if (!response.ok) throw new Error(`Switch org failed: ${response.statusText}`);
  const data = (await response.json()) as { token: string; session: AuthSessionPayload; org: AuthOrg };
  const current = getStoredAuth();
  if (!current) throw new Error('Missing current auth state');
  const merged: AuthSessionState = {
    ...current,
    token: data.token,
    session: data.session,
    org: data.org,
  };
  saveStoredAuth(merged);
  return merged;
};

export const logoutSession = async (): Promise<void> => {
  const token = getAuthToken();
  if (token) {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
  clearStoredAuth();
};

export const resolveActiveSession = async (): Promise<AuthSessionState | null> => {
  const current = getStoredAuth();
  if (!current?.token) return null;
  try {
    return await fetchAuthSession();
  } catch {
    clearStoredAuth();
    return null;
  }
};
