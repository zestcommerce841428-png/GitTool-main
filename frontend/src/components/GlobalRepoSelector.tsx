'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Loader2, GitBranch, FolderOpen } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useRepos, useBranches } from '../hooks/useQueryHooks';

export default function GlobalRepoSelector() {
    const { selectedRepo, setSelectedRepo, selectedBranch, setSelectedBranch } = useWorkspace();

    // Cached data via React Query
    const { data: repos = [], isLoading: loadingRepos, error: repoErr } = useRepos();
    const { data: branches = [], isLoading: loadingBranches, error: branchErr } = useBranches(selectedRepo);

    const repoError = repoErr?.message || null;
    const branchError = branchErr?.message || null;

    // Dropdown UI state
    const [openRepoDropdown, setOpenRepoDropdown] = useState(false);
    const [repoSearch, setRepoSearch] = useState('');
    const [openBranchDropdown, setOpenBranchDropdown] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');
    const repoRef = useRef<HTMLDivElement | null>(null);
    const branchRef = useRef<HTMLDivElement | null>(null);

    // Auto-select first repo if nothing selected
    useEffect(() => {
        if (!selectedRepo && repos.length > 0) {
            setSelectedRepo(repos[0]);
        }
    }, [repos, selectedRepo, setSelectedRepo]);

    // Auto-fix branch if not in new repo's branch list
    useEffect(() => {
        if (branches.length === 0) return;
        const branchExists = branches.find((b: any) => b.name === selectedBranch);
        if (!branchExists) {
            const fallback = selectedRepo?.default_branch
                || (branches.length > 0 ? branches[0].name : 'main');
            setSelectedBranch(fallback);
        }
    }, [branches, selectedBranch, selectedRepo, setSelectedBranch]);

    // Outside click handlers
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if ((repoRef.current as any) && !(repoRef.current as any).contains(e.target as Node)) setOpenRepoDropdown(false);
            if ((branchRef.current as any) && !(branchRef.current as any).contains(e.target as Node)) setOpenBranchDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredRepos = repos.filter((r: any) =>
        r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
    );

    const filteredBranches = branches.filter((b: any) =>
        b.name.toLowerCase().includes(branchSearch.toLowerCase())
    );

    const repoDisplayName = selectedRepo?.name || 'Select repo...';
    const repoOwner = selectedRepo?.full_name?.split('/')[0] || '';

    return (
        <div className="flex items-center gap-2">
            {/* --- REPO SELECTOR --- */}
            <div ref={repoRef} className="relative">
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenRepoDropdown(!openRepoDropdown); }}
                    className="flex items-center gap-2 rounded-lg h-8 px-2.5 text-[13px] font-medium transition-colors hover:bg-white/[0.06]"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <FolderOpen size={13} className="shrink-0 text-primary/70" />
                    {loadingRepos ? (
                        <Loader2 size={12} className="animate-spin text-muted-foreground" />
                    ) : (
                        <div className="flex items-center gap-1 overflow-hidden">
                            {repoOwner && <span className="text-muted-foreground/50 text-[12px] truncate">{repoOwner}/</span>}
                            <span className="truncate max-w-[120px]">{repoDisplayName}</span>
                        </div>
                    )}
                    <ChevronDown size={12} className={`shrink-0 opacity-40 transition-transform duration-200 ${openRepoDropdown ? 'rotate-180' : ''}`} />
                </button>

                {openRepoDropdown && (
                    <div className="absolute top-[calc(100%+4px)] right-0 z-[200] flex flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl max-h-80 w-[280px]"
                         style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="border-b border-white/[0.06] p-2">
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                                <input
                                    autoFocus
                                    value={repoSearch}
                                    onChange={(e) => setRepoSearch(e.target.value)}
                                    placeholder="Search repositories..."
                                    className="flex h-7 w-full rounded-md bg-transparent px-3 py-1 text-[12px] outline-none placeholder:text-muted-foreground/60 pl-8"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto w-full p-1 max-h-64">
                            {repoError && (
                                <div className="m-1.5 rounded-md bg-destructive/10 p-2.5 text-center text-[11px] text-destructive">
                                    {repoError}
                                </div>
                            )}
                            {!repoError && filteredRepos.length === 0 && (
                                <p className="p-3 text-center text-[11px] text-muted-foreground">
                                    No repositories found
                                </p>
                            )}
                            {filteredRepos.map((r: any) => (
                                <button
                                    type="button"
                                    key={r.id}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedRepo(r); setOpenRepoDropdown(false); setRepoSearch(''); }}
                                    className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-md px-2 py-1.5 text-[12px] outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${selectedRepo?.id === r.id ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}
                                >
                                    <span className="truncate font-medium">{r.full_name}</span>
                                    <span className={`shrink-0 ml-2 text-[10px] ${r.private ? 'text-destructive/70' : 'text-emerald-500/70'}`}>
                                        {r.private ? 'Private' : 'Public'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-white/[0.08]" />

            {/* --- BRANCH SELECTOR (pill style) --- */}
            <div ref={branchRef} className="relative">
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (selectedRepo) setOpenBranchDropdown(!openBranchDropdown); }}
                    disabled={!selectedRepo}
                    className="flex items-center gap-1.5 rounded-full h-7 px-3 text-[12px] font-medium transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        color: 'rgba(147,197,253,0.9)',
                    }}
                >
                    <GitBranch size={12} className="shrink-0" />
                    <span className="truncate max-w-[80px]">
                        {loadingBranches ? <Loader2 size={11} className="animate-spin" /> : (selectedBranch || 'branch...')}
                    </span>
                    <ChevronDown size={11} className={`shrink-0 opacity-50 transition-transform duration-200 ${openBranchDropdown ? 'rotate-180' : ''}`} />
                </button>

                {openBranchDropdown && (
                    <div className="absolute top-[calc(100%+4px)] right-0 z-[200] flex flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl max-h-80 w-[200px]"
                         style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="border-b border-white/[0.06] p-2">
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                                <input
                                    autoFocus
                                    value={branchSearch}
                                    onChange={(e) => setBranchSearch(e.target.value)}
                                    placeholder="Search branches..."
                                    className="flex h-7 w-full rounded-md bg-transparent px-3 py-1 text-[12px] outline-none placeholder:text-muted-foreground/60 pl-8"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto w-full p-1 max-h-64">
                            {branchError && (
                                <div className="m-1.5 rounded-md bg-destructive/10 p-2.5 text-center text-[11px] text-destructive">
                                    {branchError}
                                </div>
                            )}
                            {!branchError && filteredBranches.length === 0 && (
                                <p className="p-3 text-center text-[11px] text-muted-foreground">
                                    No branches found
                                </p>
                            )}
                            {filteredBranches.map((b: any) => (
                                <button
                                    type="button"
                                    key={b.name}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedBranch(b.name); setOpenBranchDropdown(false); setBranchSearch(''); }}
                                    className={`relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-[12px] outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${selectedBranch === b.name ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}
                                >
                                    <GitBranch size={11} className="shrink-0 mr-1.5 opacity-40" />
                                    <span className="truncate font-medium">{b.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

