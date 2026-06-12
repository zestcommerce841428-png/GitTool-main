import { supabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Centralised API client — auto‑attaches the Supabase JWT.
 * On a 401 response the token is refreshed once and the request retried.
 *
 * Usage:
 *   const data = await api.get('/repos');
 *   const data = await api.post('/commits/owner/repo/standardize', { diff });
 */

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

async function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function request(method, path, body, isRetry = false) {
  const token = await getAccessToken();
  const opts = { method, headers: await buildHeaders(token) };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));

    // A 401 from GitHub-token problems (code GITHUB_AUTH) is NOT a Supabase
    // session expiry — surface its message directly instead of refreshing/retrying.
    if (res.status === 401 && err.code !== 'GITHUB_AUTH' && !isRetry) {
      const { error } = await supabase.auth.refreshSession();
      if (!error) return request(method, path, body, true);
      throw new Error('Session expired. Please sign in again.');
    }

    const e = new Error(err.error || `API ${res.status}`);
    e.code = err.code;
    throw e;
  }
  return res.json();
}

const api = {
  get:    (path)        => request('GET', path),
  post:   (path, body)  => request('POST', path, body),
  put:    (path, body)  => request('PUT', path, body),
  patch:  (path, body)  => request('PATCH', path, body),
  delete: (path)        => request('DELETE', path),
};

export default api;
