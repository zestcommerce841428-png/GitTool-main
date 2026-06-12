'use client';

import api from '../lib/apiClient';
import { useQuery } from '@tanstack/react-query';

/**
 * Cached hook for the user's GitHub repositories.
 * staleTime: 5 minutes - repos rarely change mid-session.
 */
export function useRepos() {
    return useQuery({
        queryKey: ['repos'],
        queryFn: () => api.get('/repos').then(r => r.repos || []),
        staleTime: 5 * 60 * 1000,  // 5 min
        gcTime: 10 * 60 * 1000,    // keep in cache 10 min
        refetchOnWindowFocus: false,
    });
}

/**
 * Cached hook for branches of a specific repo.
 * staleTime: 2 minutes.
 */
export function useBranches(repo) {
    const owner = repo?.owner?.login || repo?.full_name?.split('/')[0];
    const name = repo?.name;

    return useQuery({
        queryKey: ['branches', owner, name],
        queryFn: () => api.get(`/repos/${owner}/${name}/branches`).then(r => r.branches || []),
        enabled: !!owner && !!name,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/**
 * Cached hook for recent commits of a repo.
 * staleTime: 1 minute - commits change more frequently.
 */
export function useCommits(repo) {
    const owner = repo?.owner?.login || repo?.full_name?.split('/')[0];
    const name = repo?.name;

    return useQuery({
        queryKey: ['commits', owner, name],
        queryFn: () => api.get(`/tools/${owner}/${name}/commits`).then(r => r.commits || []),
        enabled: !!owner && !!name,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/**
 * Cached hook for token balance.
 * staleTime: 2 minutes.
 */
export function useTokenBalance() {
    return useQuery({
        queryKey: ['tokens', 'balance'],
        queryFn: () => api.get('/tokens/balance').catch(() => null),
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/**
 * Cached hook for GitHub token status.
 */
export function useGitHubTokenStatus() {
    return useQuery({
        queryKey: ['tokens', 'github-status'],
        queryFn: () => api.get('/users/github-token/status').catch(() => null),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/**
 * Cached hook for token transactions.
 */
export function useTokenTransactions() {
    return useQuery({
        queryKey: ['tokens', 'transactions'],
        queryFn: () => api.get('/tokens/transactions').catch(() => null),
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/**
 * Generic tool data hook - caches per repo + tool endpoint.
 * Use for any `/tools/:owner/:repo/:endpoint` call.
 * 
 * Usage: useToolData(repo, 'code-scanning')
 */
export function useToolData(repo, endpoint, options = {}) {
    const owner = repo?.owner?.login || repo?.full_name?.split('/')[0];
    const name = repo?.name;

    return useQuery({
        queryKey: ['tool', endpoint, owner, name],
        queryFn: () => api.get(`/tools/${owner}/${name}/${endpoint}`),
        enabled: !!owner && !!name,
        staleTime: options.staleTime ?? 2 * 60 * 1000,
        gcTime: options.gcTime ?? 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        ...options,
    });
}

/**
 * Cached hook for commit graph data (branches + commits with parents).
 * staleTime: 2 minutes.
 */
export function useCommitGraph(repo) {
    const owner = repo?.owner?.login || repo?.full_name?.split('/')[0];
    const name = repo?.name;

    return useQuery({
        queryKey: ['commit-graph', owner, name],
        queryFn: () => api.get(`/tools/${owner}/${name}/commit-graph`),
        enabled: !!owner && !!name,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}


