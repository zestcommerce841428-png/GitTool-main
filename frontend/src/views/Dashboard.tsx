'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SEO from '@/components/SEO';
import {
    Code, Globe, Star, Sparkles,
    AlertTriangle, Loader2, GitBranch, Zap,
    RefreshCw, Clock, ArrowUpRight, Filter
} from 'lucide-react';
import { useRepos, useTokenBalance } from '@/hooks/useQueryHooks';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import GitBranchGraph from '@/components/GitBranchGraph';

// ── Language color map ──
const LANG_COLORS : Record<string, any> = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
    'C++': '#f34b7d', C: '#555555', HTML: '#e34c26', CSS: '#563d7c',
    Shell: '#89e051', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
};

// ── Shared card style (depth + border) ──
const CARD = "rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_10px_25px_rgba(0,0,0,0.35)] transition-all duration-200";
const CARD_HOVER = `${CARD} hover:border-white/[0.12] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_15px_35px_rgba(0,0,0,0.45)] hover:-translate-y-[3px]`;

function timeAgo(date: any) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function Dashboard() {
    const router = useRouter();
    const { selectedRepo } = useWorkspace();
    const { data: repos = [], isLoading: loadingRepos, error: repoErr } = useRepos();
    const { data: balance = null } = useTokenBalance();

    // ── Repo filtering ── ──
    const [repoFilter, setRepoFilter] = useState('all');

    const loading = loadingRepos;
    const error = repoErr?.message || null;

    // Derived stats
    const totalStars = repos.reduce((s: any, r: any) => s + (r.stargazers_count || 0), 0);
    const publicCount = repos.filter((r: any) => !r.private).length;
    const privateCount = repos.filter((r: any) => r.private).length;

    // Available languages for filter
    const languages = useMemo<string[]>(() => {
        const langs = new Set(repos.map((r: any) => r.language).filter(Boolean));
        return [...langs].sort() as string[];
    }, [repos]);

    // Filtered repos
    const filteredRepos = useMemo(() => {
        let list = repos;
        if (repoFilter === 'public') list = list.filter((r: any) => !r.private);
        else if (repoFilter === 'private') list = list.filter((r: any) => r.private);
        else if (repoFilter !== 'all') list = list.filter((r: any) => r.language === repoFilter);
        return list;
    }, [repos, repoFilter]);

    const recentlyUpdated = repos.slice(0, 5);

    // ── Loading state ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 size={48} className="text-primary mx-auto" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                    <p className="text-muted-foreground text-sm">Loading your workspace…</p>
                </div>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-[400px]">
                    <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
                    <p className="font-bold mb-2">Failed to load dashboard</p>
                    <p className="text-muted-foreground text-sm mb-4">{error}</p>
                    <button className="btn-primary inline-flex items-center gap-2" onClick={() => window.location.reload()}>
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-[1400px] mx-auto pb-8">
            <SEO
                title="Dashboard - Your GitHub Repositories"
                description="Manage your GitHub repositories and run AI-powered developer tools from the GitTool dashboard."
                keywords={['gittool dashboard', 'github repo dashboard', 'developer tools dashboard']}
                canonical="/dashboard"
                noIndex={true}
            />

            {/* ── Subtle background gradient */}
            <div className="pointer-events-none fixed inset-0 z-0"
                 style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.08), transparent 60%)' }} />

            <div className="relative z-10 flex flex-col gap-8">

                {/* ────── QUICK ACTIONS ────────────────────────────────────────────────────── */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-primary" />
                            <h2 className="text-[15px] font-bold m-0">Quick Actions</h2>
                        </div>
                        {balance && (
                            <div className="flex items-center gap-2 text-[13px]">
                                <Zap size={14} className="text-primary" />
                                <span className="text-muted-foreground">Credits:</span>
                                <span className="font-bold">{balance.balance?.toLocaleString() ?? '—'}</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { icon: Sparkles, label: 'Generate Commit', desc: 'Auto-summarize changes', route: '/tools/smart-commits' },
                            { icon: Code,     label: 'Release Notes',   desc: 'AI-generated changelog', route: '/tools/release-notes' },
                            { icon: Globe,    label: 'Workflow Builder', desc: 'Generate CI/CD pipelines', route: '/tools/workflow-builder' },
                        ].map((a: any) => (
                            <button
                                key={a.route}
                                className={`group flex cursor-pointer items-center gap-3 ${CARD_HOVER} border-primary/15 bg-primary/[0.04] px-4 py-3 text-left`}
                                onClick={() => router.push(a.route)}
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                                    <a.icon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="m-0 mb-0.5 text-sm font-bold group-hover:text-primary transition-colors">{a.label}</h3>
                                    <p className="m-0 text-[11px] text-muted-foreground">{a.desc}</p>
                                </div>
                                <ArrowUpRight size={14} className="ml-auto text-white/0 group-hover:text-primary/60 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ────── STATS GRID ────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Repo Stats */}
                    <div className={`${CARD} px-4 py-3.5 flex flex-col items-center justify-center text-center`}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Repos</p>
                        <p className="font-mono text-3xl font-bold leading-none">{repos.length}</p>
                        <div className="mt-2 flex gap-3 text-[11px]">
                            <span className="text-emerald-400">─ {publicCount} public</span>
                            <span className="text-amber-400">─ {privateCount} private</span>
                        </div>
                    </div>

                    {/* Stars */}
                    <div className={`${CARD} px-4 py-3.5 flex flex-col items-center justify-center text-center`}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Stars</p>
                        <div className="flex items-center gap-2">
                            <Star size={22} className="text-amber-400" />
                            <span className="font-mono text-2xl font-bold leading-none">{totalStars.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* AI Credits */}
                    <div className={`${CARD} px-4 py-3.5 flex flex-col justify-center`}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center sm:text-left">AI Credits</p>
                        {balance ? (
                            <>
                                <div className="mb-1.5 flex items-baseline gap-2 justify-center sm:justify-start">
                                    <span className="font-mono text-2xl font-bold leading-none">{balance.balance?.toLocaleString() ?? 0}</span>
                                    <span className="text-xs text-muted-foreground">/ {(balance.totalEarned ?? 40).toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] mt-1">
                                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, ((balance.balance ?? 0) / (balance.totalEarned || 40)) * 100)}%` }} />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center sm:text-left">{(balance.totalUsed ?? 0).toLocaleString()} used</p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center sm:text-left">Connect to view</p>
                        )}
                    </div>

                    {/* Quick Nav */}
                    <div className={`${CARD} px-4 py-3.5 flex flex-col justify-center`}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center sm:text-left">Navigation</p>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: 'Branch Management', route: '/tools/branch-merge' },
                                { label: 'Security Dashboard', route: '/tools/security' },
                                { label: 'Dead Code Detector', route: '/tools/dead-code' },
                            ].map((n: any) => (
                                <button key={n.route}
                                    className="text-left text-xs font-medium text-primary/80 hover:text-primary transition-colors flex items-center gap-1.5"
                                    onClick={() => router.push(n.route)}
                                >
                                    <span className="text-primary/40">—</span> {n.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ────── MAIN CONTENT: Repos (left) + Activity Panel (right) ────── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

                    {/* ── Left: Repositories ─────────────────── */}
                    <div className="min-w-0">
                        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-[15px] font-bold m-0">Your Repositories</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                                    {['all', 'public', 'private'].map((f: any) => (
                                        <button key={f}
                                            className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all capitalize
                                                ${repoFilter === f
                                                    ? 'bg-primary/15 text-primary shadow-sm'
                                                    : 'text-muted-foreground hover:text-white/70'}`}
                                            onClick={() => setRepoFilter(f)}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                    {languages.length > 0 && (
                                        <span className="mx-1 h-4 w-px bg-white/10" />
                                    )}
                                    {languages.slice(0, 4).map((lang: any) => (
                                        <button key={lang}
                                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1
                                                ${repoFilter === lang
                                                    ? 'bg-primary/15 text-primary shadow-sm'
                                                    : 'text-muted-foreground hover:text-white/70'}`}
                                            onClick={() => setRepoFilter(repoFilter === lang ? 'all' : lang)}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: LANG_COLORS[lang] || '#666' }} />
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{repos.length} total</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredRepos.map((repo: any) => {
                                const langColor = LANG_COLORS[repo.language] || 'var(--text-tertiary)';
                                return (
                                    <div key={repo.id} className={`group cursor-pointer ${CARD_HOVER} px-4 py-3.5`}>
                                        <div className="mb-2 flex items-start justify-between">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{
                                                background: repo.private ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                                                color: repo.private ? '#F59E0B' : '#10B981'
                                            }}>
                                                {repo.private ? <Globe size={16} /> : <Code size={16} />}
                                            </div>
                                            <span className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{
                                                color: repo.private ? '#F59E0B' : '#10B981',
                                                background: repo.private ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                                                border: `1px solid ${repo.private ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`
                                            }}>
                                                {repo.private ? 'Private' : 'Public'}
                                            </span>
                                        </div>
                                        <h3 className="mb-0.5 text-[13px] font-bold transition-colors group-hover:text-primary">{repo.name}</h3>
                                        <p className="mb-2.5 truncate text-[11px] text-muted-foreground">
                                            {repo.description || <span className="italic text-white/20">No description</span>}
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {repo.language && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                    <span className="h-2 w-2 rounded-full" style={{ background: langColor }} />
                                                    {repo.language}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Star size={11} /> {repo.stargazers_count}
                                            </div>
                                            {repo.forks_count > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <GitBranch size={11} /> {repo.forks_count}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 ml-auto">
                                                <Clock size={11} /> {timeAgo(repo.updated_at)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right: Activity Panel (sticky) ──────── */}
                    <div className="min-w-0">
                        <div className="lg:sticky lg:top-5 flex flex-col gap-4">

                            {/* Recent Activity */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <h2 className="text-sm font-bold m-0 uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
                                </div>
                                <div className={`${CARD} overflow-hidden`}>
                                    {recentlyUpdated.map((repo: any) => (
                                        <div key={repo.id} className="flex cursor-pointer items-start gap-2.5 border-b border-white/[0.04] px-3 py-2.5 transition-all hover:bg-white/[0.03] last:border-0">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                                                <GitBranch size={13} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="m-0 text-xs text-white/80">
                                                    <b className="font-semibold">{repo.name}</b>
                                                    <span className="text-white/30"> on </span>
                                                    <span className="font-mono text-[10px] text-white/40">{repo.default_branch}</span>
                                                </p>
                                                <p className="m-0 mt-0.5 text-[10px] text-white/30">{timeAgo(repo.updated_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentlyUpdated.length === 0 && (
                                        <p className="p-4 text-sm text-white/40">No recent activity</p>
                                    )}
                                </div>
                            </div>

                            {/* Git Branches Widget */}
                            <div className="min-h-[320px]">
                                <GitBranchGraph repo={selectedRepo} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

