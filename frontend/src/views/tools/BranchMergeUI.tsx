'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    GitBranch, GitMerge, CheckCircle, Loader2, AlertTriangle,
    Trash2, Shield, Clock, ExternalLink, ArrowUp, ArrowDown,
    Heart, RefreshCw, User, Search, ArrowUpDown, Copy, Check,
    Tag, GitCompare, Terminal, ChevronDown, ChevronUp
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import Link from 'next/link';
import api from '@/lib/apiClient';
import GitBranchGraph from '@/components/GitBranchGraph';

/* ── Helpers ──────────────────────────────────────────── */



function healthColor(score: any) {
    if (score >= 80) return { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Healthy' };
    if (score >= 50) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Warning' };
    return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Critical' };
}

function statusConfig(status: any) {
    switch (status) {
        case 'active':    return { text: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Active',    icon: CheckCircle };
        case 'stale':     return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Stale',     icon: Clock };
        case 'merged':    return { text: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Merged',    icon: GitMerge };
        case 'protected': return { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Protected', icon: Shield };
        default:          return { text: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: status,     icon: GitBranch };
    }
}

function branchType(name: any) {
    const n = name.toLowerCase();
    if (n.startsWith('feature') || n.startsWith('feat'))     return { label: 'Feature',  color: '#10b981' };
    if (n.startsWith('hotfix') || n.startsWith('fix'))       return { label: 'Hotfix',   color: '#ef4444' };
    if (n.startsWith('release') || n.startsWith('rel'))      return { label: 'Release',  color: '#8b5cf6' };
    if (n.startsWith('bugfix') || n.startsWith('bug'))       return { label: 'Bugfix',   color: '#f59e0b' };
    if (n.startsWith('dev') || n === 'develop')              return { label: 'Develop',  color: '#06b6d4' };
    if (n.startsWith('chore') || n.startsWith('deps'))       return { label: 'Chore',    color: '#94a3b8' };
    return null;
}

const TABS = [
    { key: 'all',       label: 'All' },
    { key: 'active',    label: 'Active' },
    { key: 'stale',     label: 'Stale' },
    { key: 'merged',    label: 'Merged' },
    { key: 'protected', label: 'Protected' },
];

const SORT_OPTIONS = [
    { key: 'health',  label: 'Health' },
    { key: 'behind',  label: 'Behind' },
    { key: 'ahead',   label: 'Commits' },
    { key: 'ageDays', label: 'Age' },
    { key: 'name',    label: 'Name' },
];

/* ── Copyable Command Pill ────────────────────────────── */
function CopyCmd({ cmd }: any) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={copy}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1 rounded-md bg-white/[0.04] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-colors border border-white/[0.06]"
        >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="opacity-50" />}
            <span className="truncate max-w-[260px]">{cmd}</span>
        </button>
    );
}

/* ── Component ────────────────────────────────────────── */

export default function BranchMergeUI() {
    const { selectedRepo: repo } = useWorkspace();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [selected, setSelected] = useState<any[]>([]);
    const [pruning, setPruning] = useState(false);
    const [pruneResult, setPruneResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('health');
    const [sortDir, setSortDir] = useState('asc');
    const [expandedRow, setExpandedRow] = useState<any>(null);

    const fetchBranches = useCallback(async () => {
        if (!repo) return;
        setLoading(true);
        setError(null);
        setPruneResult(null);
        try {
            const owner = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.get(`/branches/${owner}/${repo.name}/all`);
            setData(res);
            setSelected([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [repo]);

    useEffect(() => {
        if (repo) fetchBranches();
    }, [repo, fetchBranches]);

    /* ── Filtered + Sorted Branches ──── */
    const filteredBranches = useMemo(() => {
        if (!(data as any)?.branches) return [];
        let list = (data as any).branches;
        // Tab filter
        if (activeTab !== 'all') list = list.filter((b: any) => b.status === activeTab);
        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((b: any) =>
                b.name.toLowerCase().includes(q) ||
                b.lastCommitAuthor?.toLowerCase().includes(q) ||
                b.lastCommitMessage?.toLowerCase().includes(q)
            );
        }
        // Sort
        const sorted = [...list].sort((a: any, b: any) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            let cmp = 0;
            if (sortBy === 'name') {
                cmp = a.name.localeCompare(b.name);
            } else {
                cmp = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return sorted;
    }, [data, activeTab, searchQuery, sortBy, sortDir]);

    const toggleSort = (key: any) => {
        if (sortBy === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDir(key === 'name' ? 'asc' : 'asc');
        }
    };

    const toggleSelect = (name: any) => {
        setSelected(prev => prev.includes(name) ? prev.filter((n: any) => n !== name) : [...prev, name]);
    };

    const selectAllSafe = () => {
        const safe = filteredBranches.filter((b: any) => !b.protected && !b.isDefault).map((b: any) => b.name);
        setSelected(prev => prev.length === safe.length ? [] : safe);
    };

    const handlePrune = async (branchNames?: any) => {
        const toDelete = branchNames || selected;
        if (toDelete.length === 0 || !repo) return;
        setPruning(true);
        try {
            const owner = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/branches/${owner}/${repo.name}/prune`, { branches: toDelete });
            setPruneResult(res);
            setSelected([]);
            fetchBranches();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPruning(false);
        }
    };

    const compareLink = (branchName: any) => `/tools/compare?base=${encodeURIComponent((data as any)?.defaultBranch || 'main')}&head=${encodeURIComponent(branchName)}`;

    /* ── Health Overview Stats ──────── */
    const healthOverview = useMemo(() => {
        if (!(data as any)?.branches) return null;
        const nonDefault = (data as any).branches.filter((b: any) => !b.isDefault);
        const healthy  = nonDefault.filter((b: any) => b.health >= 80).length;
        const warning  = nonDefault.filter((b: any) => b.health >= 50 && b.health < 80).length;
        const critical = nonDefault.filter((b: any) => b.health < 50).length;
        const total = nonDefault.length || 1;
        return { healthy, warning, critical, total,
            pctHealthy:  Math.round(healthy / total * 100),
            pctWarning:  Math.round(warning / total * 100),
            pctCritical: Math.round(critical / total * 100),
        };
    }, [data]);

    /* ── Sortable Header Cell ──────── */
    const SortHeader = ({ sortKey, children, className = '' }: any) => (
        <th className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
            onClick={() => toggleSort(sortKey)}>
            <span className="inline-flex items-center gap-1">
                {children}
                {sortBy === sortKey ? (
                    sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                ) : (
                    <ArrowUpDown size={10} className="opacity-30" />
                )}
            </span>
        </th>
    );

    return (
        <div className="tool-page max-w-[1400px] mx-auto min-w-0">
            {/* ── Navbar ─────────────────────────── */}
            <SEO
                            title="Git Branch Pruner & Manager - Clean Up Stale Git Branches"
              description="Free git branch pruner and branch cleanup tool. Find stale branches, bulk delete merged branches, and prune remote git branches online. The best git branch manager for keeping your repo clean."
              keywords={[
                'git branch pruner', 'git branch cleanup tool',
                'delete merged branches git', 'prune remote git branches online',
                'git stale branch cleaner', 'how to clean up old git branches',
                'automatically delete merged branches github', 'git branch manager online free',
                'bulk delete git branches tool', 'find unused branches in github repo',
                'git branch pruning best practices', 'remove old branches from remote repository',
              ]}
              noIndex={true}
            />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GitBranch size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Branch Management</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {/* ── Health Overview + Stats ─────────── */}
            {data && healthOverview && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mb-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { label: 'Total',     value: (data as any).counts.total,     color: '#94a3b8' },
                            { label: 'Active',    value: (data as any).counts.active,    color: '#10b981' },
                            { label: 'Stale',     value: (data as any).counts.stale,     color: '#f59e0b' },
                            { label: 'Merged',    value: (data as any).counts.merged,    color: '#8b5cf6' },
                            { label: 'Protected', value: (data as any).counts.protected, color: '#3b82f6' },
                        ].map((s: any) => (
                            <button key={s.label}
                                className={`rounded-lg px-3 py-2.5 text-center transition-all hover:bg-white/[0.04] ${activeTab === s.label.toLowerCase() ? 'ring-1 ring-primary/30' : ''}`}
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                                onClick={() => setActiveTab(s.label.toLowerCase())}
                            >
                                <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Health Overview Bar */}
                    <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Branch Health</p>
                        <div className="flex rounded-full overflow-hidden h-2.5 mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            {healthOverview.pctHealthy > 0 && <div style={{ width: `${healthOverview.pctHealthy}%`, background: '#10b981' }} className="transition-all duration-500" />}
                            {healthOverview.pctWarning > 0 && <div style={{ width: `${healthOverview.pctWarning}%`, background: '#f59e0b' }} className="transition-all duration-500" />}
                            {healthOverview.pctCritical > 0 && <div style={{ width: `${healthOverview.pctCritical}%`, background: '#ef4444' }} className="transition-all duration-500" />}
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> {healthOverview.healthy} Healthy</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> {healthOverview.warning} Warning</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> {healthOverview.critical} Critical</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Controls Row ───────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Filters */}
                    <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {TABS.map((t: any) => (
                            <button key={t.key}
                                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                                    activeTab === t.key ? 'bg-primary/15 text-primary shadow-sm' : 'text-muted-foreground hover:text-white/70'
                                }`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                {t.label}
                                {data && <span className="ml-1 opacity-40">{t.key === 'all' ? (data as any).counts.total : (data as any).counts[t.key] || 0}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search branches…"
                            className="h-8 pl-8 pr-3 rounded-lg text-[12px] bg-white/[0.02] border border-white/[0.06] outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 w-48 text-foreground placeholder:text-muted-foreground/40 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selected.length > 0 && (
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors disabled:opacity-40"
                            disabled={pruning}
                            onClick={() => handlePrune()}
                        >
                            {pruning
                                ? <><Loader2 size={13} className="animate-spin" /> Deleting…</>
                                : <><Trash2 size={13} /> Delete ({selected.length})</>
                            }
                        </button>
                    )}
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                        onClick={fetchBranches}
                        disabled={loading}
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Alerts ──────────────────────────── */}
            {pruneResult && (
                <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 mb-4 text-[13px]"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" /> {pruneResult.message}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 mb-4 text-[13px] text-red-400"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertTriangle size={14} className="shrink-0" /> {error}
                </div>
            )}

            {/* ── Loading ─────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="text-primary animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Analyzing branches…</p>
                </div>

            ) : (data as any)?.branches?.length ? (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start min-w-0">
                        {/* ── Left Column: Branch Table & Smart Suggestions ──────────────── */}
                        <div className="flex flex-col gap-6 min-w-0">
                            {/* Branch Table */}
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th className="w-9 px-3 py-2.5">
                                            <input type="checkbox"
                                                checked={selected.length > 0 && selected.length === filteredBranches.filter((b: any) => !b.protected && !b.isDefault).length}
                                                onChange={selectAllSafe}
                                                className="rounded border-white/20 accent-primary"
                                            />
                                        </th>
                                        <SortHeader sortKey="name">Branch</SortHeader>
                                        <SortHeader sortKey="ahead" className="text-center">Commits</SortHeader>
                                        <SortHeader sortKey="behind" className="text-center">Behind</SortHeader>
                                        <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last Commit</th>
                                        <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Author</th>
                                        <SortHeader sortKey="health" className="text-center">Health</SortHeader>
                                        <SortHeader sortKey="ageDays" className="text-center">Age</SortHeader>
                                        <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBranches.map((b: any) => {
                                        const hc = healthColor(b.health);
                                        const sc = statusConfig(b.status);
                                        const StatusIcon = sc.icon;
                                        const bt = branchType(b.name);
                                        const isExpanded = expandedRow === b.name;

                                        return (
                                            <React.Fragment key={b.name}>
                                                <tr className="transition-colors hover:bg-white/[0.02] group cursor-pointer"
                                                    style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                                                    onClick={() => setExpandedRow(isExpanded ? null : b.name)}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="px-3 py-2" onClick={(e: any) => e.stopPropagation()}>
                                                        <input type="checkbox"
                                                            checked={selected.includes(b.name)}
                                                            onChange={() => toggleSelect(b.name)}
                                                            disabled={b.protected || b.isDefault}
                                                            className="rounded border-white/20 accent-primary disabled:opacity-20"
                                                        />
                                                    </td>

                                                    {/* Branch */}
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <GitBranch size={13} className="text-muted-foreground/40 shrink-0" />
                                                            <span className="font-mono text-[12px] font-semibold truncate max-w-[160px]">{b.name}</span>
                                                            {b.isDefault && (
                                                                <span className="text-[9px] px-1.5 py-px rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold shrink-0">default</span>
                                                            )}
                                                            {bt && (
                                                                <span className="text-[9px] px-1.5 py-px rounded-full font-medium shrink-0"
                                                                    style={{ color: bt.color, background: `${bt.color}15`, border: `1px solid ${bt.color}25` }}>
                                                                    {bt.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Commits (Ahead) */}
                                                    <td className="px-3 py-2 text-center">
                                                        {b.isDefault ? <span className="text-muted-foreground/30 text-[11px]">—</span> :
                                                            b.ahead > 0 ? (
                                                                <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold ${b.ahead > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                    {b.ahead}
                                                                    {b.ahead > 30 && <AlertTriangle size={9} className="ml-0.5" />}
                                                                </span>
                                                            ) : <span className="text-muted-foreground/30 text-[11px] font-mono">0</span>
                                                        }
                                                    </td>

                                                    {/* Behind */}
                                                    <td className="px-3 py-2 text-center">
                                                        {b.isDefault ? <span className="text-muted-foreground/30 text-[11px]">—</span> :
                                                            b.behind > 0 ? (
                                                                <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold ${b.behind > 20 ? 'text-red-400' : b.behind > 5 ? 'text-amber-400' : 'text-orange-300/60'}`}>
                                                                    <ArrowDown size={10} />{b.behind}
                                                                </span>
                                                            ) : <span className="text-muted-foreground/30 text-[11px] font-mono">0</span>
                                                        }
                                                    </td>

                                                    {/* Last Commit */}
                                                    <td className="px-3 py-2">
                                                        <span className="text-[11px] text-foreground/60 truncate block max-w-[180px]">
                                                            {b.lastCommitMessage || '—'}
                                                        </span>
                                                    </td>

                                                    {/* Author */}
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <User size={10} className="opacity-30" />
                                                            <span className="truncate max-w-[80px]">{b.lastCommitAuthor}</span>
                                                        </span>
                                                    </td>

                                                    {/* Health */}
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                            style={{ color: hc.text, background: hc.bg, border: `1px solid ${hc.border}` }}>
                                                            <Heart size={9} /> {b.health}
                                                        </span>
                                                    </td>

                                                    {/* Age + Status */}
                                                    <td className="px-3 py-2 text-center">
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-px rounded-full"
                                                                style={{ color: sc.text, background: sc.bg }}>
                                                                <StatusIcon size={9} /> {sc.label}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground/40">{b.ageDays}d</span>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-3 py-2 text-right" onClick={(e: any) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1 justify-end transition-opacity">
                                                            {/* Compare / PR */}
                                                            {!b.isDefault && (
                                                                <Link href={compareLink(b.name)}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-1 rounded-md bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
                                                                    title="Compare / Create PR">
                                                                    <GitCompare size={10} /> Compare & PR
                                                                </Link>
                                                            )}
                                                            {/* Delete */}
                                                            {!b.protected && !b.isDefault && (
                                                                <button
                                                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                                    onClick={() => handlePrune([b.name])}>
                                                                    <Trash2 size={10} /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Expanded Detail Row ──── */}
                                                {isExpanded && !b.isDefault && (
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td colSpan={9} className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.015)' }}>
                                                            <div className="flex flex-wrap gap-4 items-start">
                                                                {/* Rebase Suggestion */}
                                                                {b.behind > 0 && (
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 flex items-center gap-1">
                                                                            <Terminal size={10} /> Rebase Command
                                                                        </span>
                                                                        <CopyCmd cmd={`git checkout ${b.name} && git rebase ${(data as any).defaultBranch}`} />
                                                                    </div>
                                                                )}
                                                                {/* Checkout Command */}
                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                                                                        <Terminal size={10} /> Checkout
                                                                    </span>
                                                                    <CopyCmd cmd={`git checkout ${b.name}`} />
                                                                </div>
                                                                {/* Branch Info */}
                                                                <div className="flex flex-col gap-1.5 ml-auto text-right">
                                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Details</span>
                                                                    <div className="flex gap-4 text-[11px] text-muted-foreground">
                                                                        <span>SHA: <span className="font-mono text-foreground/60">{b.lastCommitSha?.slice(0, 7)}</span></span>
                                                                        <span>Drift: <span className="font-mono text-foreground/60">{b.ahead + b.behind} commits</span></span>
                                                                        <span>Age: <span className="font-mono text-foreground/60">{b.ageDays}d</span></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filteredBranches.length === 0 && (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                No branches match your search
                            </div>
                        )}
                    </div>

                    {/* ── Smart Suggestions ─────────── */}
                    {(data as any).suggestions?.length > 0 && showSuggestions && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle size={13} className="text-amber-400" />
                                    Cleanup Suggestions ({(data as any).suggestions.length})
                                </h3>
                                <button className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                    onClick={() => setShowSuggestions(false)}>Dismiss</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(data as any).suggestions.slice(0, 8).map((s: any, i: any) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/[0.02] transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                                s.type === 'behind' ? 'bg-red-500/10 text-red-400' :
                                                s.type === 'stale' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-emerald-500/10 text-emerald-400'
                                            }`}>{s.type}</span>
                                            <span className="text-[11px] text-foreground/60 truncate">{s.message}</span>
                                        </div>
                                        <span className="text-[10px] text-primary/50 shrink-0 ml-2 font-medium">{s.action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                        </div>

                        {/* ── Right Column: Branch Visualizer Widget ──────────────── */}
                        <div className="sticky top-6 min-w-0">
                            <GitBranchGraph repo={repo} />
                        </div>
                    </div>
                </>
            ) : data && (data as any).counts?.total === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <CheckCircle size={48} className="text-emerald-400 mb-4" />
                    <h3 className="font-bold mb-2">No Branches</h3>
                    <p className="text-sm text-muted-foreground">This repository has no branches to manage.</p>
                </div>
            ) : !loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <GitBranch size={48} className="text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground">Select a repository to analyze branches</p>
                </div>
            )}
        </div>
    );
}

