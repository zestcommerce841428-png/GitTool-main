'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import {
    FileText, Sparkles, Loader2, Copy, Download, Check,
    Send, Eye, Code2, RefreshCw, Wand2,
    AlignLeft, Boxes, GitFork, Shield, BookOpen, Wrench,
    Users, Layers, MessageSquare, RotateCcw, ArrowRight,
    Minimize2, Building2, Palette, Library,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

/* -----------------------------------------------------------------------
   TEMPLATES
------------------------------------------------------------------------ */
const TEMPLATES = [
    {
        value: 'professional',
        label: 'Professional',
        icon: Building2,
        desc: 'Enterprise-grade. Formal tone, structured sections.',
        gradient: 'from-blue-500/20 to-indigo-500/10',
        accent: '#3b82f6',
        border: 'rgba(59,130,246,0.35)',
    },
    {
        value: 'minimalist',
        label: 'Minimalist',
        icon: Minimize2,
        desc: 'Brutally concise. Just what devs need.',
        gradient: 'from-violet-500/20 to-purple-500/10',
        accent: '#8b5cf6',
        border: 'rgba(139,92,246,0.35)',
    },
    {
        value: 'creative',
        label: 'Creative',
        icon: Palette,
        desc: 'Emojis, badges, fun tone. Open source vibes.',
        gradient: 'from-pink-500/20 to-rose-500/10',
        accent: '#ec4899',
        border: 'rgba(236,72,153,0.35)',
    },
    {
        value: 'detailed',
        label: 'Detailed',
        icon: Library,
        desc: 'Every section fleshed out. Full documentation.',
        gradient: 'from-emerald-500/20 to-teal-500/10',
        accent: '#10b981',
        border: 'rgba(16,185,129,0.35)',
    },
];

/* -----------------------------------------------------------------------
   SECTIONS
------------------------------------------------------------------------ */
const ALL_SECTIONS = [
    { id: 'overview',       label: 'Overview',       icon: AlignLeft,  default: true  },
    { id: 'features',       label: 'Features',        icon: Layers,     default: true  },
    { id: 'installation',   label: 'Installation',    icon: Boxes,      default: true  },
    { id: 'usage',          label: 'Usage',           icon: BookOpen,   default: true  },
    { id: 'configuration',  label: 'Config',          icon: Wrench,     default: false },
    { id: 'api',            label: 'API Ref',         icon: Code2,      default: false },
    { id: 'contributing',   label: 'Contributing',    icon: Users,      default: true  },
    { id: 'security',       label: 'Security',        icon: Shield,     default: false },
    { id: 'forks',          label: 'Roadmap',         icon: GitFork,    default: false },
    { id: 'license',        label: 'License',         icon: FileText,   default: true  },
];

const QUICK_PROMPTS = [
    'Add Docker / containerization steps',
    'Add shields.io badges at the top',
    'Make the tone more beginner-friendly',
    'Add a FAQ section',
    'Shorten the overview to 2 sentences',
];

const LOAD_STEPS = [
    'Scanning repository structure...',
    'Detecting tech stack & dependencies...',
    'Writing documentation...',
];

interface ChatEntry { prompt: string; ts: number; }

/* -----------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------------ */
export default function ReadmeGenerator() {
    const { selectedRepo: repo } = useWorkspace();

    const [template, setTemplate] = useState('professional');
    const [sections, setSections] = useState<Record<string, boolean>>(
        Object.fromEntries(ALL_SECTIONS.map(s => [s.id, s.default]))
    );
    const [readme, setReadme]       = useState('');
    const [tab, setTab]             = useState<'preview' | 'markdown'>('preview');
    const [loading, setLoading]     = useState(false);
    const [loadStep, setLoadStep]   = useState(0);
    const [chatting, setChatting]   = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [copied, setCopied]       = useState(false);
    const [copiedMd, setCopiedMd]   = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
    const chatRef   = useRef<HTMLInputElement>(null);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    const owner        = repo?.owner?.login || repo?.full_name?.split('/')[0];
    const wordCount    = readme ? readme.split(/\s+/).filter(Boolean).length : 0;
    const lineCount    = readme ? readme.split('\n').length : 0;
    const selectedTpl  = TEMPLATES.find(t => t.value === template)!;
    const enabledSections = ALL_SECTIONS.filter(s => sections[s.id]).map(s => s.id);

    /* ---- Loading step ticker ---- */
    const startTicker = useCallback(() => {
        setLoadStep(0);
        timerRef.current = setInterval(() => {
            setLoadStep(s => Math.min(s + 1, LOAD_STEPS.length - 1));
        }, 1800);
    }, []);
    const stopTicker = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, []);

    /* ---- Generate ---- */
    const handleGenerate = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null); setReadme('');
        startTicker();
        try {
            const res = await api.post('/readme', { owner, repo: repo.name, template, sections: enabledSections });
            setReadme(res.readme || '');
            setTab('preview');
            setChatHistory([]);
        } catch (err: any) {
            setError(err.message || 'Generation failed');
        } finally {
            stopTicker();
            setLoading(false);
        }
    };

    /* ---- AI Chat edit ---- */
    const handleChat = async () => {
        const prompt = chatInput.trim();
        if (!prompt || !readme) return;
        setChatting(true); setError(null);
        try {
            const res = await api.post('/readme/chat', { currentMarkdown: readme, prompt, owner, repo: repo?.name });
            setReadme(res.readme || readme);
            setChatHistory(h => [...h, { prompt, ts: Date.now() }]);
            setChatInput('');
        } catch (err: any) {
            setError(err.message || 'Edit failed');
        } finally {
            setChatting(false);
        }
    };

    /* ---- Copy / Download ---- */
    const handleCopy = () => { navigator.clipboard.writeText(readme); setCopied(true); setTimeout(() => setCopied(false), 1800); };
    const handleCopyMd = () => { navigator.clipboard.writeText(readme); setCopiedMd(true); setTimeout(() => setCopiedMd(false), 1800); };
    const handleDownload = () => {
        const blob = new Blob([readme], { type: 'text/markdown' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'README.md'; a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => { if (readme && chatRef.current) chatRef.current.focus(); }, [readme]);
    useEffect(() => () => stopTicker(), [stopTicker]);

    const toggleSection = (id: string) => setSections(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="tool-page max-w-[1440px]">
            <SEO
                title="AI README Generator - Auto Generate README from GitHub Repo"
                description="The best free AI readme generator online. Auto generate a README.md from any GitHub repo in seconds."
                keywords={['readme generator', 'ai readme generator', 'github readme generator', 'markdown readme generator free']}
                noIndex={true}
            />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText size={16} />
                    </div>
                    <h2 className="tool-page-title">README Generator</h2>
                    {readme && (
                        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full border border-border/50 bg-muted/40 text-muted-foreground">
                            {wordCount.toLocaleString()} words &middot; {lineCount} lines
                        </span>
                    )}
                </div>
            </NavbarPortal>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">

                {/* ============================================================
                    LEFT RAIL
                ============================================================ */}
                <aside className="flex flex-col gap-3">

                    {/* Step 1 — Style */}
                    <div className="panel overflow-visible">
                        <div className="px-4 pt-4 pb-3 flex items-center gap-2.5 border-b border-border/50">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">1</span>
                            <span className="text-[12px] font-semibold text-foreground/80 uppercase tracking-wider">Choose Style</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-2">
                            {TEMPLATES.map(t => {
                                const Icon = t.icon;
                                const active = template === t.value;
                                return (
                                    <button
                                        key={t.value}
                                        onClick={() => setTemplate(t.value)}
                                        className={`relative flex flex-col items-start gap-1.5 rounded-xl p-3 text-left transition-all duration-200 border ${active ? 'shadow-md' : 'border-border/40 hover:border-border hover:bg-muted/30'}`}
                                        style={active ? {
                                            background: `linear-gradient(135deg, ${t.accent}18, ${t.accent}06)`,
                                            borderColor: t.border,
                                            boxShadow: `0 0 0 1px ${t.border}, 0 4px 16px ${t.accent}18`,
                                        } : {}}
                                    >
                                        {active && (
                                            <span className="absolute top-2 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: t.accent }}>
                                                <Check size={8} className="text-white" strokeWidth={3} />
                                            </span>
                                        )}
                                        <Icon size={16} style={{ color: active ? t.accent : undefined }} className={active ? '' : 'text-muted-foreground'} />
                                        <div>
                                            <div className="text-[12px] font-semibold leading-none" style={{ color: active ? t.accent : 'var(--foreground)' }}>
                                                {t.label}
                                            </div>
                                            <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{t.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2 — Sections */}
                    <div className="panel">
                        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">2</span>
                                <span className="text-[12px] font-semibold text-foreground/80 uppercase tracking-wider">Sections</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{enabledSections.length}/{ALL_SECTIONS.length}</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-1.5">
                            {ALL_SECTIONS.map(s => {
                                const Icon = s.icon;
                                const on   = sections[s.id];
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => toggleSection(s.id)}
                                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-all border ${on ? 'bg-primary/8 border-primary/20 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                                    >
                                        <Icon size={12} className={on ? 'text-primary' : 'opacity-40'} />
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3 — Generate */}
                    <div className="panel p-3 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5 px-1">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">3</span>
                            <span className="text-[12px] font-semibold text-foreground/80 uppercase tracking-wider">Generate</span>
                        </div>
                        {error && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-[11px] text-destructive leading-relaxed">
                                {error}
                            </div>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !repo}
                            className="relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-[13px] font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: repo && !loading
                                    ? `linear-gradient(135deg, ${selectedTpl.accent}dd, ${selectedTpl.accent}99)`
                                    : 'var(--muted)',
                                color: '#fff',
                                boxShadow: repo && !loading ? `0 4px 20px ${selectedTpl.accent}44` : 'none',
                            }}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading
                                    ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
                                    : readme
                                        ? <><RefreshCw size={15} /> Regenerate</>
                                        : <><Sparkles size={15} /> Generate README</>
                                }
                            </span>
                            {/* shimmer */}
                            {!loading && repo && (
                                <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            )}
                        </button>
                        {!repo ? (
                            <p className="text-center text-[10px] text-muted-foreground px-2">
                                Select a repository in the top bar first
                            </p>
                        ) : (
                            <p className="text-center text-[10px] text-muted-foreground px-2">
                                {repo.name} &middot; {selectedTpl.label} style &middot; {enabledSections.length} sections
                            </p>
                        )}
                    </div>
                </aside>

                {/* ============================================================
                    RIGHT — Output
                ============================================================ */}
                <div className="flex flex-col gap-4 min-w-0">

                    {/* ---- Empty state ---- */}
                    {!readme && !loading && (
                        <div className="panel relative overflow-hidden flex flex-col items-center justify-center py-20 text-center gap-5">
                            {/* bg decoration */}
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                <FileText size={260} />
                            </div>
                            <div
                                className="relative flex h-20 w-20 items-center justify-center rounded-2xl"
                                style={{
                                    background: `linear-gradient(135deg, ${selectedTpl.accent}22, ${selectedTpl.accent}0a)`,
                                    border: `1px solid ${selectedTpl.border}`,
                                    boxShadow: `0 8px 32px ${selectedTpl.accent}22`,
                                }}
                            >
                                <FileText size={32} style={{ color: selectedTpl.accent }} />
                            </div>
                            <div className="max-w-sm">
                                <p className="text-[16px] font-bold text-foreground">Your README starts here</p>
                                <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                                    Pick a style, choose your sections, and let AI write a production-ready README for {repo ? <strong className="text-foreground">{repo.name}</strong> : 'your repo'}.
                                </p>
                            </div>
                            {repo && (
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all"
                                    style={{
                                        background: `linear-gradient(135deg, ${selectedTpl.accent}dd, ${selectedTpl.accent}88)`,
                                        boxShadow: `0 4px 16px ${selectedTpl.accent}33`,
                                    }}
                                >
                                    <Sparkles size={15} /> Generate for {repo.name}
                                    <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* ---- Loading state ---- */}
                    {loading && (
                        <div className="panel flex flex-col items-center justify-center py-20 gap-6">
                            <div className="relative flex h-20 w-20 items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                                    <circle cx="40" cy="40" r="36" fill="none" strokeWidth="2"
                                        stroke={selectedTpl.accent}
                                        strokeLinecap="round"
                                        strokeDasharray="226"
                                        strokeDashoffset={226 - (226 * (loadStep + 1)) / LOAD_STEPS.length}
                                        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                                    />
                                </svg>
                                <Sparkles size={26} style={{ color: selectedTpl.accent }} className="animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-[15px] font-bold text-foreground">Analyzing {repo?.name}...</p>
                                <p className="mt-1 text-[12px] text-muted-foreground">This usually takes 10-20 seconds</p>
                            </div>
                            <div className="flex flex-col gap-2 w-52">
                                {LOAD_STEPS.map((s, i) => (
                                    <div key={i} className={`flex items-center gap-2.5 text-[11px] transition-all duration-500 ${i <= loadStep ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                                        {i < loadStep
                                            ? <Check size={12} className="shrink-0" style={{ color: selectedTpl.accent }} />
                                            : i === loadStep
                                                ? <Loader2 size={12} className="animate-spin shrink-0" style={{ color: selectedTpl.accent }} />
                                                : <span className="h-3 w-3 rounded-full border border-current shrink-0" />
                                        }
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ---- Output panel ---- */}
                    {readme && !loading && (
                        <div className="panel flex flex-col overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20 shrink-0 flex-wrap gap-2">
                                {/* Tabs */}
                                <div className="flex items-center gap-0.5 rounded-lg bg-background border border-border/50 p-0.5">
                                    {([['preview', Eye, 'Preview'], ['markdown', Code2, 'Markdown']] as const).map(([t, Icon, label]) => (
                                        <button
                                            key={t}
                                            onClick={() => setTab(t)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <Icon size={12} /> {label}
                                        </button>
                                    ))}
                                </div>

                                {/* File info + actions */}
                                <div className="flex items-center gap-2">
                                    <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono bg-muted/60 border border-border/40 rounded px-2 py-1 text-muted-foreground">
                                        <FileText size={10} /> README.md
                                    </span>
                                    <button
                                        onClick={tab === 'preview' ? handleCopy : handleCopyMd}
                                        className="btn-ghost-sm flex items-center gap-1.5"
                                    >
                                        {(tab === 'preview' ? copied : copiedMd)
                                            ? <><Check size={12} className="text-emerald-500" /> Copied</>
                                            : <><Copy size={12} /> Copy</>
                                        }
                                    </button>
                                    <button onClick={handleDownload} className="btn-ghost-sm flex items-center gap-1.5">
                                        <Download size={12} /> .md
                                    </button>
                                </div>
                            </div>

                            {/* Content area */}
                            {tab === 'preview' ? (
                                <div className="overflow-auto" style={{ maxHeight: '62vh' }}>
                                    <div className="readme-preview px-8 py-6 text-[13.5px] leading-[1.9]">
                                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{readme}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-auto bg-[#0d1117]" style={{ maxHeight: '62vh' }}>
                                    <pre className="m-0 px-6 py-5 text-[12px] leading-relaxed text-slate-300 whitespace-pre-wrap font-mono">
                                        {readme}
                                    </pre>
                                </div>
                            )}

                            {/* AI edit bar */}
                            <div className="border-t border-border/50 bg-muted/10 shrink-0">
                                {/* Quick prompts */}
                                {chatHistory.length === 0 && (
                                    <div className="px-4 pt-3 pb-0 flex flex-wrap gap-1.5">
                                        <span className="text-[10px] text-muted-foreground/60 self-center mr-1 font-medium">Try:</span>
                                        {QUICK_PROMPTS.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => { setChatInput(p); chatRef.current?.focus(); }}
                                                className="rounded-full border border-border/50 bg-background px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40 transition-colors"
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Chat history */}
                                {chatHistory.length > 0 && (
                                    <div className="px-4 pt-3 flex flex-col gap-1 max-h-[72px] overflow-y-auto">
                                        {chatHistory.map((entry, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground/50">
                                                <MessageSquare size={10} className="shrink-0 mt-0.5 text-primary/40" />
                                                <span className="italic truncate">{entry.prompt}</span>
                                                <button
                                                    onClick={() => { setChatInput(entry.prompt); chatRef.current?.focus(); }}
                                                    className="ml-auto shrink-0 hover:text-foreground transition-colors"
                                                    title="Re-apply"
                                                >
                                                    <RotateCcw size={9} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Input */}
                                <div className="flex items-center gap-2 p-3">
                                    <div className="relative flex-1">
                                        <Wand2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                                        <input
                                            ref={chatRef}
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                                            placeholder="Ask AI to edit this README..."
                                            className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 pl-9 text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleChat}
                                        disabled={chatting || !chatInput.trim()}
                                        className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-all disabled:opacity-40"
                                        style={{ background: `linear-gradient(135deg, ${selectedTpl.accent}dd, ${selectedTpl.accent}88)` }}
                                    >
                                        {chatting ? <><Loader2 size={13} className="animate-spin" /> Editing...</> : <><Send size={13} /> Edit</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }

                .readme-preview h1 { font-size: 1.55rem; font-weight: 800; margin: 0 0 .75rem; padding-bottom: .6rem; border-bottom: 1px solid color-mix(in oklch, var(--border) 60%, transparent); }
                .readme-preview h2 { font-size: 1.15rem; font-weight: 700; margin: 1.75rem 0 .5rem; padding-bottom: .35rem; border-bottom: 1px solid color-mix(in oklch, var(--border) 40%, transparent); }
                .readme-preview h3 { font-size: .95rem; font-weight: 600; margin: 1.25rem 0 .4rem; }
                .readme-preview p  { margin-bottom: .75rem; color: color-mix(in oklch, var(--foreground) 80%, transparent); }
                .readme-preview ul, .readme-preview ol { padding-left: 1.5rem; margin-bottom: .75rem; }
                .readme-preview li { margin-bottom: .25rem; color: color-mix(in oklch, var(--foreground) 75%, transparent); }
                .readme-preview code { background: color-mix(in oklch, var(--muted) 80%, transparent); border: 1px solid var(--border); border-radius: 4px; padding: .1em .4em; font-size: .83em; font-family: 'JetBrains Mono', monospace; color: #93c5fd; }
                .readme-preview pre { background: #0d1117; border: 1px solid var(--border); border-radius: 10px; padding: 1.1rem; overflow-x: auto; margin-bottom: 1rem; }
                .readme-preview pre code { background: transparent; border: none; padding: 0; color: #e2e8f0; font-size: .82rem; }
                .readme-preview blockquote { border-left: 3px solid var(--primary); margin: .5rem 0 1rem; padding: .5rem 1rem; background: color-mix(in oklch, var(--primary) 6%, transparent); border-radius: 0 8px 8px 0; }
                .readme-preview table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: .84rem; }
                .readme-preview th { text-align: left; padding: .5rem .75rem; background: var(--muted); border: 1px solid var(--border); font-weight: 600; }
                .readme-preview td { padding: .5rem .75rem; border: 1px solid color-mix(in oklch, var(--border) 60%, transparent); }
                .readme-preview a { color: #93c5fd; text-underline-offset: 3px; }
                .readme-preview img { max-width: 100%; border-radius: 8px; }
                .readme-preview hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
            `}</style>
        </div>
    );
}
