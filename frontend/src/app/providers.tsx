'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

let signingOut = false;
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    // GitHub is the login mechanism, so an expired/invalid GitHub token means the
    // session is no longer valid — sign the user out of GitTool entirely and send
    // them back to sign in. Guarded so concurrent failures only sign out once.
    const onGithubAuthError = (error: unknown) => {
      if ((error as { code?: string })?.code === 'GITHUB_AUTH' && !signingOut) {
        signingOut = true;
        toast.error('Your GitHub session expired — signing you out. Please sign in again.');
        supabase.auth.signOut().finally(() => {
          window.location.href = '/auth';
        });
      }
    };
    const qc: QueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 2 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
      queryCache: new QueryCache({ onError: onGithubAuthError }),
      mutationCache: new MutationCache({ onError: onGithubAuthError }),
    });
    return qc;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FeatureFlagsProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#12121a',
                    color: '#e8e8ed',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.625rem',
                    fontSize: '0.85rem',
                  },
                }}
              />
              {children}
            </WorkspaceProvider>
          </AuthProvider>
        </FeatureFlagsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}