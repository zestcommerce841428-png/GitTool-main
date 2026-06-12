'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
const CACHE_KEY = 'ff_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const FeatureFlagsContext = createContext<Record<string, boolean>>({});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // Seed from sessionStorage so flags are available on first render
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch {
      /* ignore */
    }
    return {};
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchFlags() {
      try {
        const res = await fetch(`${API_BASE}/flags`);
        if (!res.ok) return;
        const { flags: data } = await res.json();
        if (cancelled) return;
        setFlags(data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch {
        /* network error: keep existing/cached flags */
      }
    }

    fetchFlags();
    return () => {
      cancelled = true;
    };
  }, []);

  return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
}

/**
 * Returns the boolean value of a feature flag.
 * Defaults to `defaultValue` (false) if the flag has not loaded yet or does not exist.
 *
 * Usage:
 *   const paymentsEnabled = useFeatureFlag('payments_enabled');
 */
export function useFeatureFlag(key: string, defaultValue = false): boolean {
  const flags = useContext(FeatureFlagsContext);
  return key in flags ? flags[key] : defaultValue;
}

export default FeatureFlagsContext;
