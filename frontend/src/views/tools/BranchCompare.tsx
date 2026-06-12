'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    GitCompare, GitBranch, Loader2, AlertTriangle, CheckCircle,
    FileText, Plus, Minus, ChevronDown, ChevronRight, ArrowLeft,
    GitPullRequest, Copy, Check, Clock, User,
    FileCode, FileJson, FileIcon, Database, Terminal, Image as ImageIcon,
    Search, Filter, EyeOff, List, ArrowLeftRight, Info, GitCommit
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';
import CreatePRModal from '@/components/CreatePRModal';
// @ts-ignore
import Prism from 'prismjs';
import { diffWordsWithSpace } from 'diff';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';

/* ── Helpers ───────────────────────────────────────────── */

function timeAgo(date: any) {
    if (!date) return '—';
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

function fileStatusConfig(status: any) {
    switch (status) {
        case 'added':    return { label: 'A', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
        case 'modified': return { label: 'M', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
        case 'removed':  return { label: 'D', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
        case 'renamed':  return { label: 'R', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
        default:         return { label: '?', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
    }
}

function mergeStatusConfig(mergeState: any, mergeable: any, isIdentical: any) {
    if (mergeable && (mergeState === 'clean' || mergeState === 'ahead' || mergeState === 'identical' || isIdentical)) {
        return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle, label: 'Safe to merge' };
    }
    if (mergeState === 'dirty' || mergeState === 'diverged') {
        return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle, label: 'Merge conflicts detected' };
    }
    if (mergeState === 'behind') {
        return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle, label: 'Needs rebase' };
    }
    return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle, label: 'Review required' };
}

function getFileIcon(filename: any) {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js': case 'jsx': return { icon: FileCode, color: '#facc15' }; // yellow
        case 'ts': case 'tsx': return { icon: FileCode, color: '#3b82f6' }; // blue
        case 'json': return { icon: FileJson, color: '#10b981' }; // green
        case 'sql': return { icon: Database, color: '#a855f7' }; // purple
        case 'md': case 'mdx': return { icon: FileText, color: '#06b6d4' }; // cyan
        case 'sh': case 'bash': return { icon: Terminal, color: '#84cc16' }; // lime
        case 'png': case 'svg': case 'jpg': case 'jpeg': return { icon: ImageIcon, color: '#fb7185' }; // rose
        default: return { icon: FileText, color: '#94a3b8' }; // slate
    }
}

/* ── Diff Proportion Bar ───────────────────────────────── */
function DiffBar({ additions, deletions, total }: any) {
    if (!total) return null;
    const addPct = Math.max(0, (additions / total) * 100);
    const delPct = Math.max(0, (deletions / total) * 100);
    
    return (
        <div className="flex h-1.5 w-12 rounded-full overflow-hidden bg-white/5" title={`${additions} additions, ${deletions} deletions`}>
            {addPct > 0 && <div style={{ width: `${addPct}%`, background: '#10b981' }} />}
            {delPct > 0 && <div style={{ width: `${delPct}%`, background: '#ef4444' }} />}
        </div>
    );
}

/* ── Copy button ───────────────────────────────────────── */
function CopySha({ text }: any) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Copy full SHA">
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            {text.slice(0, 7)}
        </button>
    );
}

/* ── Component ─────────────────────────────────────────── */

export default function BranchCompare() {
    const searchParams = useSearchParams();
    const base = searchParams.get('base');
    const head = searchParams.get('head');
    const router = useRouter();
    const { selectedRepo: repo } = useWorkspace();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [expandedFiles, setExpandedFiles] = useState(new Set());
    const [showPRModal, setShowPRModal] = useState(false);

    // Filter states
    const [fileFilter, setFileFilter] = useState('all'); // all | added | modified | removed
    const [searchQuery, setSearchQuery] = useState('');
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    
    // Commit filtering state
    const [selectedCommit, setSelectedCommit] = useState<any>(null);
    const [commitData, setCommitData] = useState<any>(null);
    const [commitLoading, setCommitLoading] = useState(false);
    
    // View mode state
    const [viewMode, setViewMode] = useState('inline'); // 'inline' | 'split'
    const [wrapLines, setWrapLines] = useState(false);
    const searchInputRef = React.useRef<any>(null);
    
    // Sidebar & Perf state
    const [activeFile, setActiveFile] = useState<any>(null);
    const [visibleFilesCount, setVisibleFilesCount] = useState(15);
    const [collapsedDirs, setCollapsedDirs] = useState(new Set());

    useEffect(() => {
        if (!repo || !base || !head) return;
        const fetchCompare = async () => {
            setLoading(true);
            setError(null);
            try {
                const owner = repo.owner?.login || repo.full_name?.split('/')[0];
                const res = await api.get(`/branches/${owner}/${repo.name}/compare/${base}...${head}`);
                setData(res);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCompare();
    }, [repo, base, head]);
    // Derived states
    const activeData = selectedCommit && commitData ? commitData : data;

    const filteredFiles = React.useMemo(() => {
        if (!activeData?.files) return [];
        return activeData.files.filter((f: any) => {
            if (fileFilter !== 'all' && f.status !== fileFilter) return false;
            if (searchQuery && !f.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [activeData, fileFilter, searchQuery]);

    // Active file observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((e: any) => e.isIntersecting);
            if (visible.length > 0) {
                const topMost = visible.reduce((prev: any, curr: any) => 
                    curr.boundingClientRect.y < prev.boundingClientRect.y ? curr : prev
                );
                setActiveFile(topMost.target.id.replace('file-', ''));
            }
        }, { rootMargin: '-100px 0px -50% 0px' });

        filteredFiles.slice(0, visibleFilesCount).forEach((f: any) => {
            const el = document.getElementById(`file-${f.filename}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [filteredFiles, visibleFilesCount]);

    // Lazy load observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleFilesCount((prev: any) => prev + 15);
            }
        }, { rootMargin: '400px' });

        const sentinel = document.getElementById('lazy-load-sentinel');
        if (sentinel) observer.observe(sentinel);

        return () => observer.disconnect();
    }, [filteredFiles, visibleFilesCount]);

    const toggleFile = (filename: any) => {
        setExpandedFiles((prev: any) => {
            if (prev.has(filename)) {
                const next = new Set(prev);
                next.delete(filename);
                return next;
            } else {
                return new Set([filename]);
            }
        });
    };

    const expandAll = () => {
        if (!filteredFiles.length) return;
        
        // Are all current filtered files expanded?
        const allExpanded = filteredFiles.every((f: any) => expandedFiles.has(f.filename));
        
        if (allExpanded) {
            // Collapse all filtered files
            setExpandedFiles(new Set());
        } else {
            // Expand all filtered files
            setExpandedFiles(new Set(filteredFiles.map((f: any) => f.filename)));
        }
    };

    const owner = repo?.owner?.login || repo?.full_name?.split('/')[0] || '';

    const handleSelectCommit = async (sha: any) => {
        if (selectedCommit === sha) {
            setSelectedCommit(null);
            setCommitData(null);
            return;
        }
        setSelectedCommit(sha);
        setCommitLoading(true);
        try {
            const res = await api.get(`/branches/${owner}/${repo.name}/commits/${sha}`);
            setCommitData(res);
        } catch (err: any) {
            console.error("Failed to fetch commit", err);
        } finally {
            setCommitLoading(false);
        }
    };

    const counts = React.useMemo(() => {
        if (!activeData?.files) return { added: 0, modified: 0, removed: 0 };
        return {
            added: activeData.files.filter((f: any) => f.status === 'added').length,
            modified: activeData.files.filter((f: any) => f.status === 'modified').length,
            removed: activeData.files.filter((f: any) => f.status === 'removed').length,
        };
    }, [activeData]);
    
    // Helper to strip whitespace for comparison
    const stripWS = (str: any) => str.replace(/\s+/g, '');

    // Keyboard Navigation (j/k/f)
    useEffect(() => {
        const handleKeyDown = (e: any) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'j' || e.key === 'k') {
                e.preventDefault();
                if (filteredFiles.length === 0) return;

                // Get all DOM elements corresponding to filtered files
                const fileElements = filteredFiles.map((f: any) => document.getElementById(`file-${f.filename}`)).filter(Boolean);
                if (fileElements.length === 0) return;

                // Find currently visible element or default to first
                let currentIndex = -1;
                const scrollY = window.scrollY;
                
                for (let i = 0; i < fileElements.length; i++) {
                    const top = fileElements[i].getBoundingClientRect().top + scrollY;
                    if (top >= scrollY - 100) {
                        currentIndex = i;
                        break;
                    }
                }

                if (currentIndex === -1) currentIndex = 0;

                let targetIndex;
                if (e.key === 'j') {
                    // next file
                    targetIndex = Math.min(currentIndex + 1, fileElements.length - 1);
                } else {
                    // previous file
                    targetIndex = Math.max(currentIndex - 1, 0);
                }

                const targetEl = fileElements[targetIndex];
                if (targetEl) {
                    const y = targetEl.getBoundingClientRect().top + scrollY - 80;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredFiles]);

    return (
        <div className="tool-page max-w-[1400px] mx-auto">
            {/* ── Navbar ─────────────────────────── */}
            <SEO
                            title="Git Branch Compare Tool - Compare GitHub Branches Online Free"
                            description="Compare two git branches side-by-side online. See diffs, changed files, and commit history. Free git branch comparison tool - the easiest way to understand differences between git branches."
              keywords={[
                'branch compare tool', 'git branch compare', 'compare git branches online',
                'github branch diff tool', 'git branch comparison', 'git diff viewer online',
                'git workflow tools', 'git utilities online',
              ]}
              noIndex={true}
            />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/tools/branch-merge')}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GitCompare size={18} />
                    </div>
                    <div className="flex items-center gap-2">
                        <h2 className="tool-page-title">Branch Comparison</h2>
                    </div>
                </div>
            </NavbarPortal>

            {/* ── Branch Header ───────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <GitBranch size={13} className="inline mr-1.5 opacity-50" />{base}
                    </span>
                    <button onClick={() => router.push(`/tools/branch-compare?base=${head}&head=${base}`)}
                        className="p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.05] rounded transition-colors"
                        title="Swap branches">
                        <ArrowLeftRight size={14} />
                    </button>
                    <span className="font-mono text-[13px] px-3 py-1.5 rounded-lg font-semibold bg-primary/10 text-primary"
                        style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
                        <GitBranch size={13} className="inline mr-1.5 opacity-60" />{head}
                    </span>
                </div>
            </div>

            {/* ── Merge Status & Actions ───────────────────── */}
            {data && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
                    <div className="flex-1">
                        {(() => {
                            const ms = mergeStatusConfig((data as any).mergeState || (data as any).status, (data as any).mergeable, (data as any).status === 'identical');
                            const Icon = ms.icon;
                            return (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: ms.bg, color: ms.color }}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-foreground">{ms.label}</h3>
                                        <p className="text-[12px] text-muted-foreground mt-0.5">{(data as any).mergeStatus || 'Checking mergeability...'}</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {/* Action Buttons based on status */}
                        {((data as any).status === 'behind' || (data as any).mergeState === 'behind') && (
                            <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors border border-white/[0.08]">
                                <GitBranch size={14} /> Rebase branch
                            </button>
                        )}
                        {((data as any).mergeState === 'dirty' || (data as any).status === 'diverged') && (
                            <button onClick={() => setShowPRModal(true)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors border border-white/[0.08]">
                                <GitPullRequest size={14} /> View conflict files in PR
                            </button>
                        )}
                        {(data as any).mergeable && (
                            <button onClick={() => setShowPRModal(true)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <GitPullRequest size={14} /> Create PR
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Loading ─────────────────────────── */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="text-primary animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Comparing branches…</p>
                </div>
            )}

            {/* ── Error ───────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-[13px] text-red-400"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {data && (
                <>
                    {/* ── PR Readiness Insights ──────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Summary Panel */}
                        <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06]">
                            <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                                <Info size={13} /> Pull Request Summary
                            </h3>
                            <div className="flex items-center gap-6">
                                <div className="space-y-1">
                                    <p className="text-[13px] font-medium">{(data as any).totalCommits} commits</p>
                                    <p className="text-[13px] font-medium">{(data as any).totalFiles} files changed</p>
                                </div>
                                <div className="space-y-1 font-mono text-[12px]">
                                    <p className="text-emerald-400">+{(data as any).totalAdditions} additions</p>
                                    <p className="text-red-400">-{(data as any).totalDeletions} deletions</p>
                                </div>
                            </div>
                            {((data as any).totalFiles > 100 || (data as any).totalAdditions > 5000) && (
                                <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2">
                                    {(data as any).totalFiles > 100 && (
                                        <div className="flex items-center gap-2 text-[12px] text-amber-400/90 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 w-fit">
                                            <AlertTriangle size={12} /> Large PR Warning (over 100 files)
                                        </div>
                                    )}
                                    {(data as any).totalAdditions > 5000 && (
                                        <div className="flex items-center gap-2 text-[12px] text-red-400/90 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20 w-fit">
                                            <AlertTriangle size={12} /> High Risk Warning (over 5000 additions)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Top Changed Files */}
                        <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06]">
                            <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                                <GitCommit size={13} /> Most Changed Files
                            </h3>
                            <div className="flex flex-col gap-2">
                                {(data as any).files && [...(data as any).files].sort((a: any, b: any) => b.changes - a.changes).slice(0, 3).map((f: any) => {
                                    const iconConfig = getFileIcon(f.filename);
                                    const Icon = iconConfig.icon;
                                    return (
                                        <div key={f.filename} className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Icon size={12} style={{ color: iconConfig.color }} className="shrink-0" />
                                                <span className="font-mono truncate">{f.filename.split('/').pop()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono shrink-0">
                                                <span className="text-emerald-400 shrink-0">+{f.additions}</span>
                                                <span className="text-red-400 shrink-0">-{f.deletions}</span>
                                                <span className="text-muted-foreground/50 w-[50px] text-right shrink-0">{f.changes}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Stats Row ────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Commits', value: (data as any).totalCommits, color: '#3b82f6' },
                            { label: 'Files Changed', value: (data as any).totalFiles, color: '#f59e0b' },
                            { label: 'Additions', value: `+${(data as any).totalAdditions}`, color: '#10b981' },
                            { label: 'Deletions', value: `-${(data as any).totalDeletions}`, color: '#ef4444' },
                        ].map((s: any) => (
                            <div key={s.label} className="rounded-lg px-4 py-3 text-center"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Commits ──────────────────── */}
                    <div className="mb-6">
                        <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <GitBranch size={13} /> Commits ({(data as any).totalCommits})
                        </h3>
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                            {(data as any).commits.map((c: any, i: any) => (
                                <div key={c.sha}
                                    onClick={() => handleSelectCommit(c.sha)}
                                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                                        selectedCommit === c.sha 
                                            ? 'bg-primary/10 border-transparent' 
                                            : 'hover:bg-white/[0.02] border-transparent'
                                    }`}
                                    style={{ 
                                        borderBottom: i < (data as any).commits.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        borderLeft: selectedCommit === c.sha ? '2px solid rgba(59, 130, 246, 1)' : '2px solid transparent'
                                    }}>
                                    {/* Timeline dot */}
                                    <div className="relative shrink-0">
                                        <div className="h-2.5 w-2.5 rounded-full bg-primary/60 ring-2 ring-primary/20" />
                                        {i < (data as any).commits.length - 1 && (
                                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-[calc(100%+12px)] bg-white/[0.06]" />
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-medium truncate">{c.message}</p>
                                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/50">
                                            <span className="flex items-center gap-1"><User size={9} /> {c.author}</span>
                                            <span className="flex items-center gap-1"><Clock size={9} /> {timeAgo(c.date)}</span>
                                        </div>
                                    </div>

                                    {/* SHA */}
                                    <CopySha text={c.sha} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Files Changed Header & Controls ────── */}
                    <div className="mb-4">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            {selectedCommit ? (
                                <div className="flex items-center gap-2 shrink-0">
                                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <FileText size={13} /> {commitLoading ? 'Loading Commit...' : `Files Changed in Commit`}
                                    </h3>
                                    {!commitLoading && (
                                        <button onClick={() => { setSelectedCommit(null); setCommitData(null); }} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground">
                                            Clear Filter
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 shrink-0">
                                    <FileText size={13} /> Files Changed ({(data as any).totalFiles})
                                </h3>
                            )}
                            
                            <div className="flex flex-wrap items-center justify-end gap-3 flex-1 text-[12px]">
                                {/* Status Filters */}
                                <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
                                    {[
                                        { id: 'all', label: 'All', count: (data as any).totalFiles },
                                        { id: 'added', label: 'Added', count: counts.added },
                                        { id: 'modified', label: 'Modified', count: counts.modified },
                                        { id: 'removed', label: 'Deleted', count: counts.removed }
                                    ].map((f: any) => (
                                        <button key={f.id} onClick={() => setFileFilter(f.id)}
                                            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${fileFilter === f.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            {f.label} <span className="opacity-50 text-[10px]">{f.count}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="hidden md:block w-px h-6 bg-white/10" />

                                {/* Search */}
                                <div className="relative">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input 
                                        ref={searchInputRef}
                                        type="text" 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search files… (Press 'f')" 
                                        className="h-8 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-foreground text-[12px] placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-48"
                                    />
                                </div>

                                <div className="hidden md:block w-px h-6 bg-white/10" />

                                <div className="flex items-center gap-3">
                                    {/* View Mode Toggle */}
                                    <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
                                        <button onClick={() => setViewMode('inline')}
                                            className={`px-3 py-1 rounded-md font-medium transition-colors ${viewMode === 'inline' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            Inline
                                        </button>
                                        <button onClick={() => setViewMode('split')}
                                            className={`px-3 py-1 rounded-md font-medium transition-colors ${viewMode === 'split' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            Split
                                        </button>
                                    </div>

                                    {/* Review Mode Toggle */}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors group ml-2 border-l border-white/10 pl-3">
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={reviewMode} 
                                            onChange={(e) => setReviewMode(e.target.checked)} 
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${reviewMode ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/20 bg-white/[0.02]'}`}>
                                            {reviewMode && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <span>Review Mode</span>
                                        <Info size={13} className="opacity-40" aria-label="Only show changed sections" />
                                    </label>

                                    {/* Ignore Whitespace */}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors group ml-2">
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={ignoreWhitespace} 
                                            onChange={(e) => setIgnoreWhitespace(e.target.checked)} 
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${ignoreWhitespace ? 'bg-primary border-primary text-white' : 'border-white/20 bg-white/[0.02]'}`}>
                                            {ignoreWhitespace && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <span>Ignore whitespace</span>
                                    </label>

                                    {/* Wrap Lines */}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors group ml-2">
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={wrapLines} 
                                            onChange={(e) => setWrapLines(e.target.checked)} 
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${wrapLines ? 'bg-primary border-primary text-white' : 'border-white/20 bg-white/[0.02]'}`}>
                                            {wrapLines && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <span>Wrap lines</span>
                                    </label>

                                    {/* Expand/Collapse All */}
                                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={expandAll}>
                                        <List size={13} />
                                        {filteredFiles.length > 0 && filteredFiles.every((f: any) => expandedFiles.has(f.filename)) ? 'Collapse all' : 'Expand all'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 items-start relative">
                        {/* ── File Navigation Sidebar ─────────────────── */}
                        <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
                            <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col custom-scrollbar">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground p-4 pb-2 border-b border-white/[0.06] sticky top-0 bg-[#0d0d14]/90 backdrop-blur-md z-10">
                                    Files
                                </h4>
                                <div className="flex flex-col py-2">
                                    {(() => {
                                        // Group files by directory
                                        const grouped = filteredFiles.reduce((acc: any, f: any) => {
                                            const parts = f.filename.split('/');
                                            const file = parts.pop();
                                            const dir = parts.length > 0 ? parts.join('/') + '/' : '/';
                                            if (!acc[dir]) acc[dir] = { items: [], additions: 0, deletions: 0 };
                                            acc[dir].items.push({ ...f, baseName: file });
                                            acc[dir].additions += f.additions;
                                            acc[dir].deletions += f.deletions;
                                            return acc;
                                        }, {});

                                        // Render directories then files
                                        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dir, data]) => {
                                            const isCollapsed = collapsedDirs.has(dir);
                                            return (
                                                <div key={dir} className="mb-2">
                                                    {dir !== '/' && (
                                                        <div 
                                                            className="px-4 py-1 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]"
                                                            onClick={() => {
                                                                setCollapsedDirs((prev: any) => {
                                                                    const next = new Set(prev);
                                                                    next.has(dir) ? next.delete(dir) : next.add(dir);
                                                                    return next;
                                                                });
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                {isCollapsed ? <ChevronRight size={12} className="text-muted-foreground/50 shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground/50 shrink-0" />}
                                                                <span className="font-mono text-[11px] text-muted-foreground font-bold tracking-wider truncate">{dir}</span>
                                                            </div>
                                                            <div className="hidden group-hover:flex items-center gap-1.5 text-[9px] font-mono shrink-0">
                                                                {(data as any).additions > 0 && <span className="text-emerald-400">+{(data as any).additions}</span>}
                                                                {(data as any).deletions > 0 && <span className="text-red-400">-{(data as any).deletions}</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!isCollapsed && (data as any).items.map((f: any) => {
                                                        const iconConfig = getFileIcon(f.filename);
                                                        const Icon = iconConfig.icon;
                                                        const isActive = activeFile === f.filename;
                                                        return (
                                                            <button key={`nav-${f.filename}`} 
                                                                onClick={() => {
                                                                    setExpandedFiles(new Set([f.filename]));
                                                                    setTimeout(() => {
                                                                        const el = document.getElementById(`file-${f.filename}`);
                                                                        if (el) {
                                                                            const y = el.getBoundingClientRect().top + window.scrollY - 80;
                                                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                                                        }
                                                                    }, 100);
                                                                }}
                                                                className={`flex items-center justify-between px-4 py-1.5 w-full text-left transition-colors group ${isActive ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-white/[0.04]'}`}>
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div className="w-2 shrink-0" />
                                                                    <Icon size={12} style={{ color: iconConfig.color }} className={`shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                                                                    <span className={`font-mono text-[11px] truncate ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground'}`} title={f.filename}>
                                                                        {f.baseName}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[9px] font-mono shrink-0 opacity-50 group-hover:opacity-100">
                                                                    {f.additions > 0 && <span className="text-emerald-400">+{f.additions}</span>}
                                                                    {f.deletions > 0 && <span className="text-red-400">-{f.deletions}</span>}
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </aside>

                        {/* ── Main Diff Area ──────────────────────────── */}
                        <div className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                            {filteredFiles.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-[13px] bg-white/[0.01]">
                                    <Filter size={24} className="mx-auto mb-2 opacity-30" />
                                    No files match the current filters.
                                </div>
                            ) : expandedFiles.size === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center text-muted-foreground text-[13px] bg-white/[0.01] h-full">
                                    <FileCode size={32} className="mb-4 opacity-20" />
                                    <p>Select a file from the sidebar to view its diff</p>
                                </div>
                            ) : (
                                <>
                                    {filteredFiles.filter((f: any) => expandedFiles.has(f.filename)).slice(0, visibleFilesCount).map((f: any, i: any, arr: any) => {
                                        const fsc = fileStatusConfig(f.status);
                                        const isExpanded = true;
                                        const iconConfig = getFileIcon(f.filename);
                                        const Icon = iconConfig.icon;

                                        return (
                                            <div key={f.filename} id={`file-${f.filename}`} style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                {/* File row (Sticky Header) */}
                                                <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(13, 13, 20, 0.85)' }}>
                                                    <div className="flex items-center w-full justify-between gap-3 px-4 py-2 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">
                                                        <button className="flex items-center gap-3 text-left flex-1 min-w-0" onClick={() => toggleFile(f.filename)}>
                                                            {isExpanded ? <ChevronDown size={13} className="shrink-0 text-muted-foreground/40" /> : <ChevronRight size={13} className="shrink-0 text-muted-foreground/40" />}
                                                            <Icon size={14} style={{ color: iconConfig.color }} className="shrink-0" />
                                                            <span className="font-mono text-[12px] truncate">{f.filename}</span>
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center shrink-0 uppercase tracking-wider" style={{ color: fsc.color, background: fsc.bg }}>
                                                                {f.status === 'added' ? 'Added' : f.status === 'removed' ? 'Deleted' : fsc.label === 'M' ? 'Modified' : f.status}
                                                            </span>
                                                        </button>
                                                        
                                                        {/* Stats + Actions */}
                                                        <div className="flex items-center gap-4 shrink-0">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 text-[11px] font-mono">
                                                                    {f.additions > 0 && <span className="flex items-center gap-0.5 text-emerald-400"><Plus size={10} />{f.additions}</span>}
                                                                    {f.deletions > 0 && <span className="flex items-center gap-0.5 text-red-400"><Minus size={10} />{f.deletions}</span>}
                                                                </div>
                                                                <DiffBar additions={f.additions} deletions={f.deletions} total={f.changes} />
                                                            </div>
                                                            <div className="hidden sm:flex items-center gap-2 border-l border-white/[0.08] pl-4">
                                                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(f.filename); }}
                                                                    className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors" title="Copy path">
                                                                    <Copy size={13} />
                                                                </button>
                                                                <a href={`https://github.com/${owner}/${repo?.name}/blob/${head}/${f.filename}`} target="_blank" rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:bg-white/[0.05] hover:text-foreground rounded transition-colors border border-white/[0.08]">
                                                                    View File
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Diff patch */}
                                                {isExpanded && f.patch && (
                                                    <div className="mx-4 mb-4 mt-2 rounded-lg overflow-hidden border border-white/[0.06]">
                                                        <div className="text-[11px] font-mono leading-relaxed overflow-x-auto p-0 m-0">
                                                            {(() => {
                                                                const rawLines = f.patch.split('\n');
                                                                let parsedLines = [];
                                                                let oldLineNum = 0;
                                                                let newLineNum = 0;

                                                                for (let i = 0; i < rawLines.length; i++) {
                                                                    const line = rawLines[i];
                                                                    if (line.startsWith('@@')) {
                                                                        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
                                                                        if (match) {
                                                                            oldLineNum = parseInt(match[1], 10);
                                                                            newLineNum = parseInt(match[2], 10);
                                                                        }
                                                                        parsedLines.push({ type: 'header', text: line, oldLine: null, newLine: null });
                                                                    } else if (line.startsWith('---') || line.startsWith('+++')) {
                                                                        parsedLines.push({ type: 'header', text: line, oldLine: null, newLine: null });
                                                                    } else if (line.startsWith('-')) {
                                                                        parsedLines.push({ type: 'delete', text: line, oldLine: oldLineNum++, newLine: null });
                                                                    } else if (line.startsWith('+')) {
                                                                        parsedLines.push({ type: 'insert', text: line, oldLine: null, newLine: newLineNum++ });
                                                                    } else if (line.startsWith(' ') || line === '') {
                                                                        parsedLines.push({ type: 'context', text: line, oldLine: oldLineNum++, newLine: newLineNum++ });
                                                                    } else if (line.startsWith('\\')) {
                                                                        parsedLines.push({ type: 'info', text: line, oldLine: null, newLine: null });
                                                                    }
                                                                }

                                                                // Ignore Whitespace
                                                                if (ignoreWhitespace) {
                                                                    let visibleParsed = [];
                                                                    let deletesBlock = [];
                                                                    for (let p of parsedLines) {
                                                                        if ((p as any).type === 'delete') {
                                                                            visibleParsed.push(p);
                                                                            deletesBlock.push(visibleParsed.length - 1);
                                                                        } else if ((p as any).type === 'insert') {
                                                                            const stripped = stripWS((p as any).text.substring(1));
                                                                            let matchedIdx = -1;
                                                                            for(let k = 0; k < deletesBlock.length; k++) {
                                                                                let dIdx = deletesBlock[k];
                                                                                if (visibleParsed[dIdx] && stripWS(visibleParsed[dIdx].text.substring(1)) === stripped) {
                                                                                    matchedIdx = dIdx;
                                                                                    deletesBlock.splice(k, 1);
                                                                                    break;
                                                                                }
                                                                            }
                                                                            if (matchedIdx !== -1) {
                                                                                visibleParsed[matchedIdx] = null;
                                                                            } else {
                                                                                visibleParsed.push(p);
                                                                            }
                                                                        } else {
                                                                            deletesBlock = [];
                                                                            visibleParsed.push(p);
                                                                        }
                                                                    }
                                                                    parsedLines = visibleParsed.filter(Boolean);
                                                                }

                                                                // Review mode
                                                                if (reviewMode) {
                                                                    let reviewed = [];
                                                                    let contextBuffer = [];
                                                                    const contextThreshold = 3;

                                                                    for (let p of parsedLines) {
                                                                        if ((p as any).type === 'context') {
                                                                            contextBuffer.push(p);
                                                                        } else {
                                                                            if (contextBuffer.length > contextThreshold * 2) {
                                                                                reviewed.push(...contextBuffer.slice(0, contextThreshold));
                                                                                reviewed.push({ type: 'skip', text: '@@ ... @@', hiddenContext: contextBuffer.slice(contextThreshold, -contextThreshold) });
                                                                                reviewed.push(...contextBuffer.slice(-contextThreshold));
                                                                            } else {
                                                                                reviewed.push(...contextBuffer);
                                                                            }
                                                                            contextBuffer = [];
                                                                            reviewed.push(p);
                                                                        }
                                                                    }
                                                                    if (contextBuffer.length > contextThreshold) {
                                                                        reviewed.push(...contextBuffer.slice(0, contextThreshold));
                                                                        reviewed.push({ type: 'skip', text: '@@ ... @@', hiddenContext: contextBuffer.slice(contextThreshold) });
                                                                    } else {
                                                                        reviewed.push(...contextBuffer);
                                                                    }
                                                                    parsedLines = reviewed;
                                                                }

                                                                if (parsedLines.length === 0) {
                                                                    return <div className="px-4 py-3 text-muted-foreground bg-white/[0.02]">Only whitespace changes.</div>;
                                                                }

                                                                const ext = f.filename.split('.').pop()?.toLowerCase();
                                                                const languageMap : Record<string, any> = {
                                                                    'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx',
                                                                    'json': 'json', 'css': 'css', 'py': 'python', 'java': 'java',
                                                                    'c': 'c', 'cpp': 'cpp', 'cs': 'csharp'
                                                                };
                                                                const prismLang = (languageMap as Record<string,any>)[ext] || 'javascript';

                                                                const highlight = (text: any) => {
                                                                    if (text === '@@ ... @@') return text;
                                                                    if (text.startsWith('@@') || text.startsWith('---') || text.startsWith('+++')) return text;
                                                                    const prefix = text[0] || ' ';
                                                                    const content = text.substring(1);
                                                                    if (!content) return prefix;
                                                                    
                                                                    try {
                                                                        if (Prism.languages[prismLang]) {
                                                                            const highlighted = Prism.highlight(content, Prism.languages[prismLang], prismLang);
                                                                            return React.createElement('span', { dangerouslySetInnerHTML: { __html: prefix + highlighted } });
                                                                        }
                                                                    } catch {
                                                                        // Fallback to text if highlighter fails
                                                                    }
                                                                    return text;
                                                                };

                                                                // diffWords helper
                                                                const getWordDiffs = (oldText: any, newText: any) => {
                                                                    try {
                                                                        const changes = diffWordsWithSpace(oldText.substring(1), newText.substring(1));
                                                                        let oldHtml = '';
                                                                        let newHtml = '';
                                                                        changes.forEach((part: any) => {
                                                                            const escaped = part.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                                                            if (part.added) {
                                                                                newHtml += `<span class="bg-emerald-500/30 text-emerald-300 rounded-[2px]">${escaped}</span>`;
                                                                            } else if (part.removed) {
                                                                                oldHtml += `<span class="bg-red-500/30 text-red-300 rounded-[2px]">${escaped}</span>`;
                                                                            } else {
                                                                                oldHtml += escaped;
                                                                                newHtml += escaped;
                                                                            }
                                                                        });
                                                                        return {
                                                                            left: '-' + oldHtml,
                                                                            right: '+' + newHtml
                                                                        };
                                                                    } catch {
                                                                        return null;
                                                                    }
                                                                };

                                                                const LineNumber = ({ num }: any) => (
                                                                    <div className="w-10 shrink-0 text-right pr-2 select-none text-muted-foreground/40 bg-white/[0.01] border-r border-white/[0.04]">
                                                                        {num !== null ? num : ' '}
                                                                    </div>
                                                                );

                                                                const renderSkip = (idx: any, lineObj: any) => (
                                                                    <div key={idx} className="flex border-b border-white/[0.04] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
                                                                         onClick={() => {}}>
                                                                         <div className="w-20 shrink-0 border-r border-white/[0.04]" />
                                                                         <div className="flex-1 px-3 py-1 text-muted-foreground/50 text-center text-[10px] tracking-wider">
                                                                             Expand context ({lineObj.hiddenContext?.length || 0} lines hidden)
                                                                         </div>
                                                                    </div>
                                                                );

                                                                if (viewMode === 'inline') {
                                                                    return (
                                                                        <div className="flex flex-col min-w-0">
                                                                            {parsedLines.map((p: any, idx: any) => {
                                                                                if ((p as any).type === 'skip') return renderSkip(idx, p);
                                                                                
                                                                                let bg = 'transparent';
                                                                                let color = 'rgba(255,255,255,0.5)';
                                                                                if ((p as any).type === 'insert') { bg = 'rgba(16,185,129,0.08)'; color = '#6ee7b7'; }
                                                                                else if ((p as any).type === 'delete') { bg = 'rgba(239,68,68,0.08)'; color = '#fca5a5'; }
                                                                                else if ((p as any).type === 'header') { bg = 'rgba(59,130,246,0.06)'; color = '#93c5fd'; }
                                                                                
                                                                                return (
                                                                                    <div key={idx} className="flex hover:bg-white/[0.02] group">
                                                                                        <div className="flex w-20 shrink-0 border-r border-white/[0.04]">
                                                                                            <LineNumber num={(p as any).oldLine} />
                                                                                            <LineNumber num={(p as any).newLine} />
                                                                                        </div>
                                                                                        <div className={`flex-1 px-3 py-px overflow-x-auto min-w-0 ${wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`} style={{ background: bg, color }}>
                                                                                            {highlight((p as any).text)}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    // Split Mode Parsing
                                                                    let splitRows = [];
                                                                    let ptr = 0;
                                                                    while (ptr < parsedLines.length) {
                                                                        const p = parsedLines[ptr];
                                                                        if ((p as any).type === 'skip') {
                                                                            splitRows.push({ type: 'skip', skipObj: p });
                                                                            ptr++;
                                                                        } else if ((p as any).type === 'header' || (p as any).type === 'info') {
                                                                            splitRows.push({ type: 'header', left: p, right: p });
                                                                            ptr++;
                                                                        } else if ((p as any).type === 'context') {
                                                                            splitRows.push({ type: 'context', left: p, right: p });
                                                                            ptr++;
                                                                        } else if ((p as any).type === 'delete') {
                                                                            let dels = [];
                                                                            while (ptr < parsedLines.length && parsedLines[ptr]!.type === 'delete') {
                                                                                dels.push(parsedLines[ptr]);
                                                                                ptr++;
                                                                            }
                                                                            let adds = [];
                                                                            while (ptr < parsedLines.length && parsedLines[ptr]!.type === 'insert') {
                                                                                adds.push(parsedLines[ptr]);
                                                                                ptr++;
                                                                            }
                                                                            const maxLen = Math.max(dels.length, adds.length);
                                                                            for (let k = 0; k < maxLen; k++) {
                                                                                splitRows.push({ type: 'change', left: dels[k] || null, right: adds[k] || null });
                                                                            }
                                                                        } else if ((p as any).type === 'insert') {
                                                                            splitRows.push({ type: 'change', left: null, right: p });
                                                                            ptr++;
                                                                        }
                                                                    }
                                                                    
                                                                    return (
                                                                        <div className="grid grid-cols-2 overflow-hidden bg-white/[0.01]">
                                                                            {/* Left Column */}
                                                                            <div className="overflow-x-auto border-r border-white/[0.04] flex flex-col min-w-0 pb-1 custom-scrollbar">
                                                                                {splitRows.map((row: any, idx: any) => {
                                                                                    if (row.type === 'skip') {
                                                                                        return <div key={idx} className="h-6 bg-white/[0.02] border-b border-white/[0.04] text-[10px] text-muted-foreground flex items-center justify-center">Expand context</div>;
                                                                                    }
                                                                                    const lineObj = row.left;
                                                                                    if (!lineObj) {
                                                                                        return (
                                                                                            <div key={idx} className="flex min-h-[20px] bg-white/[0.01]">
                                                                                                <LineNumber num={null} />
                                                                                                <div className="flex-1 px-3 border-r border-white/[0.04]" />
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    let bg = lineObj.type === 'delete' ? 'rgba(239,68,68,0.08)' : lineObj.type === 'header' ? 'rgba(59,130,246,0.06)' : 'transparent';
                                                                                    let color = lineObj.type === 'delete' ? '#fca5a5' : lineObj.type === 'header' ? '#93c5fd' : 'rgba(255,255,255,0.5)';
                                                                                    
                                                                                    let contentNode = highlight(lineObj.text);
                                                                                    if (row.type === 'change' && row.left && row.right) {
                                                                                        const words = getWordDiffs(row.left.text, row.right.text);
                                                                                        if (words) {
                                                                                            contentNode = <span dangerouslySetInnerHTML={{ __html: words.left }} />;
                                                                                        }
                                                                                    }

                                                                                    return (
                                                                                        <div key={idx} className="flex min-h-[20px] hover:bg-white/[0.02]" style={{ background: bg, color }}>
                                                                                            <LineNumber num={lineObj.oldLine} />
                                                                                            <div className={`flex-1 px-3 border-r border-white/[0.04] ${wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>{contentNode}</div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                    {/* Right Column */}
                                                                    <div className="overflow-x-auto flex flex-col min-w-0 pb-1 custom-scrollbar">
                                                                        {splitRows.map((row: any, idx: any) => {
                                                                            if (row.type === 'skip') {
                                                                                return <div key={idx} className="h-6 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-center text-[10px] text-muted-foreground/50">Expand context</div>;
                                                                            }
                                                                            const lineObj = row.right;
                                                                            if (!lineObj) {
                                                                                return (
                                                                                    <div key={idx} className="flex min-h-[20px] bg-white/[0.01]">
                                                                                        <LineNumber num={null} />
                                                                                        <div className="flex-1 px-3" />
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            let bg = lineObj.type === 'insert' ? 'rgba(16,185,129,0.08)' : lineObj.type === 'header' ? 'rgba(59,130,246,0.06)' : 'transparent';
                                                                            let color = lineObj.type === 'insert' ? '#6ee7b7' : lineObj.type === 'header' ? '#93c5fd' : 'rgba(255,255,255,0.5)';
                                                                            
                                                                            let contentNode = highlight(lineObj.text);
                                                                            if (row.type === 'change' && row.left && row.right) {
                                                                                const words = getWordDiffs(row.left.text, row.right.text);
                                                                                if (words) {
                                                                                    contentNode = <span dangerouslySetInnerHTML={{ __html: words.right }} />;
                                                                                }
                                                                            }

                                                                            return (
                                                                                <div key={idx} className="flex min-h-[20px] hover:bg-white/[0.02]" style={{ background: bg, color }}>
                                                                                    <LineNumber num={lineObj.newLine} />
                                                                                    <div className={`flex-1 px-3 ${wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>{contentNode}</div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        {/* Large Diff / Collapsed State indicator */}
                                        {!isExpanded && f.changes > 100 && (
                                            <div className="mx-4 mb-3 text-center py-2 text-[11px] font-medium text-muted-foreground/60 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:text-foreground transition-colors cursor-pointer"
                                                onClick={() => toggleFile(f.filename)}>
                                                Large diff collapsed ({f.changes} changes) • Click to Expand
                                            </div>
                                        )}
                                        {isExpanded && !f.patch && (
                                            <div className="mx-4 mb-3 text-center py-4 text-[12px] text-muted-foreground/40 rounded-lg"
                                                style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                Binary file or diff too large to display
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div id="lazy-load-sentinel" className="h-[1px]" />
                        </>
                    )}
                </div>
            </div>
        </>
    )}

            {/* ── PR Modal ────────────────────────── */}
            {showPRModal && data && (
                <CreatePRModal
                    owner={owner}
                    repo={repo?.name}
                    head={head}
                    base={base}
                    stats={{
                        totalCommits: (data as any).totalCommits,
                        totalFiles: (data as any).totalFiles,
                        totalAdditions: (data as any).totalAdditions,
                        totalDeletions: (data as any).totalDeletions,
                    }}
                    compareData={activeData}
                    onClose={() => setShowPRModal(false)}
                    onCreated={() => {}}
                />
            )}
        </div>
    );
}

